# Features Documentation

Comprehensive guide to all features in the Practice Platform.

## Table of Contents

- [Overview](#overview)
- [User Authentication](#user-authentication)
- [Activity System](#activity-system)
- [Practice Sessions](#practice-sessions)
- [AI Scoring System](#ai-scoring-system)
- [Progress Tracking](#progress-tracking)
- [User Settings](#user-settings)
- [Theme Support](#theme-support)
- [Admin Features](#admin-features)

## Overview

The Practice Platform provides an interactive learning environment with:
- **Structured Learning**: Activities organized by levels with prerequisites
- **Voice Practice**: Real-time AI conversations via ElevenLabs
- **AI Feedback**: GPT-4o-powered scoring and detailed feedback
- **Progress Tracking**: Automatic tracking of completions and unlocking

## User Authentication

### Sign Up

**Location**: `/sign-up`

**Features**:
- Email and password registration
- Automatic user profile creation
- Role assignment (default: 'user')
- Validation and error handling

**Flow**:
1. User enters email and password
2. Form validates input (email format, password strength)
3. Supabase creates auth user
4. User profile created in `user_profiles` table
5. User redirected to home page
6. Session established with cookies

**Validation Rules**:
- Email: Valid email format required
- Password: Minimum 6 characters (configurable in Supabase)

**Component**: `components/auth/sign-up-form.tsx`

**Code Example**:
```typescript
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      username: email.split('@')[0] // Default username
    }
  }
})
```

### Login

**Location**: `/login`

**Features**:
- Email and password authentication
- Remember me (persistent session)
- Error handling with user feedback
- Redirect to intended page after login

**Flow**:
1. User enters credentials
2. Supabase validates credentials
3. Session created with JWT token
4. Token stored in HTTP-only cookies
5. User redirected to `/home`

**Component**: `components/auth/login-form.tsx`

**Session Management**:
- JWT tokens stored in HTTP-only cookies
- Automatic token refresh via middleware
- Session expires after 1 hour (configurable)
- Refresh token valid for 7 days

### Logout

**Location**: Header menu

**Features**:
- Single-click logout
- Session cleanup
- Redirect to landing page

**Flow**:
1. User clicks logout
2. Supabase signs out user
3. Cookies cleared
4. Redirect to `/`

**Component**: `components/auth/logout-button.tsx`

### Password Reset

**Location**: `/forgot-password`

**Features**:
- Email-based password reset
- Secure reset link generation
- Token expiration (1 hour)

**Flow**:
1. User enters email
2. Supabase sends reset email
3. User clicks link in email
4. Redirected to `/update-password`
5. User enters new password
6. Password updated

**Components**:
- `components/auth/forgot-password-form.tsx`
- `components/auth/update-password-form.tsx`

### Protected Routes

**Middleware**: `proxy.ts` + `lib/supabase/middleware.ts`

**Protected Routes**:
- `/home` - Home page
- `/browse` - Activity browser
- `/activity/*` - Activity pages
- `/practice` - Practice interface
- `/settings` - User settings

**Public Routes**:
- `/` - Landing page
- `/login` - Login page
- `/sign-up` - Sign up page
- `/forgot-password` - Password reset
- `/update-password` - Password update

**Behavior**:
- Unauthenticated users redirected to `/login`
- Authenticated users can access all protected routes
- Middleware refreshes tokens automatically

## Activity System

### Activity Structure

**Hierarchy**:
```
Levels (Top-level organization)
  └── Activities (Typeform-based learning activities)
       └── Prerequisites (Required activities)
```

**Database Tables**:
- `levels` - Level organization
- `typeforms` - Activity definitions
- `activity_requirements` - Prerequisites

### Browse Activities

**Location**: `/browse`

**Features**:
- View all published activities
- Organized by levels
- Visual status indicators
- Prerequisite information
- Activity descriptions and hints

**Activity States**:
- 🔒 **Locked**: Prerequisites not met
- 🔓 **Unlocked**: Available to complete
- ✅ **Completed**: Already finished

**Component**: `components/activities/activities-browser.tsx`

**Data Fetching**:
```typescript
// Server-side fetch
const { data: activities } = await supabase
  .from('active_activity_hierarchy')
  .select('*')
  .order('level_order', { ascending: true })
  .order('activity_order', { ascending: true })

const { data: completions } = await supabase
  .from('user_activity_completions')
  .select('activity_id')
  .eq('user_id', userId)
```

**Status Calculation**:
```typescript
function getActivityStatus(activity, completions) {
  // Check if completed
  if (completions.includes(activity.id)) {
    return 'completed'
  }
  
  // Check prerequisites
  const allPrereqsCompleted = activity.requires_activity_ids.every(
    reqId => completions.includes(reqId)
  )
  
  return allPrereqsCompleted ? 'unlocked' : 'locked'
}
```

### Activity Detail

**Location**: `/activity/[id]`

**Features**:
- Activity information (title, description, hint)
- Typeform embed
- Prerequisite display
- Status indicator
- Completion tracking

**Flow**:
1. User navigates to activity
2. System checks prerequisites
3. If locked: Shows prerequisites needed
4. If unlocked: Shows Typeform embed
5. User completes Typeform
6. Webhook marks as complete
7. Success dialog shows next activity

**Component**: `components/typeform/typeform-react-widget.tsx`

**Typeform Configuration**:
```typescript
<Widget
  id={formId}
  hidden={{
    user_id: userId,
    activity_id: activityId,
    level_id: levelId,
    activity_slug: activitySlug,
    activity_title: activityTitle,
  }}
  onSubmit={handleSubmit}
  opacity={100}
  hideHeaders={true}
  hideFooter={true}
/>
```

### Activity Completion

**Trigger**: External webhook (Make.com/Zapier)

**Flow**:
1. User submits Typeform
2. Typeform sends webhook to external service
3. External service extracts hidden fields
4. Calls Supabase function: `complete_activity(user_id, activity_id)`
5. Function inserts into `user_activity_completions`
6. Client polls for completion (500ms intervals)
7. Success dialog appears with next activity

**Database Function**:
```sql
CREATE OR REPLACE FUNCTION complete_activity(
  p_user_id UUID,
  p_activity_id UUID
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_activity_completions (user_id, activity_id, completed_at)
  VALUES (p_user_id, p_activity_id, NOW())
  ON CONFLICT (user_id, activity_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Polling Logic**:
```typescript
const pollForCompletion = async () => {
  const maxAttempts = 20 // 10 seconds max
  let attempts = 0
  
  while (attempts < maxAttempts) {
    const { data } = await supabase
      .from('user_activity_completions')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('activity_id', activityId)
      .single()
    
    if (data?.completed_at) {
      return true // Completed!
    }
    
    await new Promise(resolve => setTimeout(resolve, 500))
    attempts++
  }
  
  return false // Timeout
}
```

### Next Activity Recommendation

**Location**: Home page

**Features**:
- Shows next unlocked activity
- Considers prerequisites
- Respects level order
- Direct link to activity

**Logic**: `lib/utils/get-next-activity.ts`

```typescript
export async function getNextActivity(userId: string) {
  // Get all activities with prerequisites
  const { data: activities } = await supabase
    .from('active_activity_hierarchy')
    .select('*')
    .order('level_order', 'activity_order')
  
  // Get user's completions
  const { data: completions } = await supabase
    .from('user_activity_completions')
    .select('activity_id')
    .eq('user_id', userId)
  
  const completedIds = completions.map(c => c.activity_id)
  
  // Find first unlocked, uncompleted activity
  return activities.find(activity => {
    const isCompleted = completedIds.includes(activity.id)
    const prereqsMet = activity.requires_activity_ids.every(
      reqId => completedIds.includes(reqId)
    )
    return !isCompleted && prereqsMet
  })
}
```

### Prerequisites System

**Purpose**: Ensure users complete activities in order

**Configuration**: `activity_requirements` table

**Example**:
```sql
-- Activity B requires Activity A
INSERT INTO activity_requirements (activity_id, requires_activity_id)
VALUES ('activity-b-uuid', 'activity-a-uuid');

-- Activity C requires both A and B
INSERT INTO activity_requirements (activity_id, requires_activity_id)
VALUES 
  ('activity-c-uuid', 'activity-a-uuid'),
  ('activity-c-uuid', 'activity-b-uuid');
```

**Checking Access**:
```typescript
// Client-side check
const canAccess = activity.requires_activity_ids.every(
  reqId => userCompletions.includes(reqId)
)

// Server-side check (database function)
const { data } = await supabase
  .rpc('can_user_access_activity', {
    p_user_id: userId,
    p_activity_id: activityId
  })
```

## Practice Sessions

### Voice Chat Interface

**Location**: `/practice`

**Features**:
- Real-time voice conversation with AI
- WebRTC audio streaming
- Visual feedback (waveform, orb animation)
- Message history
- Connection status
- Post-call dialog

**Integration**: ElevenLabs Conversational AI

**Component**: `components/practice/voice-chat.tsx`

**Setup**:
```typescript
<Conversation
  onConnect={() => {
    console.log('Connected to ElevenLabs')
  }}
  onDisconnect={() => {
    setShowPostCallDialog(true)
  }}
  onMessage={(message) => {
    // Handle incoming messages
  }}
  onError={(error) => {
    console.error('ElevenLabs error:', error)
  }}
>
  <ConversationBar
    agentId={process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID}
    clientTools={{
      dynamicVariables: {
        user_name: userProfile?.username,
        user_id: userId,
        practice_call_id: practiceCallId,
        // ... character details
      }
    }}
  />
</Conversation>
```

### Starting a Practice Call

**Flow**:
1. User clicks "Start Conversation"
2. `usePracticeCall` hook creates database record
3. WebRTC connection established
4. Dynamic variables passed to agent
5. Conversation begins

**Database Record**:
```typescript
const { data: practiceCall } = await supabase
  .from('practice_calls')
  .insert({
    user_id: userId,
    scoring_status: 'waiting',
    created_at: new Date().toISOString()
  })
  .select()
  .single()
```

**Hook**: `hooks/use-practice-call.tsx`

### During Conversation

**Features**:
- Real-time audio streaming
- Visual waveform display
- Message bubbles (user and AI)
- Mute/unmute controls
- End call button

**Components**:
- `components/elevenlabs/conversation-bar.tsx` - Main interface
- `components/elevenlabs/live-waveform.tsx` - Audio visualization
- `components/elevenlabs/message.tsx` - Message display
- `components/elevenlabs/orb.tsx` - Animated orb

**Audio Handling**:
- WebRTC for low-latency audio
- Automatic echo cancellation
- Noise suppression
- Adaptive bitrate

### Ending a Call

**Flow**:
1. User clicks "End Call" or closes browser
2. ElevenLabs disconnects
3. Conversation data sent to external webhook
4. Post-call dialog appears
5. User can view feedback (after scoring)

**Webhook Data**:
```json
{
  "conversation_id": "conv_abc123",
  "transcript": [
    {
      "role": "user",
      "message": "Hello",
      "timestamp": "2026-02-03T10:00:00Z"
    },
    {
      "role": "agent",
      "message": "Hi there!",
      "timestamp": "2026-02-03T10:00:01Z"
    }
  ],
  "call_data": {
    "duration_secs": 120,
    "user_id": "user-uuid",
    "practice_call_id": "call-uuid"
  }
}
```

### Post-Call Dialog

**Component**: `components/practice/post-call-dialog.tsx`

**Features**:
- Thank you message
- Scoring status indicator
- "View Feedback" button (when ready)
- "Start New Call" button

**Status Polling**:
```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    const { data } = await supabase
      .from('practice_calls')
      .select('scoring_status')
      .eq('id', practiceCallId)
      .single()
    
    if (data?.scoring_status === 'complete') {
      clearInterval(interval)
      setShowFeedbackButton(true)
    }
  }, 2000) // Poll every 2 seconds
  
  return () => clearInterval(interval)
}, [practiceCallId])
```

**States**:
- **waiting**: Waiting for transcript from webhook
- **processing**: AI scoring in progress
- **complete**: Feedback ready
- **failed**: Scoring failed
- **skipped**: Call too short (< 60 seconds)

## AI Scoring System

### Scoring Workflow

**Trigger**: Database trigger when `scoring_status` changes to 'processing'

**Workflow**: `workflows/score-practice-call.ts`

**Steps**:

1. **Fetch Practice Call**
   ```typescript
   const practiceCall = await fetchPracticeCall(practiceCallId)
   ```

2. **Fetch Rubric**
   ```typescript
   const rubric = await fetchRubric() // Gets first prompt template
   ```

3. **Score with AI**
   ```typescript
   const feedback = await scoreWithAI(practiceCall.transcript_text, rubric)
   ```

4. **Save Scorecard**
   ```typescript
   await saveScorecard({
     practice_call_id: practiceCallId,
     user_id: userId,
     feedback: feedback
   })
   ```

5. **Update Status**
   ```typescript
   await updateStatus(practiceCallId, 'complete')
   ```

### OpenAI Integration

**Model**: GPT-4o

**Configuration**:
```typescript
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

const result = await generateText({
  model: openai('gpt-4o'),
  system: rubricTemplate, // From prompts table
  prompt: `Evaluate this conversation:\n\n${transcript}`,
  temperature: 0.7,
  maxTokens: 2000,
})
```

**Rubric Template** (from `prompts` table):
```
You are an expert coaching evaluator. Analyze the following practice conversation and provide detailed feedback.

Evaluate on these dimensions:
1. Active Listening
2. Powerful Questions
3. Creating Awareness
4. Designing Actions
5. Managing Progress

For each dimension:
- Provide a score (1-5)
- Give specific examples from the transcript
- Offer actionable recommendations

Format your response in markdown with clear sections.
```

**Output Format** (Markdown):
```markdown
# Practice Call Feedback

## Overall Performance
[Summary paragraph]

## Active Listening (4/5)
**Strengths:**
- You demonstrated excellent paraphrasing at [timestamp]
- Good use of silence to allow reflection

**Areas for Improvement:**
- Consider asking more clarifying questions
- Avoid interrupting the client

## Powerful Questions (3/5)
...

## Recommendations
1. Practice open-ended questions
2. Focus on the client's agenda
3. Use more silence
```

### Viewing Feedback

**Location**: `/practice/scorecard/[id]`

**Features**:
- Markdown-formatted feedback
- Call metadata (duration, date)
- Scorecard information
- Back to practice button

**Component**: `components/ui/markdown.tsx`

**Rendering**:
```typescript
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

<ReactMarkdown 
  remarkPlugins={[remarkGfm]}
  components={{
    h1: ({ children }) => <h1 className="text-3xl font-bold">{children}</h1>,
    h2: ({ children }) => <h2 className="text-2xl font-semibold">{children}</h2>,
    // ... custom styling for all markdown elements
  }}
>
  {feedback}
</ReactMarkdown>
```

### Minimum Call Duration

**Requirement**: 60 seconds minimum

**Logic**:
```typescript
if (practiceCall.call_duration_secs < 60) {
  await supabase
    .from('practice_calls')
    .update({
      scoring_status: 'skipped',
      status_reason: `Call too short (${practiceCall.call_duration_secs}s)`
    })
    .eq('id', practiceCallId)
  
  return {
    error: 'Call too short',
    duration_secs: practiceCall.call_duration_secs,
    minimum_secs: 60
  }
}
```

**User Experience**:
- Post-call dialog shows "Call too short" message
- No feedback button appears
- User can start new call

## Progress Tracking

### Completion Tracking

**Table**: `user_activity_completions`

**Schema**:
```sql
CREATE TABLE user_activity_completions (
  user_id UUID REFERENCES user_profiles(id),
  activity_id UUID REFERENCES typeforms(id),
  completed_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, activity_id)
);
```

**Features**:
- Automatic tracking on activity completion
- Timestamp of completion
- Prevents duplicate completions
- Used for prerequisite checking

### Progress Visualization

**Home Page**:
- Shows next recommended activity
- Displays completion count
- Shows current level

**Browse Page**:
- Visual indicators (locked/unlocked/completed)
- Progress bars per level
- Total completion percentage

**Component**: `lib/utils/activity-progress.tsx`

**Calculation**:
```typescript
function calculateProgress(activities, completions) {
  const total = activities.length
  const completed = completions.length
  const percentage = (completed / total) * 100
  
  return {
    total,
    completed,
    remaining: total - completed,
    percentage: Math.round(percentage)
  }
}
```

### Activity Status

**States**:
- **Locked**: Prerequisites not completed
- **Unlocked**: Available to start
- **Completed**: Already finished

**Visual Indicators**:
```typescript
function getStatusIcon(status) {
  switch (status) {
    case 'locked':
      return <LockIcon className="text-gray-400" />
    case 'unlocked':
      return <UnlockIcon className="text-green-500" />
    case 'completed':
      return <CheckIcon className="text-blue-500" />
  }
}
```

**Status Badge**:
```typescript
function getStatusBadge(status) {
  const styles = {
    locked: 'bg-gray-100 text-gray-600',
    unlocked: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700'
  }
  
  return (
    <span className={`px-2 py-1 rounded text-sm ${styles[status]}`}>
      {status.toUpperCase()}
    </span>
  )
}
```

## User Settings

**Location**: `/settings`

**Features**:
- Update username
- View account information
- Change theme
- (Future: Update email, password, preferences)

**Component**: `components/settings/update-username-form.tsx`

### Update Username

**Flow**:
1. User enters new username
2. Form validates input
3. Server action updates database
4. Success message displayed
5. Page revalidated

**Server Action**: `lib/supabase/actions.ts`

```typescript
'use server'

export async function updateUsername(username: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      id: user.id,
      username,
      updated_at: new Date().toISOString()
    })
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/settings')
  return { success: true }
}
```

**Validation**:
- Minimum 3 characters
- Maximum 50 characters
- Alphanumeric and underscores only
- No profanity (optional)

## Theme Support

**Implementation**: next-themes

**Features**:
- Light mode
- Dark mode
- System preference detection
- Persistent selection
- No flash on load

**Provider**: `components/theme/theme-provider.tsx`

**Toggle**: `components/theme/theme-switch.tsx`

**Setup**:
```typescript
// In app/layout.tsx
import { ThemeProvider } from '@/components/theme/theme-provider'

<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  {children}
</ThemeProvider>
```

**Usage**:
```typescript
'use client'
import { useTheme } from 'next-themes'

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme()
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle Theme
    </button>
  )
}
```

**CSS Variables**:
```css
/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

## Admin Features

### Admin Role

**Database**: `user_profiles.role`

**Values**:
- `user` - Standard user (default)
- `admin` - Administrator

**Setting Admin Role**:
```sql
-- In Supabase SQL Editor
UPDATE user_profiles
SET role = 'admin'
WHERE id = 'user-uuid';
```

### Admin Capabilities

**Current**:
- Access to all data (via RLS bypass)
- Can view all users' activities
- Can view all practice calls

**Future** (not implemented):
- User management interface
- Activity management
- Rubric management
- Analytics dashboard
- Content moderation

### Row Level Security

**Admin Policies**:
```sql
-- Example: Admins can view all practice calls
CREATE POLICY "Admins can view all practice calls"
ON practice_calls FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
```

**User Policies**:
```sql
-- Users can only view their own practice calls
CREATE POLICY "Users can view own practice calls"
ON practice_calls FOR SELECT
USING (user_id = auth.uid());
```

## Feature Roadmap

### Planned Features

**Short Term**:
- [ ] Email notifications for activity completion
- [ ] Practice call history page
- [ ] Search and filter activities
- [ ] User profile page
- [ ] Activity bookmarking

**Medium Term**:
- [ ] Peer review system
- [ ] Coach matching
- [ ] Video practice sessions
- [ ] Custom rubrics per activity
- [ ] Progress analytics dashboard

**Long Term**:
- [ ] Mobile app (React Native)
- [ ] Live coaching sessions
- [ ] Community features (forums, groups)
- [ ] Certification program
- [ ] Multi-language support

### Experimental Features

**Voice Analysis**:
- Sentiment analysis
- Speaking pace analysis
- Filler word detection
- Tone analysis

**Advanced AI**:
- Real-time coaching suggestions
- Personalized learning paths
- Adaptive difficulty
- Predictive analytics

---

This documentation covers all current features. For technical implementation details, see [ARCHITECTURE.md](ARCHITECTURE.md).
