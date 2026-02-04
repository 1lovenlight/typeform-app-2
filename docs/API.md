# API Reference

This document provides comprehensive documentation for all API endpoints in the Practice Platform.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [POST /api/practice/score-practice-call](#post-apipracticescore-practice-call)
  - [POST /api/signup](#post-apisignup)
  - [GET /api/sentry-example-api](#get-apisentry-example-api)
- [Error Codes](#error-codes)
- [Rate Limiting](#rate-limiting)
- [Webhook Security](#webhook-security)
- [Testing](#testing)

## Overview

The Practice Platform API provides endpoints for:
- Triggering AI scoring workflows for practice calls
- Managing user signups
- Testing error monitoring

**Base URL**: 
- Development: `http://localhost:3000`
- Production: `https://your-app.vercel.app`

**Content Type**: All requests and responses use `application/json`

**API Version**: v1 (implicit, no versioning in URLs yet)

## Authentication

### Public Endpoints

Some endpoints are publicly accessible:
- `POST /api/signup` - User signup

### Protected Endpoints

Protected endpoints require authentication via Bearer token:

```http
Authorization: Bearer YOUR_WORKFLOW_API_KEY
```

**Example**:
```bash
curl -X POST https://your-app.vercel.app/api/practice/score-practice-call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_WORKFLOW_API_KEY" \
  -d '{"practice_call_id": "uuid-here"}'
```

**Getting the API Key**:
- Set in environment variable: `WORKFLOW_API_KEY`
- Generate with: `openssl rand -hex 32`
- Store in Supabase Vault for production

### Authentication Errors

| Status Code | Description |
|------------|-------------|
| 401 | Missing or invalid Authorization header |
| 403 | Valid token but insufficient permissions |

## Endpoints

### POST /api/practice/score-practice-call

Triggers the AI scoring workflow for a completed practice call.

**URL**: `/api/practice/score-practice-call`

**Method**: `POST`

**Authentication**: Required (Bearer token)

**Request Body**:

```typescript
{
  practice_call_id: string  // UUID of the practice call
}
```

**Example Request**:

```bash
curl -X POST http://localhost:3000/api/practice/score-practice-call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer D51FD522-780C-4CE4-8005-D03AF1BCC547" \
  -d '{"practice_call_id": "fa0d3fbd-cecb-4aff-886d-83686b96c2f4"}'
```

**Success Response**:

```json
{
  "message": "Scoring workflow started",
  "run_id": "wfr_abc123def456",
  "practice_call_id": "fa0d3fbd-cecb-4aff-886d-83686b96c2f4",
  "duration_secs": 120
}
```

**Response Fields**:
- `message` (string): Success message
- `run_id` (string): Vercel Workflow run ID for tracking
- `practice_call_id` (string): UUID of the practice call being scored
- `duration_secs` (number): Duration of the call in seconds

**Error Responses**:

**401 Unauthorized** - Missing or invalid API key:
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid Authorization header"
}
```

**400 Bad Request** - Missing practice_call_id:
```json
{
  "error": "Bad Request",
  "message": "practice_call_id is required"
}
```

**404 Not Found** - Practice call doesn't exist:
```json
{
  "error": "Not Found",
  "message": "Practice call not found"
}
```

**400 Bad Request** - Call too short:
```json
{
  "error": "Call too short",
  "message": "Call duration (45s) is less than minimum (60s)",
  "practice_call_id": "fa0d3fbd-cecb-4aff-886d-83686b96c2f4",
  "duration_secs": 45,
  "minimum_secs": 60
}
```

**500 Internal Server Error** - Workflow failed to start:
```json
{
  "error": "Internal Server Error",
  "message": "Failed to start scoring workflow"
}
```

**Workflow Process**:

1. Validates API key
2. Fetches practice call from database
3. Checks call duration (minimum 60 seconds)
4. If too short: Updates status to 'skipped' and returns error
5. If valid: Starts `scorePracticeCallWorkflow`
6. Workflow fetches rubric and transcript
7. Calls OpenAI GPT-4o for scoring
8. Saves scorecard to database
9. Updates practice call status to 'complete'

**Typical Duration**: 5-15 seconds depending on transcript length

**Retry Behavior**: Workflow automatically retries on transient failures

---

### POST /api/signup

Starts the user signup workflow (currently for demonstration purposes).

**URL**: `/api/signup`

**Method**: `POST`

**Authentication**: None (public endpoint)

**Request Body**:

```typescript
{
  email: string  // User's email address
}
```

**Example Request**:

```bash
curl -X POST http://localhost:3000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

**Success Response**:

```json
{
  "message": "Signup workflow started"
}
```

**Response Fields**:
- `message` (string): Success message

**Error Responses**:

**400 Bad Request** - Missing email:
```json
{
  "error": "Bad Request",
  "message": "email is required"
}
```

**400 Bad Request** - Invalid email format:
```json
{
  "error": "Bad Request",
  "message": "Invalid email format"
}
```

**500 Internal Server Error** - Workflow failed to start:
```json
{
  "error": "Internal Server Error",
  "message": "Failed to start signup workflow"
}
```

**Workflow Process**:

1. Creates user record (mock)
2. Sends welcome email (mock, 30% failure rate for testing)
3. Waits 5 seconds
4. Sends onboarding email (mock)

**Note**: This endpoint currently uses mock functions and is not integrated with actual email services. It's primarily for demonstration of the workflow system.

**Typical Duration**: ~5 seconds

---

### GET /api/sentry-example-api

Test endpoint for Sentry error tracking. Throws an error to verify Sentry integration.

**URL**: `/api/sentry-example-api`

**Method**: `GET`

**Authentication**: None

**Example Request**:

```bash
curl http://localhost:3000/api/sentry-example-api
```

**Response**:

This endpoint always throws an error:

```
SentryExampleAPIError: Sentry Example API Route Error
```

**Purpose**: 
- Verify Sentry is properly configured
- Test error tracking in production
- Validate source maps are uploaded correctly

**Expected Behavior**:
1. Request triggers error
2. Error is caught by Sentry
3. Error appears in Sentry dashboard with full stack trace
4. Source maps show original TypeScript code (not compiled JS)

**Usage**:
```bash
# After deployment, test Sentry integration
curl https://your-app.vercel.app/api/sentry-example-api

# Check Sentry dashboard for the error
# Should see: "SentryExampleAPIError: Sentry Example API Route Error"
```

---

## Error Codes

### Standard HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Server-side error occurred |
| 503 | Service Unavailable | Temporary service outage |

### Custom Error Codes

The API uses descriptive error messages rather than custom error codes. All errors follow this format:

```json
{
  "error": "Error Type",
  "message": "Human-readable description",
  "details": {
    // Optional additional context
  }
}
```

### Common Error Scenarios

**Authentication Failure**:
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid Authorization header"
}
```

**Validation Failure**:
```json
{
  "error": "Bad Request",
  "message": "practice_call_id is required"
}
```

**Resource Not Found**:
```json
{
  "error": "Not Found",
  "message": "Practice call not found"
}
```

**Business Logic Error**:
```json
{
  "error": "Call too short",
  "message": "Call duration (45s) is less than minimum (60s)",
  "practice_call_id": "uuid",
  "duration_secs": 45,
  "minimum_secs": 60
}
```

**Server Error**:
```json
{
  "error": "Internal Server Error",
  "message": "Failed to start scoring workflow"
}
```

## Rate Limiting

**Current Status**: No rate limiting implemented

**Recommended for Production**:

```typescript
// Example rate limiting with Vercel Edge Config
import { ratelimit } from '@/lib/ratelimit'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  
  const { success, limit, reset, remaining } = await ratelimit.limit(ip)
  
  if (!success) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      }
    })
  }
  
  // ... rest of endpoint logic
}
```

**Suggested Limits**:
- `/api/practice/score-practice-call`: 10 requests per minute per IP
- `/api/signup`: 5 requests per hour per IP
- `/api/sentry-example-api`: 1 request per minute per IP

## Webhook Security

### Verifying Webhook Signatures

For production, implement signature verification for external webhooks:

**Example Implementation**:

```typescript
import crypto from 'crypto'

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

// In API route
export async function POST(request: Request) {
  const signature = request.headers.get('x-webhook-signature')
  const payload = await request.text()
  
  if (!signature || !verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
    return new Response('Invalid signature', { status: 401 })
  }
  
  // Process webhook
}
```

### Webhook Headers

**Expected Headers**:
- `Content-Type: application/json`
- `X-Webhook-Signature: <signature>` (if implemented)
- `User-Agent: <service-name>`

### Webhook Retry Logic

External services (ElevenLabs, Typeform) typically retry failed webhooks:
- Retry on 5xx errors
- Exponential backoff
- Maximum retry attempts (usually 3-5)

**Your API should**:
- Return 200 for successful processing
- Return 4xx for invalid requests (won't retry)
- Return 5xx for temporary failures (will retry)

## Testing

### Testing with curl

**Score Practice Call**:
```bash
curl -X POST http://localhost:3000/api/practice/score-practice-call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "practice_call_id": "fa0d3fbd-cecb-4aff-886d-83686b96c2f4"
  }'
```

**User Signup**:
```bash
curl -X POST http://localhost:3000/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**Sentry Test**:
```bash
curl http://localhost:3000/api/sentry-example-api
```

### Testing with Postman

**Import Collection**:

```json
{
  "info": {
    "name": "Practice Platform API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Score Practice Call",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{api_key}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"practice_call_id\": \"{{practice_call_id}}\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/practice/score-practice-call",
          "host": ["{{base_url}}"],
          "path": ["api", "practice", "score-practice-call"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000"
    },
    {
      "key": "api_key",
      "value": "YOUR_API_KEY"
    }
  ]
}
```

### Testing with TypeScript

**Example Test**:

```typescript
import { describe, it, expect } from '@jest/globals'

describe('POST /api/practice/score-practice-call', () => {
  it('should start scoring workflow', async () => {
    const response = await fetch('http://localhost:3000/api/practice/score-practice-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WORKFLOW_API_KEY}`
      },
      body: JSON.stringify({
        practice_call_id: 'test-uuid'
      })
    })
    
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data).toHaveProperty('run_id')
    expect(data).toHaveProperty('practice_call_id')
  })
  
  it('should return 401 without auth', async () => {
    const response = await fetch('http://localhost:3000/api/practice/score-practice-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        practice_call_id: 'test-uuid'
      })
    })
    
    expect(response.status).toBe(401)
  })
})
```

### Integration Testing

**Test Complete Flow**:

1. Create practice call in database
2. Call scoring API endpoint
3. Wait for workflow to complete
4. Verify scorecard was created
5. Verify practice call status is 'complete'

```typescript
// Example integration test
async function testScoringFlow() {
  // 1. Create practice call
  const { data: practiceCall } = await supabase
    .from('practice_calls')
    .insert({
      user_id: 'test-user-id',
      transcript_text: 'Test transcript',
      call_duration_secs: 120,
      scoring_status: 'waiting'
    })
    .select()
    .single()
  
  // 2. Trigger scoring
  const response = await fetch('/api/practice/score-practice-call', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.WORKFLOW_API_KEY}`
    },
    body: JSON.stringify({
      practice_call_id: practiceCall.id
    })
  })
  
  expect(response.status).toBe(200)
  
  // 3. Wait for completion (poll)
  let attempts = 0
  let scorecard = null
  
  while (attempts < 30 && !scorecard) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const { data } = await supabase
      .from('scorecards')
      .select()
      .eq('practice_call_id', practiceCall.id)
      .single()
    
    scorecard = data
    attempts++
  }
  
  // 4. Verify scorecard
  expect(scorecard).toBeTruthy()
  expect(scorecard.feedback).toBeTruthy()
  
  // 5. Verify status
  const { data: updatedCall } = await supabase
    .from('practice_calls')
    .select()
    .eq('id', practiceCall.id)
    .single()
  
  expect(updatedCall.scoring_status).toBe('complete')
}
```

## API Versioning

**Current**: No versioning (v1 implicit)

**Future**: When breaking changes are needed, introduce versioning:

```
/api/v2/practice/score-practice-call
```

**Strategy**:
- Maintain backward compatibility when possible
- Version only when breaking changes required
- Support previous version for at least 6 months
- Provide migration guide

## Best Practices

### For API Consumers

1. **Always include Content-Type header**:
   ```
   Content-Type: application/json
   ```

2. **Handle all error status codes**:
   - 4xx: Client error, don't retry
   - 5xx: Server error, retry with exponential backoff

3. **Implement timeouts**:
   - Set reasonable timeout (30s recommended)
   - Handle timeout gracefully

4. **Log requests and responses**:
   - For debugging
   - For audit trail

5. **Use HTTPS in production**:
   - Never send API keys over HTTP

### For API Developers

1. **Validate all inputs**:
   - Check required fields
   - Validate data types
   - Sanitize user input

2. **Return consistent error format**:
   - Always include `error` and `message`
   - Provide helpful error messages

3. **Log all requests**:
   - Request ID for tracing
   - User ID (if authenticated)
   - Timestamp
   - Response status

4. **Monitor performance**:
   - Track response times
   - Set up alerts for slow endpoints
   - Optimize database queries

5. **Document everything**:
   - Keep this document up to date
   - Include examples
   - Document error cases

## Support

For API issues:
1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Review Vercel logs
3. Check Supabase logs
4. Review Sentry errors

---

**Last Updated**: February 2026
