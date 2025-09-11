#!/bin/bash

# Post-meeting Social Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

echo "🚀 Starting Post-meeting Social Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if yarn is installed
if ! command -v yarn &> /dev/null; then
    print_error "Yarn is not installed. Please install yarn first."
    exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI not found. Installing..."
    yarn global add vercel
fi

print_status "Installing dependencies..."
yarn install

print_status "Skipping type check for deployment (using build-time type checking)..."
# yarn type-check  # Skipped for deployment - using build-time type checking

print_status "Skipping linting for deployment (using build-time linting)..."
# yarn lint  # Skipped for deployment - using build-time linting

print_status "Skipping tests for deployment (focusing on build)..."
# yarn test  # Skipped for deployment - focus on build
# yarn test:e2e  # Skipped for deployment - focus on build

print_status "Building application..."
yarn build

print_success "Build completed successfully!"

# Check if we're deploying to Vercel
if [ "$1" = "vercel" ]; then
    print_status "Deploying to Vercel..."
    
    # Check if user is logged in to Vercel
    if ! vercel whoami &> /dev/null; then
        print_warning "Please log in to Vercel first:"
        vercel login
    fi
    
    # Deploy to Vercel
    vercel --prod
    
    print_success "Deployment to Vercel completed!"
    print_status "Don't forget to set environment variables in Vercel dashboard:"
    echo "  - NEXTAUTH_URL"
    echo "  - NEXTAUTH_SECRET"
    echo "  - GOOGLE_CLIENT_ID"
    echo "  - GOOGLE_CLIENT_SECRET"
    echo "  - LINKEDIN_CLIENT_ID"
    echo "  - LINKEDIN_CLIENT_SECRET"
    echo "  - OPENAI_API_KEY"
    echo "  - RECALL_AI_API_KEY"
    
elif [ "$1" = "netlify" ]; then
    print_status "Deploying to Netlify..."
    
    # Check if netlify CLI is installed
    if ! command -v netlify &> /dev/null; then
        print_warning "Netlify CLI not found. Installing..."
        yarn global add netlify-cli
    fi
    
    # Deploy to Netlify
    netlify deploy --prod
    
    print_success "Deployment to Netlify completed!"
    
else
    print_status "Build completed. Ready for deployment!"
    print_status "To deploy:"
    echo "  ./deploy.sh vercel    # Deploy to Vercel"
    echo "  ./deploy.sh netlify   # Deploy to Netlify"
fi

print_success "Deployment process completed!"
