# App-Specific Setup Requirements

This guide covers the unique setup requirements for the Practice Platform that differ from standard Next.js/Supabase projects.

## Table of Contents

- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Supabase Vault Configuration](#supabase-vault-configuration)
- [Webhook Setup](#webhook-setup)

## Database Setup

### Import Database Schema and Data

The application uses a custom database schema with specific functions and triggers. Import the complete database setup:

```bash
# Start local Supabase
supabase start

# Import the schema
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < export/schema.sql

# Import the data (optional, for seed data)
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < export/data.sql

# Import custom roles (if needed)
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < export/roles.sql
```

**Important**: The schema includes:
- Custom database functions: `can_user_access_activity`, `complete_activity`, `handle_practice_call_processing`
- Database trigger: `trigger_practice_call_processing` on `practice_calls` table
- View: `active_activity_hierarchy` for efficient activity queries
- Row Level Security policies on all tables

### Verify Database Functions

After importing, verify all functions exist:

```sql
-- Check functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public';

-- Should see:
-- - can_user_access_activity
-- - complete_activity
-- - handle_practice_call_processing

-- Check triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Should see:
-- - trigger_practice_call_processing on practice_calls
```

## Environment Variables

### Required Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321  # Local: use supabase status
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_anon_key
SUPABASE_SECRET_KEY=your_service_role_key

# API Configuration
LOCAL_API_URL=http://localhost:3000  # For local development
WORKFLOW_API_KEY=your_generated_secure_key_here  # Generate with: openssl rand -hex 32

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-...your_openai_key

# ElevenLabs Configuration
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_...your_agent_id

# Sentry Configuration (Optional)
SENTRY_AUTH_TOKEN=sntrys_...your_sentry_token
```

### App-Specific Notes

- **WORKFLOW_API_KEY**: This key must match the value stored in Supabase Vault (see below). Generate a secure key and use the same value in both places.
- **LOCAL_API_URL**: Used by the database trigger to call the workflow API endpoint. For local development, use `http://localhost:3000`. For production, this will be your Vercel deployment URL.

## Supabase Vault Configuration

The application uses Supabase Vault to store secrets that are accessed by database functions. This is required for the workflow triggering system.

### Store Secrets in Vault

```sql
-- In Supabase SQL Editor (local or production)

-- Store workflow API key (must match WORKFLOW_API_KEY env var)
SELECT vault.create_secret('workflow_api_key', 'your_generated_secure_key_here');

-- Store API URL (local development)
SELECT vault.create_secret('api_url', 'http://localhost:3000');

-- For production, use your Vercel deployment URL:
-- SELECT vault.create_secret('api_url', 'https://your-app.vercel.app');
```

### Verify Vault Secrets

```sql
-- Check secrets exist
SELECT name FROM vault.secrets;

-- Should see:
-- - workflow_api_key
-- - api_url
```

**Important**: The `handle_practice_call_processing` function reads these secrets to make HTTP requests to trigger workflows. If these are missing or incorrect, workflows will not trigger automatically.

## Webhook Setup

The application requires external webhooks for full functionality. These are configured in Make.com, Zapier, or similar services.

### ElevenLabs Webhook

**Purpose**: Receive conversation transcripts after practice calls end.

**Required Configuration**:
1. Configure webhook in ElevenLabs agent settings
2. Webhook should POST to your Make.com/Zapier endpoint
3. Webhook payload should include:
   - `conversation_id`
   - `transcript` (array of messages)
   - `call_data` (includes `user_id`, `practice_call_id`, `duration_secs`)

**Webhook Logic** (in Make.com/Zapier):
```javascript
// Extract data from ElevenLabs webhook
const { conversation_id, transcript, call_data } = request.body

// Update practice_calls table
await supabase
  .from('practice_calls')
  .update({
    conversation_id,
    transcript,
    transcript_text: extractText(transcript),
    call_data,
    call_duration_secs: calculateDuration(call_data),
    scoring_status: 'processing'  // This triggers the database trigger
  })
  .eq('id', call_data.practice_call_id)
```

### Typeform Webhook

**Purpose**: Mark activities as completed when users submit Typeform.

**Required Configuration**:
1. Configure webhook in Typeform form settings
2. Webhook should POST to your Make.com/Zapier endpoint
3. Webhook payload includes hidden fields:
   - `user_id`
   - `activity_id`
   - `level_id`
   - `activity_slug`
   - `activity_title`

**Webhook Logic** (in Make.com/Zapier):
```javascript
// Extract hidden fields from Typeform submission
const { form_response } = request.body
const { user_id, activity_id } = form_response.hidden

// Call Supabase function
await supabase.rpc('complete_activity', {
  p_user_id: user_id,
  p_activity_id: activity_id
})
```

**Note**: The client-side code polls for completion, so the webhook must call `complete_activity` for the UI to detect completion.

## Verification

After setup, verify:

1. **Database functions work**:
   ```sql
   -- Test complete_activity
   SELECT complete_activity('test-user-id', 'test-activity-id');
   
   -- Test can_user_access_activity
   SELECT can_user_access_activity('test-user-id', 'test-activity-id');
   ```

2. **Vault secrets are accessible**:
   ```sql
   SELECT * FROM vault.secrets WHERE name IN ('workflow_api_key', 'api_url');
   ```

3. **Trigger fires correctly**:
   ```sql
   -- Create a test practice call
   INSERT INTO practice_calls (user_id, scoring_status)
   VALUES ('test-user-id', 'waiting');
   
   -- Update to processing (should trigger workflow)
   UPDATE practice_calls
   SET scoring_status = 'processing'
   WHERE id = 'test-call-id';
   
   -- Check logs in Supabase Dashboard → Logs
   ```

---

For standard Next.js/Supabase setup instructions, refer to their official documentation.
