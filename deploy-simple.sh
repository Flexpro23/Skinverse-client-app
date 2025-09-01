#!/bin/bash

# 🚀 Simplified Cloud Functions Deployment Script
# Uses the authenticated service account

echo "🔧 Starting simplified Cloud Functions deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if gcloud is authenticated
print_info "Checking authentication..."
gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1
if [ $? -eq 0 ]; then
    ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1)
    print_status "Authenticated as: $ACTIVE_ACCOUNT"
else
    print_error "Not authenticated. Please run: gcloud auth activate-service-account --key-file=serviceAccountKey.json"
    exit 1
fi

# Set project
print_info "Setting project to skinverse-clinic..."
gcloud config set project skinverse-clinic
print_status "Project set successfully"

# Check if APIs are enabled (don't fail if we can't enable them)
print_info "Checking API status..."
gcloud services list --enabled --filter="name:cloudfunctions.googleapis.com" --format="value(name)" | head -1
if [ $? -eq 0 ]; then
    print_status "Cloud Functions API is available"
else
    print_warning "Cannot verify API status (insufficient permissions)"
fi

# Update Firebase CLI
print_info "Updating Firebase CLI..."
npm install -g firebase-tools@latest
print_status "Firebase CLI updated"

# Install function dependencies
print_info "Installing function dependencies..."
cd functions
npm install
if [ $? -eq 0 ]; then
    print_status "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi
cd ..

# Set Firebase project
print_info "Setting Firebase project..."
firebase use skinverse-clinic --token "$(gcloud auth print-access-token)"
if [ $? -eq 0 ]; then
    print_status "Firebase project set"
else
    print_warning "Using alternative authentication method..."
    firebase use skinverse-clinic
fi

# Deploy functions
print_info "Attempting to deploy Cloud Functions..."
print_warning "This may take 5-10 minutes..."

export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/serviceAccountKey.json"

firebase deploy --only functions --debug 2>&1 | tee deployment.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    print_status "🎉 Cloud Functions deployed successfully!"
    
    # Extract function URLs
    print_info "Extracting function URLs..."
    
    GENERATE_ANALYSIS_URL=$(grep -o "https://.*generateAnalysis" deployment.log | head -1)
    HEALTH_CHECK_URL=$(grep -o "https://.*healthCheck" deployment.log | head -1)
    
    if [ ! -z "$GENERATE_ANALYSIS_URL" ]; then
        print_status "generateAnalysis URL: $GENERATE_ANALYSIS_URL"
        
        # Update frontend service
        print_info "Updating frontend service..."
        sed -i.bak "s|const CLOUD_FUNCTION_URL = '.*';|const CLOUD_FUNCTION_URL = '$GENERATE_ANALYSIS_URL';|" src/services/aiAnalysisService.ts
        print_status "Frontend service updated"
        
        # Remove backup file
        rm -f src/services/aiAnalysisService.ts.bak
    fi
    
    if [ ! -z "$HEALTH_CHECK_URL" ]; then
        print_status "healthCheck URL: $HEALTH_CHECK_URL"
        
        # Test health check
        print_info "Testing health check endpoint..."
        curl -s "$HEALTH_CHECK_URL"
        echo ""
        print_status "Health check test completed"
    fi
    
    print_status "🚀 Deployment completed successfully!"
    print_info "Next steps:"
    echo "1. Test the AI analysis pipeline"
    echo "2. Monitor logs with: firebase functions:log"
    echo "3. Check deployment.log for details"
    
else
    print_error "❌ Deployment failed!"
    print_info "Common solutions:"
    echo "1. Check if you have sufficient permissions"
    echo "2. Enable required APIs manually in Google Cloud Console"
    echo "3. Create App Engine application: gcloud app create --region=us-central"
    echo "4. Check deployment.log for detailed error information"
    
    # Show last 20 lines of deployment log
    print_info "Last 20 lines of deployment log:"
    tail -20 deployment.log
fi

print_info "Deployment attempt completed. Check logs above for status."
