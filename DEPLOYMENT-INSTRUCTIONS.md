# 🚀 Cloud Functions Deployment Instructions

## Current Status
✅ **Google Cloud CLI installed and authenticated**  
❌ **Service account lacks required permissions**

## 📋 Step-by-Step Deployment Process

### Step 1: Grant Required Permissions to Service Account

You need to grant the following roles to the service account `firebase-adminsdk-fbsvc@skinverse-clinic.iam.gserviceaccount.com`:

#### **Option A: Using Google Cloud Console (Recommended)**

1. **Open Google Cloud Console**: https://console.cloud.google.com/
2. **Navigate to IAM**: Go to "IAM & Admin" → "IAM"
3. **Select Project**: Make sure you're in the `skinverse-clinic` project
4. **Find Service Account**: Look for `firebase-adminsdk-fbsvc@skinverse-clinic.iam.gserviceaccount.com`
5. **Edit Permissions**: Click the edit (pencil) icon next to the service account
6. **Add Roles**: Add these roles:
   - `Cloud Functions Admin`
   - `Cloud Build Editor`
   - `Artifact Registry Administrator`
   - `Eventarc Admin`
   - `Cloud Run Admin`
   - `Pub/Sub Admin`
   - `Storage Admin`
   - `Firestore User`
   - `App Engine Admin`
   - `Service Usage Admin` (required to enable APIs)

#### **Option B: Using Command Line (If you have owner access)**

```bash
# Set variables
PROJECT_ID="skinverse-clinic"
SERVICE_ACCOUNT="firebase-adminsdk-fbsvc@skinverse-clinic.iam.gserviceaccount.com"

# Grant required roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/cloudfunctions.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/cloudbuild.builds.editor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/artifactregistry.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/eventarc.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/pubsub.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/datastore.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/appengine.appAdmin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/serviceusage.serviceUsageAdmin"
```

### Step 2: Enable Required APIs

After granting permissions, run:

```bash
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

### Step 3: Create App Engine Application

```bash
gcloud app create --region=us-central
```

### Step 4: Update Firebase CLI and Deploy

```bash
# Update Firebase CLI
npm install -g firebase-tools@latest

# Login to Firebase (may need to re-authenticate)
firebase logout
firebase login

# Set project
firebase use skinverse-clinic

# Deploy functions
firebase deploy --only functions --debug
```

## 🔧 Alternative: Manual Deployment via Firebase Console

If the above doesn't work, you can deploy via the Firebase Console:

1. **Zip the functions folder**: 
   ```bash
   cd functions
   zip -r ../functions.zip .
   cd ..
   ```

2. **Upload via Firebase Console**:
   - Go to https://console.firebase.google.com/
   - Select `skinverse-clinic` project
   - Go to "Functions" in the left sidebar
   - Click "Create function"
   - Upload the `functions.zip` file

## 🚨 Security Notes

- ✅ Service account key is stored securely with 600 permissions
- ✅ Added to .gitignore to prevent accidental commits
- ⚠️  Remember to revoke access or rotate keys after deployment if needed

## 📊 Verification Steps

After successful deployment:

1. **Check Function URLs**:
   ```bash
   firebase functions:list
   ```

2. **Test Health Check**:
   ```bash
   curl https://us-central1-skinverse-clinic.cloudfunctions.net/healthCheck
   ```

3. **Monitor Logs**:
   ```bash
   firebase functions:log
   ```

## 🆘 If Deployment Still Fails

### Option 1: Use Different Deployment Method
- Deploy using Firebase CLI with personal Google account (owner permissions)
- Use Firebase emulator for local testing

### Option 2: Update Service Account Permissions
- Contact the Google Cloud project owner
- Request Owner or Editor role for the service account

### Option 3: Alternative Hosting
- Deploy to Vercel/Netlify Functions
- Use serverless framework
- Deploy to Google Cloud Run instead

## 📞 Next Steps After Successful Deployment

1. **Update Frontend URLs**: The deployment script will automatically update `src/services/aiAnalysisService.ts` with the correct function URLs
2. **Test Complete Pipeline**: Run a full scan → analysis → report flow
3. **Monitor Performance**: Check logs and performance metrics
4. **Production Verification**: Ensure all validation and error handling works correctly

---

**Current Authentication Status**: ✅ Authenticated as `firebase-adminsdk-fbsvc@skinverse-clinic.iam.gserviceaccount.com`
**Next Required Action**: Grant additional IAM permissions to the service account
