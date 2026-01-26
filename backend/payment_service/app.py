"""
PetCareApp - Payment Service with Stripe Integration
Full payment processing with invoices, refunds, and webhooks
@author VS
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import uuid
import logging
from datetime import datetime, timedelta
from functools import wraps

# Stripe integration
try:
    import stripe
    STRIPE_AVAILABLE = True
except ImportError:
    STRIPE_AVAILABLE = False

# Add shared modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'shared'))

try:
    from dynamodb_config import get_table, scan_table
    from kafka_events import producer, EventTypes, KafkaConfig
    DYNAMO_AVAILABLE = True
except ImportError:
    DYNAMO_AVAILABLE = False

# Configuration
app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Stripe configuration
STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY', '')
STRIPE_PUBLIC_KEY = os.getenv('STRIPE_PUBLIC_KEY', '')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET', '')

if STRIPE_AVAILABLE and STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY
    logger.info("Stripe configured successfully")
else:
    logger.warning("Stripe not configured - using simulation mode")

# In-memory storage for development
invoices_db = {}
payments_db = {}


# ============== Helpers ==============

def generate_id():
    return str(uuid.uuid4())


def get_invoice_table():
    if DYNAMO_AVAILABLE and os.getenv('APP_ENV') == 'production':
        return get_table('invoices')
    return None


def simulate_payment(amount, method):
    """Simulate payment for development/testing"""
    import random
    success = random.random() < 0.9
    return {
        'success': success,
        'transaction_id': f"sim_{generate_id()[:8]}",
        'message': 'Payment successful' if success else 'Payment declined'
    }


# ============== Auth Middleware ==============

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header and os.getenv('APP_ENV') == 'production':
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated


# ============== Invoice Endpoints ==============

@app.route('/invoices', methods=['GET'])
@require_auth
def get_invoices():
    """Get all invoices"""
    client_id = request.args.get('clientId')
    status = request.args.get('status')
    
    table = get_invoice_table()
    items = scan_table(table) if table else list(invoices_db.values())
    
    if client_id:
        items = [i for i in items if i.get('clientId') == client_id]
    if status:
        items = [i for i in items if i.get('status') == status]
    
    return jsonify(items)


@app.route('/invoices/<invoice_id>', methods=['GET'])
@require_auth
def get_invoice(invoice_id):
    """Get single invoice"""
    table = get_invoice_table()
    
    if table:
        response = table.get_item(Key={'id': invoice_id})
        invoice = response.get('Item')
    else:
        invoice = invoices_db.get(invoice_id)
    
    if not invoice:
        return jsonify({'error': 'Invoice not found'}), 404
    
    return jsonify(invoice)


@app.route('/invoices', methods=['POST'])
@require_auth
def create_invoice():
    """Create new invoice"""
    data = request.get_json()
    
    required = ['clientId', 'items']
    for field in required:
        if field not in data:
            return jsonify({'error': f'Missing: {field}'}), 400
    
    items = data.get('items', [])
    subtotal = sum(item.get('price', 0) * item.get('quantity', 1) for item in items)
    tax = subtotal * 0.23
    total = subtotal + tax
    
    invoice = {
        'id': generate_id(),
        'invoiceNumber': f"INV-{datetime.now().strftime('%Y%m')}-{generate_id()[:6].upper()}",
        'clientId': data['clientId'],
        'petId': data.get('petId'),
        'appointmentId': data.get('appointmentId'),
        'items': items,
        'subtotal': round(subtotal, 2),
        'tax': round(tax, 2),
        'total': round(total, 2),
        'currency': 'PLN',
        'status': 'pending',
        'dueDate': (datetime.now() + timedelta(days=14)).isoformat(),
        'createdAt': datetime.utcnow().isoformat(),
        'updatedAt': datetime.utcnow().isoformat()
    }
    
    table = get_invoice_table()
    if table:
        table.put_item(Item=invoice)
    else:
        invoices_db[invoice['id']] = invoice
    
    logger.info(f"Created invoice: {invoice['invoiceNumber']}")
    return jsonify(invoice), 201


# ============== Payment Endpoints ==============

@app.route('/payments/create-intent', methods=['POST'])
@require_auth
def create_payment_intent():
    """Create Stripe payment intent"""
    data = request.get_json()
    
    invoice_id = data.get('invoiceId')
    amount = data.get('amount')
    
    if not amount and invoice_id:
        table = get_invoice_table()
        if table:
            response = table.get_item(Key={'id': invoice_id})
            invoice = response.get('Item', {})
        else:
            invoice = invoices_db.get(invoice_id, {})
        amount = invoice.get('total', 0)
    
    if not amount:
        return jsonify({'error': 'Amount required'}), 400
    
    amount_cents = int(float(amount) * 100)
    
    if STRIPE_AVAILABLE and STRIPE_SECRET_KEY:
        try:
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency='pln',
                metadata={'invoice_id': invoice_id or '', 'source': 'petcareapp'}
            )
            return jsonify({
                'clientSecret': intent.client_secret,
                'paymentIntentId': intent.id,
                'amount': amount,
                'mode': 'stripe'
            })
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error: {e}")
            return jsonify({'error': str(e)}), 400
    else:
        return jsonify({
            'clientSecret': f"sim_secret_{generate_id()}",
            'paymentIntentId': f"sim_pi_{generate_id()[:12]}",
            'amount': amount,
            'mode': 'simulation'
        })


@app.route('/payments/process', methods=['POST'])
@require_auth
def process_payment():
    """Process payment (simulation mode)"""
    data = request.get_json()
    
    invoice_id = data.get('invoiceId')
    method = data.get('method', 'card')
    
    table = get_invoice_table()
    if table:
        response = table.get_item(Key={'id': invoice_id})
        invoice = response.get('Item')
    else:
        invoice = invoices_db.get(invoice_id)
    
    if not invoice:
        return jsonify({'error': 'Invoice not found'}), 404
    
    if invoice.get('status') == 'paid':
        return jsonify({'error': 'Already paid'}), 400
    
    amount = invoice.get('total')
    result = simulate_payment(amount, method)
    
    if result['success']:
        payment = {
            'id': generate_id(),
            'invoiceId': invoice_id,
            'amount': amount,
            'currency': 'PLN',
            'method': method,
            'status': 'completed',
            'transactionId': result['transaction_id'],
            'paidAt': datetime.utcnow().isoformat()
        }
        
        payments_db[payment['id']] = payment
        
        invoice['status'] = 'paid'
        invoice['paidAt'] = payment['paidAt']
        invoice['paymentId'] = payment['id']
        
        if table:
            table.put_item(Item=invoice)
        else:
            invoices_db[invoice_id] = invoice
        
        logger.info(f"Payment processed: {payment['id']}")
        
        return jsonify({
            'success': True,
            'payment': payment,
            'invoice': invoice
        })
    else:
        return jsonify({'success': False, 'error': result['message']}), 400


@app.route('/payments/refund', methods=['POST'])
@require_auth
def process_refund():
    """Process refund"""
    data = request.get_json()
    
    payment_id = data.get('paymentId')
    amount = data.get('amount')
    reason = data.get('reason', 'Customer request')
    
    payment = payments_db.get(payment_id)
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404
    
    refund_amount = amount or payment.get('amount')
    
    refund = {
        'id': generate_id(),
        'paymentId': payment_id,
        'amount': refund_amount,
        'reason': reason,
        'status': 'completed',
        'refundedAt': datetime.utcnow().isoformat()
    }
    
    payment['status'] = 'refunded'
    
    logger.info(f"Refund: {refund['id']}")
    
    return jsonify({'success': True, 'refund': refund})


# ============== Stripe Webhook ==============

@app.route('/payments/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhooks"""
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    
    if not STRIPE_AVAILABLE or not STRIPE_WEBHOOK_SECRET:
        return jsonify({'message': 'Webhook received'}), 200
    
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    
    if event['type'] == 'payment_intent.succeeded':
        intent = event['data']['object']
        invoice_id = intent['metadata'].get('invoice_id')
        logger.info(f"Stripe payment succeeded: {intent['id']}")
        
        if invoice_id:
            table = get_invoice_table()
            if table:
                table.update_item(
                    Key={'id': invoice_id},
                    UpdateExpression='SET #s = :s, paidAt = :p',
                    ExpressionAttributeNames={'#s': 'status'},
                    ExpressionAttributeValues={':s': 'paid', ':p': datetime.utcnow().isoformat()}
                )
    
    return jsonify({'received': True}), 200


# ============== Health & Stats ==============

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'payment-service',
        'stripe_configured': bool(STRIPE_SECRET_KEY),
        'mode': 'production' if STRIPE_SECRET_KEY else 'simulation'
    })


@app.route('/stats', methods=['GET'])
def stats():
    """Get payment statistics"""
    invoices = list(invoices_db.values())
    
    return jsonify({
        'total_invoices': len(invoices),
        'paid_invoices': len([i for i in invoices if i.get('status') == 'paid']),
        'pending_invoices': len([i for i in invoices if i.get('status') == 'pending']),
        'total_invoiced': sum(i.get('total', 0) for i in invoices),
        'total_paid': sum(i.get('total', 0) for i in invoices if i.get('status') == 'paid'),
        'currency': 'PLN'
    })


# Demo Data
def init_demo_data():
    demo = [
        {'id': 'inv_001', 'invoiceNumber': 'INV-2024-001', 'clientId': 'client_001',
         'items': [{'name': 'Konsultacja', 'price': 100, 'quantity': 1}],
         'subtotal': 100, 'tax': 23, 'total': 123, 'currency': 'PLN', 'status': 'paid',
         'dueDate': '2024-12-15', 'createdAt': '2024-12-01'},
        {'id': 'inv_002', 'invoiceNumber': 'INV-2024-002', 'clientId': 'client_001',
         'items': [{'name': 'USG', 'price': 200, 'quantity': 1}],
         'subtotal': 200, 'tax': 46, 'total': 246, 'currency': 'PLN', 'status': 'pending',
         'dueDate': '2024-12-20', 'createdAt': '2024-12-06'}
    ]
    for inv in demo:
        invoices_db[inv['id']] = inv


init_demo_data()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8006))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('APP_ENV') != 'production')
