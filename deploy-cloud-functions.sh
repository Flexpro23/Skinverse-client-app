#!/bin/bash

# 🚀 Skinverse Cloud Functions Deployment Script
# This script fixes common deployment issues and deploys with proper logging

echo "🔧 Starting Skinverse Cloud Functions Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}📋 $1${NC}"
}

# Step 1: Check prerequisites
print_info "Checking prerequisites..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "Google Cloud CLI not found. Please install it first."
    exit 1
fi

# Check if firebase is installed
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI not found. Please install it first."
    exit 1
fi

print_status "Prerequisites check passed"

# Step 2: Set up Google Cloud project
print_info "Setting up Google Cloud project..."

gcloud config set project skinverse-clinic
if [ $? -ne 0 ]; then
    print_error "Failed to set Google Cloud project"
    exit 1
fi

print_status "Google Cloud project set to skinverse-clinic"

# Step 3: Enable required APIs
print_info "Enabling required Google Cloud APIs..."

REQUIRED_APIS=(
    "cloudfunctions.googleapis.com"
    "cloudbuild.googleapis.com"
    "artifactregistry.googleapis.com"
    "eventarc.googleapis.com"
    "run.googleapis.com"
    "pubsub.googleapis.com"
    "storage.googleapis.com"
    "firestore.googleapis.com"
    "appengine.googleapis.com"
)

for api in "${REQUIRED_APIS[@]}"; do
    print_info "Enabling $api..."
    gcloud services enable $api
    if [ $? -eq 0 ]; then
        print_status "$api enabled successfully"
    else
        print_warning "Failed to enable $api (might already be enabled)"
    fi
done

# Step 4: Create App Engine application if it doesn't exist
print_info "Checking App Engine application..."

gcloud app describe &> /dev/null
if [ $? -ne 0 ]; then
    print_info "Creating App Engine application..."
    gcloud app create --region=us-central
    if [ $? -eq 0 ]; then
        print_status "App Engine application created"
    else
        print_error "Failed to create App Engine application"
        exit 1
    fi
else
    print_status "App Engine application already exists"
fi

# Step 5: Update Firebase CLI
print_info "Updating Firebase CLI..."
npm install -g firebase-tools@latest
print_status "Firebase CLI updated"

# Step 6: Authenticate Firebase
print_info "Checking Firebase authentication..."
firebase projects:list &> /dev/null
if [ $? -ne 0 ]; then
    print_info "Firebase authentication required..."
    firebase login
fi

firebase use skinverse-clinic
print_status "Firebase project set to skinverse-clinic"

# Step 7: Install function dependencies
print_info "Installing Cloud Function dependencies..."
cd functions
npm install
if [ $? -eq 0 ]; then
    print_status "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi
cd ..

# Step 8: Deploy Cloud Functions with detailed logging
print_info "Deploying Cloud Functions..."
print_warning "This may take 5-10 minutes..."

firebase deploy --only functions --debug 2>&1 | tee deployment.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    print_status "Cloud Functions deployed successfully!"
    
    # Extract function URLs from deployment log
    print_info "Extracting function URLs..."
    
    GENERATE_ANALYSIS_URL=$(grep -o "https://.*generateAnalysis" deployment.log | head -1)
    HEALTH_CHECK_URL=$(grep -o "https://.*healthCheck" deployment.log | head -1)
    
    if [ ! -z "$GENERATE_ANALYSIS_URL" ]; then
        print_status "generateAnalysis URL: $GENERATE_ANALYSIS_URL"
        
        # Update the frontend service with the new URL
        print_info "Updating frontend service with new URL..."
        sed -i.bak "s|const CLOUD_FUNCTION_URL = '.*';|const CLOUD_FUNCTION_URL = '$GENERATE_ANALYSIS_URL';|" src/services/aiAnalysisService.ts
        print_status "Frontend service updated"
    fi
    
    if [ ! -z "$HEALTH_CHECK_URL" ]; then
        print_status "healthCheck URL: $HEALTH_CHECK_URL"
        
        # Test health check endpoint
        print_info "Testing health check endpoint..."
        curl -s "$HEALTH_CHECK_URL" > health_check_response.json
        if [ $? -eq 0 ]; then
            print_status "Health check endpoint is working"
            cat health_check_response.json
        else
            print_warning "Health check endpoint test failed"
        fi
    fi
    
else
    print_error "Cloud Functions deployment failed!"
    print_info "Check deployment.log for details"
    exit 1
fi

# Step 9: Final verification
print_info "Running final verification..."

# Check function status
firebase functions:list

print_status "Deployment completed successfully!"
print_info "Next steps:"
echo "1. Test the AI analysis pipeline from your frontend"
echo "2. Monitor logs with: firebase functions:log"
echo "3. Check deployment.log for detailed deployment information"

# Clean up temporary files
rm -f health_check_response.json

print_status "Skinverse Cloud Functions are ready for production!"
