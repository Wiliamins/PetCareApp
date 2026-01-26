#!/bin/bash
# PetCareApp - Quick Start Script
# @author VS

echo "╔════════════════════════════════════════════════════════════╗"
echo "║           🐾 PetCareApp - Quick Start                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Docker is available
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "✅ Docker found - starting full stack..."
    echo ""
    docker-compose up -d
    echo ""
    echo "⏳ Waiting for services to start..."
    sleep 5
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║  🎉 Application started!                                   ║"
    echo "╠════════════════════════════════════════════════════════════╣"
    echo "║  Frontend:     http://localhost:3000                       ║"
    echo "║  API Gateway:  http://localhost:8080                       ║"
    echo "║  Drug Service: http://localhost:8010                       ║"
    echo "║  Alerts:       http://localhost:8011                       ║"
    echo "╠════════════════════════════════════════════════════════════╣"
    echo "║  Test accounts:                                            ║"
    echo "║    admin@petcareapp.com / admin123                         ║"
    echo "║    vet@petcareapp.com / vet123                             ║"
    echo "║    client@petcareapp.com / client123                       ║"
    echo "╚════════════════════════════════════════════════════════════╝"
else
    echo "⚠️  Docker not found - starting frontend only..."
    echo ""
    cd frontend
    
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install
    fi
    
    echo ""
    echo "🚀 Starting frontend..."
    echo "   Open: http://localhost:3000"
    echo "   (Using demo data without backend)"
    echo ""
    npm start
fi
