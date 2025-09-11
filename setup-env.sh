#!/bin/bash

# Environment Setup Script for Post-meeting Social
# This script helps set up environment variables for deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Setting up environment for Post-meeting Social deployment..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    print_warning ".env.local not found. Creating from template..."
    if [ -f ".env copy.local" ]; then
        cp ".env copy.local" ".env.local"
        print_success "Created .env.local from existing configuration"
    else
        print_error "No environment file found. Please create .env.local with your configuration."
        exit 1
    fi
fi

# Check if .env.example exists
if [ ! -f ".env.example" ]; then
    print_warning ".env.example not found. Creating template..."
    cat > .env.example << 'EOF'
# Authentication
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-key

# Google OAuth (Required for Calendar)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# LinkedIn OAuth (Required for Publishing)
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Facebook OAuth (Optional - Currently Mocked)
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret

# AI Services
OPENAI_API_KEY=your-openai-api-key
RECALL_AI_API_KEY=your-recall-ai-api-key

# Public Environment Variables (for client-side)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_RECALL_AI_API_KEY=your-recall-ai-api-key
EOF
    print_success "Created .env.example template"
fi

print_status "Environment setup completed!"
print_status "Next steps:"
echo "1. Update OAuth redirect URIs in your provider dashboards"
echo "2. Run 'yarn deploy:vercel' to deploy to Vercel"
echo "3. Set environment variables in Vercel dashboard"
echo ""
print_status "OAuth Redirect URIs to add:"
echo "  Google: https://your-domain.vercel.app/api/auth/callback/google"
echo "  LinkedIn: https://your-domain.vercel.app/api/auth/callback/linkedin"
echo "  Facebook: https://your-domain.vercel.app/api/auth/callback/facebook"

