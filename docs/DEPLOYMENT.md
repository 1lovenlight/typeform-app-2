# Deployment Guide

App-specific deployment requirements for the Practice Platform.

## Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Supabase Production Setup](#supabase-production-setup)
- [Environment Variables](#environment-variables)
- [External Webhook Configuration](#external-webhook-configuration)
- [Post-Deployment Verification](#post-deployment-verification)
- [Troubleshooting Production Issues](#troubleshooting-production-issues)

## Pre-Deployment Checklist

### Security

- [ ] **Generate new API keys for production**:
  - New Supabase project (don't reuse dev keys)
  - New OpenAI API key
  - New `WORKFLOW_API_KEY` (generate with `openssl rand -hex 32`)

### Database

- [ ] **Import database schema**:
  ```bash
  psql YOUR_PRODUCTION_DATABASE_URL < export/schema.sql
  ```

- [ ] **Verify database functions and triggers**:
  ```sql
  -- Check functions exist
  SELECT routine_name FROM information_schema.routines 
  WHERE routine_schema = 'public';
  
  -- Check trigger exists
  SELECT trigger_name FROM information_schema.triggers 
  WHERE trigger_name = 'trigger_practice_call_processing';
  ```

## Supabase Production Setup

### 1. Import Database Schema

```bash
# Option A: Using Supabase CLI
supabase link --project-ref your-production-project-ref
supabase db push

# Option B: Direct import
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" < export/schema.sql
```

### 2. Configure Database Secrets in Vault

**Critical**: The workflow triggering system requires secrets in Supabase Vault.

```sql
-- In Supabase SQL Editor

-- Store workflow API key (must match WORKFLOW_API_KEY env var in Vercel)
SELECT vault.create_secret('workflow_api_key', 'your-production-workflow-api-key');

-- Store API URL (your Vercel deployment URL)
SELECT vault.create_secret('api_url', 'https://your-app.vercel.app');
```

**Verify secrets**:
```sql
SELECT name FROM vault.secrets;
-- Should see: workflow_api_key, api_url
```

### 3. Verify Database Functions and Triggers

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

-- Verify pg_net extension (required for HTTP requests from triggers)
SELECT * FROM pg_extension WHERE extname = 'pg_net';
-- Should exist
```

### 4. Configure Authentication

1. **Set Site URL** in Supabase Dashboard → Authentication → Settings:
   ```
   https://your-app.vercel.app
   ```

2. **Add Redirect URLs**:
   ```
   https://your-app.vercel.app/**
   ```

## Environment Variables

### Required Production Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_anon_key
SUPABASE_SECRET_KEY=your_service_role_key

# API Configuration
LOCAL_API_URL=https://your-app.vercel.app
WORKFLOW_API_KEY=your-production-workflow-api-key  # Must match Vault secret!

# OpenAI
OPENAI_API_KEY=sk-proj-...your_production_openai_key

# ElevenLabs
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_...your_agent_id

# Sentry (Optional)
SENTRY_AUTH_TOKEN=sntrys_...your_sentry_token
```

**Critical**: `WORKFLOW_API_KEY` must match the value stored in Supabase Vault (`workflow_api_key` secret).

## External Webhook Configuration

The application requires external webhooks configured in Make.com, Zapier, or similar services.

### ElevenLabs Webhook

**Configuration**:

1. **In ElevenLabs Dashboard**:
   - Go to your Conversational AI agent settings
   - Find "Webhooks" or "Integrations" section
   - Add webhook URL: `https://your-webhook-service.com/elevenlabs`

2. **In Make.com/Zapier**:
   - Create new scenario/zap
   - Trigger: Webhook (catch hook)
   - Get webhook URL and add to ElevenLabs

3. **Webhook Logic** (app-specific):
   ```javascript
   // Receive POST from ElevenLabs
   const { conversation_id, transcript, call_data } = request.body
   
   // Update Supabase practice_calls table
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

**Important**: Setting `scoring_status` to `'processing'` triggers the database function `handle_practice_call_processing`, which calls the workflow API endpoint.

### Typeform Webhook

**Configuration**:

1. **In Typeform**:
   - Go to form settings
   - Click "Connect" → "Webhooks"
   - Add webhook URL: `https://your-webhook-service.com/typeform`

2. **In Make.com/Zapier**:
   - Create new scenario/zap
   - Trigger: Webhook (catch hook)
   - Get webhook URL and add to Typeform

3. **Webhook Logic** (app-specific):
   ```javascript
   // Receive POST from Typeform
   const { form_response } = request.body
   const { user_id, activity_id } = form_response.hidden
   
   // Call Supabase function
   await supabase.rpc('complete_activity', {
     p_user_id: user_id,
     p_activity_id: activity_id
   })
   ```

**Important**: The client-side code polls for completion. The webhook must call `complete_activity` for the UI to detect completion.

## Post-Deployment Verification

### Automated Checks

#### ✅ Workflow Triggering
- [ ] Complete a practice call in production
- [ ] Verify webhook updates `practice_calls` table
- [ ] Verify `scoring_status` changes to `'processing'`
- [ ] Check Supabase logs for `handle_practice_call_processing` execution
- [ ] Verify workflow runs in Vercel Dashboard → Workflows
- [ ] Verify scorecard is created in database
- [ ] Verify `scoring_status` changes to `'complete'`

#### ✅ Activity Completion
- [ ] Complete a Typeform activity in production
- [ ] Verify webhook receives submission
- [ ] Verify `complete_activity` function is called
- [ ] Check `user_activity_completions` table
- [ ] Verify next activity appears in UI

#### ✅ Database Functions
- [ ] Test `can_user_access_activity`:
  ```sql
  SELECT can_user_access_activity('user-uuid', 'activity-uuid');
  ```
- [ ] Test `complete_activity`:
  ```sql
  SELECT complete_activity('user-uuid', 'activity-uuid');
  ```

#### ✅ Vault Secrets
- [ ] Verify secrets are accessible:
  ```sql
  SELECT * FROM vault.secrets WHERE name IN ('workflow_api_key', 'api_url');
  ```
- [ ] Verify `api_url` matches your Vercel deployment URL
- [ ] Verify `workflow_api_key` matches `WORKFLOW_API_KEY` env var

## Troubleshooting Production Issues

### Workflow Not Triggering

**Check**:

1. **Vault secrets**:
   ```sql
   SELECT * FROM vault.secrets WHERE name IN ('workflow_api_key', 'api_url');
   ```

2. **API key matches**:
   - Vercel env var `WORKFLOW_API_KEY`
   - Vault secret `workflow_api_key`
   - Must be identical

3. **API URL is correct**:
   - Vault secret `api_url` should be your Vercel deployment URL
   - Should be `https://your-app.vercel.app` (not localhost)

4. **Trigger exists**:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'trigger_practice_call_processing';
   ```

5. **Function logs**:
   - Supabase Dashboard → Logs
   - Filter by function name: `handle_practice_call_processing`
   - Look for HTTP request errors

6. **Test trigger manually**:
   ```sql
   UPDATE practice_calls
   SET scoring_status = 'processing'
   WHERE id = 'test-uuid';
   ```

### Webhook Not Firing

**Check**:

1. **Webhook URL is correct**:
   - ElevenLabs: Agent settings → Webhooks
   - Typeform: Form settings → Connect → Webhooks

2. **Webhook service logs**:
   - Make.com: Check scenario history
   - Zapier: Check zap history

3. **Webhook logic**:
   - ElevenLabs webhook should update `practice_calls` with `scoring_status = 'processing'`
   - Typeform webhook should call `complete_activity()` function

4. **Test webhook manually**:
   ```bash
   curl -X POST https://your-webhook-url.com/endpoint \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

### Database Connection Errors

**Check**:

1. **Environment variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` is production URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` is production anon key
   - `SUPABASE_SECRET_KEY` is production service role key

2. **Supabase project status**:
   - Project is active (not paused)
   - No IP restrictions blocking Vercel

3. **RLS policies**:
   - Policies are correctly configured
   - Users can access their own data

---

For standard Vercel deployment steps, refer to [Vercel Documentation](https://vercel.com/docs).
