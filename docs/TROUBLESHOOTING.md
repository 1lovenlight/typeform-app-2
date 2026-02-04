# Troubleshooting Guide

App-specific issues and solutions for the Practice Platform.

## Table of Contents

- [Database Issues](#database-issues)
- [Integration Issues](#integration-issues)
- [Workflow Issues](#workflow-issues)
- [Webhook Issues](#webhook-issues)

## Database Issues

### RLS Policy Errors

**Symptom**: "permission denied" or "new row violates row-level security policy"

**Solutions**:

1. **Check user is authenticated**:
   ```typescript
   const { data: { user } } = await supabase.auth.getUser()
   console.log('User:', user) // Should not be null
   ```

2. **Verify RLS policies exist**:
   ```sql
   -- In Supabase SQL Editor
   SELECT * FROM pg_policies WHERE tablename = 'your_table';
   ```

3. **Test with service role key** (bypasses RLS):
   ```typescript
   // Use admin client for testing
   import { supabaseAdmin } from '@/lib/supabase/admin'
   const { data } = await supabaseAdmin.from('table').select()
   ```

4. **Check policy conditions**:
   ```sql
   -- Example: Check if user_id matches
   CREATE POLICY "Users can view own data"
   ON table_name FOR SELECT
   USING (user_id = auth.uid());
   ```

5. **Temporarily disable RLS** (testing only):
   ```sql
   ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
   -- Remember to re-enable!
   ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
   ```

---

### Database Connection Limits

**Symptom**: "remaining connection slots are reserved" or "too many connections"

**Solutions**:

1. **Check active connections**:
   ```sql
   SELECT count(*) FROM pg_stat_activity;
   ```

2. **Kill idle connections**:
   ```sql
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE state = 'idle'
   AND state_change < current_timestamp - INTERVAL '5 minutes';
   ```

3. **Use connection pooling** (production):
   - Enable Supavisor in Supabase Dashboard
   - Use pooled connection string

4. **Close connections properly**:
   ```typescript
   // Don't create multiple clients
   const supabase = createClient() // Reuse this
   
   // Not this:
   const supabase1 = createClient()
   const supabase2 = createClient()
   const supabase3 = createClient()
   ```

---

### Slow Queries

**Symptom**: Database queries take a long time

**Solutions**:

1. **Check query performance**:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM your_table WHERE condition;
   ```

2. **Add indexes**:
   ```sql
   CREATE INDEX idx_user_id ON practice_calls(user_id);
   CREATE INDEX idx_activity_id ON user_activity_completions(activity_id);
   ```

3. **Use views for complex queries**:
   ```sql
   -- Already exists: active_activity_hierarchy
   SELECT * FROM active_activity_hierarchy;
   ```

4. **Limit results**:
   ```typescript
   const { data } = await supabase
     .from('table')
     .select()
     .limit(100) // Don't fetch thousands of rows
   ```

5. **Use select() to fetch only needed columns**:
   ```typescript
   // Good
   .select('id, title, created_at')
   
   // Bad (fetches everything)
   .select('*')
   ```

## Integration Issues

### ElevenLabs Voice Chat Not Connecting

**Symptom**: Voice chat doesn't start or WebSocket errors

**Solutions**:

1. **Check agent ID**:
   ```bash
   echo $NEXT_PUBLIC_ELEVENLABS_AGENT_ID
   # Should be: agent_...
   ```

2. **Verify ElevenLabs account**:
   - Check account has credits
   - Verify agent is active
   - Check agent configuration

3. **Check browser permissions**:
   - Allow microphone access
   - Check browser console for errors

4. **Try different browser**:
   - Chrome/Edge recommended (best WebRTC support)
   - Safari may have issues

5. **Check network**:
   - Firewall blocking WebSocket?
   - Corporate network restrictions?
   - Try different network

6. **Check CORS**:
   ```javascript
   // In browser console
   console.log('Origin:', window.location.origin)
   // Should be allowed by ElevenLabs
   ```

---

### Typeform Not Embedding

**Symptom**: Typeform doesn't show or shows error

**Solutions**:

1. **Check form ID**:
   ```typescript
   console.log('Form ID:', formId)
   // Should be valid Typeform ID
   ```

2. **Verify Typeform is published**:
   - Go to Typeform dashboard
   - Check form is published
   - Check form is not deleted

3. **Check hidden fields** (app-specific):
   ```typescript
   hidden={{
     user_id: userId, // Should not be undefined
     activity_id: activityId,
     level_id: levelId,
     activity_slug: activitySlug,
     activity_title: activityTitle,
   }}
   ```

4. **Check browser console** for errors

5. **Test form directly**:
   ```
   https://form.typeform.com/to/<form-id>
   ```

---

### OpenAI Scoring Fails

**Symptom**: Scoring workflow fails or times out

**Solutions**:

1. **Check API key**:
   ```bash
   echo $OPENAI_API_KEY
   # Should start with: sk-proj-...
   ```

2. **Verify OpenAI account**:
   - Check account has credits
   - Check API key is active
   - Check usage limits

3. **Check transcript length**:
   ```typescript
   console.log('Transcript length:', transcript.length)
   // Very long transcripts may timeout
   ```

4. **Check workflow logs**:
   - Go to Vercel Dashboard → Logs
   - Filter by workflow name: `scorePracticeCallWorkflow`
   - Look for error messages

5. **Test OpenAI directly**:
   ```bash
   curl https://api.openai.com/v1/chat/completions \
     -H "Authorization: Bearer $OPENAI_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "gpt-4o",
       "messages": [{"role": "user", "content": "Hello"}]
     }'
   ```

6. **Check rate limits**:
   - OpenAI has rate limits per minute
   - Wait and retry

---

### Sentry Not Tracking Errors

**Symptom**: Errors not appearing in Sentry dashboard

**Solutions**:

1. **Check Sentry DSN**:
   ```typescript
   // In sentry.server.config.ts
   console.log('Sentry DSN:', process.env.SENTRY_DSN)
   ```

2. **Verify Sentry is initialized**:
   ```typescript
   // Should be in instrumentation.ts
   Sentry.init({ /* ... */ })
   ```

3. **Test Sentry**:
   ```bash
   curl http://localhost:3000/api/sentry-example-api
   # Should create error in Sentry
   ```

4. **Check source maps**:
   - Verify `SENTRY_AUTH_TOKEN` is set
   - Check build logs for source map upload
   - Verify source maps in Sentry dashboard

5. **Check sample rate**:
   ```typescript
   Sentry.init({
     tracesSampleRate: 1.0, // Should be > 0
   })
   ```

## Workflow Issues

### Workflow Not Triggering

**Symptom**: Database trigger doesn't start workflow in production

**Solutions**:

1. **Check API URL in Vault**:
   ```sql
   SELECT * FROM vault.secrets WHERE name = 'api_url';
   -- Should be: https://your-app.vercel.app
   ```

2. **Check API key in Vault**:
   ```sql
   SELECT * FROM vault.secrets WHERE name = 'workflow_api_key';
   -- Should match WORKFLOW_API_KEY env var
   ```

3. **Test trigger manually**:
   ```sql
   UPDATE practice_calls
   SET scoring_status = 'processing'
   WHERE id = 'test-uuid';
   ```

4. **Check function logs**:
   - Supabase Dashboard → Logs
   - Filter by function name: `handle_practice_call_processing`

5. **Verify pg_net extension**:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_net';
   -- Should exist
   ```

6. **Verify trigger exists**:
   ```sql
   SELECT trigger_name, event_object_table 
   FROM information_schema.triggers 
   WHERE trigger_schema = 'public'
   AND trigger_name = 'trigger_practice_call_processing';
   ```

---

### Slow Workflow Execution

**Symptom**: Workflows take too long to complete

**Solutions**:

1. **Check workflow logs**:
   - Vercel Dashboard → Logs
   - Look for slow steps in `scorePracticeCallWorkflow`

2. **Optimize AI calls**:
   ```typescript
   // Reduce max tokens
   maxTokens: 1000 // Instead of 4000
   
   // Use faster model
   model: openai('gpt-4o-mini') // Instead of gpt-4o
   ```

3. **Add timeouts**:
   ```typescript
   const result = await Promise.race([
     scoreWithAI(transcript),
     new Promise((_, reject) => 
       setTimeout(() => reject(new Error('Timeout')), 30000)
     )
   ])
   ```

4. **Parallelize steps** (if possible):
   ```typescript
   const [call, rubric] = await Promise.all([
     fetchPracticeCall(id),
     fetchRubric()
   ])
   ```

## Webhook Issues

### Webhook Not Firing

**Symptom**: External webhooks (ElevenLabs, Typeform) not updating database

**Solutions**:

1. **Check webhook URL**:
   - Verify URL is correct
   - Ensure URL is accessible (not localhost)
   - Use ngrok for local testing

2. **Check webhook service logs**:
   - Make.com: Check scenario history
   - Zapier: Check zap history
   - Look for errors

3. **Test webhook manually**:
   ```bash
   curl -X POST https://your-webhook-url.com/endpoint \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

4. **Check webhook configuration**:
   - ElevenLabs: Agent settings → Webhooks
   - Typeform: Form settings → Connect → Webhooks

5. **Verify webhook logic** (app-specific):
   - Check Supabase function exists: `complete_activity`
   - Test function manually:
   ```sql
   SELECT complete_activity('user-uuid', 'activity-uuid');
   ```

6. **For ElevenLabs webhook** - verify it updates practice_calls:
   ```sql
   -- Check if webhook is updating the record
   SELECT id, scoring_status, transcript_text
   FROM practice_calls
   WHERE id = 'practice-call-id';
   ```

7. **For Typeform webhook** - verify it calls complete_activity:
   ```sql
   -- Check if completion was recorded
   SELECT * FROM user_activity_completions
   WHERE user_id = 'user-uuid'
   AND activity_id = 'activity-uuid';
   ```

---

**Still stuck?** Review the [ARCHITECTURE.md](ARCHITECTURE.md) for system design details.
