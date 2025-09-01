# 🔧 Cloud Function Deployment Fix Guide

## Problem Analysis
The deployment failed with these specific errors:
1. **Service Account Authentication**: `service-34284993760@gcf-admin-robot.iam.gserviceaccount.com': Not found`
2. **Missing App Engine Instance**: Required for Cloud Functions v2
3. **API Permissions**: Multiple APIs need to be enabled

## Step-by-Step Solution

### Step 1: Enable Required Google Cloud APIs
```bash
# Log into Google Cloud CLI
gcloud auth login

# Set the correct project
gcloud config set project skinverse-clinic

# Enable all required APIs
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable eventarc.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable pubsub.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable appengine.googleapis.com
```

### Step 2: Create App Engine Application (Required for Functions v2)
```bash
# Create App Engine instance (choose your preferred region)
gcloud app create --region=us-central

# Verify App Engine is created
gcloud app describe
```

### Step 3: Fix Service Account Permissions
```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe skinverse-clinic --format="value(projectNumber)")
echo "Project Number: $PROJECT_NUMBER"

# Create the missing service account if needed
gcloud iam service-accounts create gcf-admin-robot \
    --display-name="Cloud Functions Admin Robot" \
    --description="Service account for Cloud Functions administration"

# Grant necessary permissions to the service account
gcloud projects add-iam-policy-binding skinverse-clinic \
    --member="serviceAccount:service-${PROJECT_NUMBER}@gcf-admin-robot.iam.gserviceaccount.com" \
    --role="roles/cloudfunctions.admin"

gcloud projects add-iam-policy-binding skinverse-clinic \
    --member="serviceAccount:service-${PROJECT_NUMBER}@gcf-admin-robot.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding skinverse-clinic \
    --member="serviceAccount:service-${PROJECT_NUMBER}@gcf-admin-robot.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.admin"
```

### Step 4: Update Firebase CLI and Node.js Runtime
```bash
# Update Firebase CLI to latest version
npm install -g firebase-tools@latest

# Update functions runtime to Node.js 20 (latest supported)
```

### Step 5: Fix package.json for Node.js 20
```json
{
  "engines": {
    "node": "20"
  }
}
```

### Step 6: Update firebase.json
```json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs20"
  }
}
```

### Step 7: Re-authenticate and Deploy
```bash
# Re-authenticate Firebase
firebase logout
firebase login

# Set the correct project
firebase use skinverse-clinic

# Deploy functions
firebase deploy --only functions --debug
```

### Alternative: Switch to Firebase Functions v1 (If v2 continues to fail)
Update `functions/index.js` to use v1 syntax:
```javascript
const functions = require('firebase-functions');

exports.generateAnalysis = functions
  .region('us-central1')
  .runWith({
    timeoutSeconds: 540,
    memory: '2GB'
  })
  .https.onRequest(async (req, res) => {
    // Your existing code
  });
```

## Verification Steps
1. Check deployment status: `firebase functions:log`
2. Test function URL: `curl -X POST [FUNCTION_URL]`
3. Monitor logs: `gcloud functions logs read generateAnalysis`

## Common Issues & Solutions

### Issue: "App Engine required"
**Solution**: Create App Engine instance (Step 2)

### Issue: "Service account not found"
**Solution**: Create and configure service account (Step 3)

### Issue: "Insufficient permissions"
**Solution**: Add IAM roles to service account (Step 3)

### Issue: "API not enabled"
**Solution**: Enable all required APIs (Step 1)
