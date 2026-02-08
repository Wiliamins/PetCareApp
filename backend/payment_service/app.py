"""
PetCareApp - Payment Service
Serwis płatności z Stripe i AWS DynamoDB
@author VS
"""

from flask import Flask, request, jsonify

from datetime import datetime
import uuid
import os
import logging
import boto3
from botocore.exceptions import ClientError
import stripe

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)


AWS_REGION = os.getenv('AWS_REGION', 'eu-north-1')
TABLE_NAME = 'PetCareApp-Payments'
STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY', '')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET', '')

# Configure Stripe - VS
if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY
    logger.info("Stripe configured")
else:
    logger.warning("Stripe not configured")

# DynamoDB - VS
dynamodb = None
table = None
try:
    dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
    table = dynamodb.Table(TABLE_NAME)
    logger.info(f"DynamoDB connected: {TABLE_NAME}")
except Exception as e:
    logger.warning(f"DynamoDB not available: {e}")

payments_db = {}

def save_payment(payment):
    if table:
        try:
            table.put_item(Item=payment)
            return True
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
    payments_db[payment['id']] = payment
    return True

def get_payments_by_user(user_id):
    if table:
        try:
            response = table.query(
                IndexName='userId-index',
                KeyConditionExpression='userId = :uid',
                ExpressionAttributeValues={':uid': user_id}
            )
            return response.get('Items', [])
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
    return [p for p in payments_db.values() if p.get('userId') == user_id]

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    return jsonify({
        'service': 'payment-service',
        'status': 'healthy',
        'stripe': bool(STRIPE_SECRET_KEY),
        'dynamodb': table is not None
    })

@app.route('/api/v1/payments', methods=['GET'])
def get_payments():
    """Get payments for user - VS"""
    user_id = request.args.get('userId')
    
    if user_id:
        payments = get_payments_by_user(user_id)
    elif table:
        try:
            response = table.scan()
            payments = response.get('Items', [])
        except:
            payments = list(payments_db.values())
    else:
        payments = list(payments_db.values())
    
    return jsonify(payments)

@app.route('/api/v1/payments/<payment_id>', methods=['GET'])
def get_payment(payment_id):
    if table:
        try:
            response = table.get_item(Key={'id': payment_id})
            payment = response.get('Item')
            if payment:
                return jsonify(payment)
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
    
    payment = payments_db.get(payment_id)
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404
    return jsonify(payment)

@app.route('/api/v1/payments/create-intent', methods=['POST'])
def create_payment_intent():
    """Create Stripe payment intent - VS"""
    data = request.get_json()
    
    amount = data.get('amount', 0)
    currency = data.get('currency', 'pln')
    user_id = data.get('userId')
    appointment_id = data.get('appointmentId')
    description = data.get('description', 'PetCareApp Payment')
    
    if not amount or amount <= 0:
        return jsonify({'error': 'Invalid amount'}), 400
    
    if not STRIPE_SECRET_KEY:
        # Demo mode without Stripe - VS
        return jsonify({
            'clientSecret': 'demo_secret_' + str(uuid.uuid4()),
            'paymentId': str(uuid.uuid4()),
            'amount': amount,
            'currency': currency
        })
    
    try:
        intent = stripe.PaymentIntent.create(
            amount=int(amount * 100),  # Stripe uses cents
            currency=currency,
            metadata={
                'userId': user_id,
                'appointmentId': appointment_id
            },
            description=description
        )
        
        # Save payment record - VS
        payment = {
            'id': str(uuid.uuid4()),
            'stripeIntentId': intent.id,
            'userId': user_id,
            'appointmentId': appointment_id,
            'amount': amount,
            'currency': currency,
            'status': 'pending',
            'description': description,
            'createdAt': datetime.utcnow().isoformat()
        }
        save_payment(payment)
        
        return jsonify({
            'clientSecret': intent.client_secret,
            'paymentId': payment['id'],
            'stripeIntentId': intent.id
        })
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        return jsonify({'error': str(e)}), 400

@app.route('/api/v1/payments/confirm', methods=['POST'])
def confirm_payment():
    """Confirm payment - VS"""
    data = request.get_json()
    payment_id = data.get('paymentId')
    
    if table:
        try:
            response = table.get_item(Key={'id': payment_id})
            payment = response.get('Item')
        except:
            payment = None
    else:
        payment = payments_db.get(payment_id)
    
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404
    
    payment['status'] = 'completed'
    payment['paidAt'] = datetime.utcnow().isoformat()
    payment['updatedAt'] = datetime.utcnow().isoformat()
    
    save_payment(payment)
    return jsonify(payment)

@app.route('/api/v1/payments/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhooks - VS"""
    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature', '')
    
    if STRIPE_WEBHOOK_SECRET:
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
        except Exception as e:
            logger.error(f"Webhook error: {e}")
            return jsonify({'error': 'Invalid signature'}), 400
    else:
        event = request.get_json()
    
    event_type = event.get('type', '')
    
    if event_type == 'payment_intent.succeeded':
        intent = event['data']['object']
        logger.info(f"Payment succeeded: {intent['id']}")
        
        # Update payment status
        if table:
            try:
                response = table.scan(
                    FilterExpression='stripeIntentId = :sid',
                    ExpressionAttributeValues={':sid': intent['id']}
                )
                items = response.get('Items', [])
                if items:
                    payment = items[0]
                    payment['status'] = 'completed'
                    payment['paidAt'] = datetime.utcnow().isoformat()
                    save_payment(payment)
            except Exception as e:
                logger.error(f"Error updating payment: {e}")
    
    elif event_type == 'payment_intent.payment_failed':
        intent = event['data']['object']
        logger.warning(f"Payment failed: {intent['id']}")
    
    return jsonify({'received': True})

@app.route('/api/v1/payments/services', methods=['GET'])
def get_services():
    """Get available services with prices - VS"""
    services = [
        {'id': 'consultation', 'name': 'Konsultacja', 'price': 150, 'duration': 30},
        {'id': 'vaccination', 'name': 'Szczepienie', 'price': 100, 'duration': 15},
        {'id': 'surgery-minor', 'name': 'Mały zabieg chirurgiczny', 'price': 500, 'duration': 60},
        {'id': 'surgery-major', 'name': 'Duży zabieg chirurgiczny', 'price': 2000, 'duration': 180},
        {'id': 'dental', 'name': 'Stomatologia', 'price': 300, 'duration': 45},
        {'id': 'grooming', 'name': 'Grooming', 'price': 80, 'duration': 60},
        {'id': 'xray', 'name': 'RTG', 'price': 200, 'duration': 30},
        {'id': 'ultrasound', 'name': 'USG', 'price': 250, 'duration': 30},
        {'id': 'blood-test', 'name': 'Badanie krwi', 'price': 120, 'duration': 15},
        {'id': 'emergency', 'name': 'Wizyta nagła', 'price': 250, 'duration': 45}
    ]
    return jsonify(services)

if __name__ == '__main__':
    PORT = int(os.getenv('PORT', 8006))
    logger.info(f"Starting Payment Service on port {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=False)