# Practice Platform

An AI-powered coaching practice platform that enables users to engage in realistic voice conversations with AI agents and receive detailed feedback on their performance.

## 🎯 Overview

This platform provides an interactive learning environment where users can:
- Complete structured learning activities organized by levels
- Practice conversations with AI-powered voice agents
- Receive AI-generated feedback and scoring on their practice sessions
- Track their progress through a curriculum with prerequisite-based unlocking

## 🚀 Tech Stack

### Core Framework
- **Next.js 16.1.1** - React framework with App Router
- **React 19.2.3** - UI library
- **TypeScript 5** - Type-safe development

### Database & Backend
- **Supabase** - PostgreSQL database with authentication, storage, and real-time features
  - Row Level Security (RLS) enabled
  - Database functions and triggers for business logic
  - Server-side rendering with `@supabase/ssr`

### AI & Voice
- **ElevenLabs** - Real-time voice conversation agents
- **OpenAI GPT-4o** - AI-powered transcript scoring and feedback generation

### UI & Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animation library
- **next-themes** - Dark/light mode support

### Third-Party Integrations
- **Typeform** - Embedded learning activities and assessments
- **Sentry** - Error monitoring and performance tracking
- **Vercel Workflows** - Async background job processing

## 📁 Project Structure

```
typeform-app-2/
├── app/                          # Next.js App Router
│   ├── (app)/                    # Main application routes
│   │   ├── home/                 # Home page with recommendations
│   │   ├── browse/               # Browse all activities
│   │   ├── activity/[id]/        # Individual activity pages
│   │   ├── practice/             # Voice practice interface
│   │   │   └── scorecard/[id]/   # Practice feedback results
│   │   └── settings/             # User settings
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/
│   │   ├── sign-up/
│   │   ├── forgot-password/
│   │   └── update-password/
│   └── api/                      # API routes
│       ├── practice/score-practice-call/
│       └── signup/
├── components/                   # React components
│   ├── activities/               # Activity browsing and cards
│   ├── auth/                     # Authentication forms
│   ├── elevenlabs/               # Voice conversation UI
│   ├── practice/                 # Practice session components
│   ├── typeform/                 # Typeform integration
│   └── ui/                       # Reusable UI components
├── lib/                          # Utilities and configurations
│   ├── contexts/                 # React contexts
│   ├── supabase/                 # Supabase clients and utilities
│   └── utils/                    # Helper functions
├── workflows/                    # Background job workflows
│   ├── score-practice-call.ts    # AI scoring workflow
│   └── user-signup.ts            # User onboarding workflow
├── export/                       # Database export and documentation
│   ├── schema.sql                # Complete database schema
│   ├── data.sql                  # Database data export
│   └── supabase/                 # Supabase configuration
└── docs/                         # Documentation
    ├── SETUP.md                  # Development setup guide
    ├── ARCHITECTURE.md           # System architecture
    ├── DEPLOYMENT.md             # Deployment guide
    ├── API.md                    # API reference
    ├── FEATURES.md               # Feature documentation
    └── TROUBLESHOOTING.md        # Common issues and solutions
```

## 🏗️ Core Features

### 1. Activity-Based Learning
- Structured curriculum organized by levels
- Typeform-embedded learning activities
- Prerequisite-based activity unlocking
- Progress tracking and completion status

### 2. Voice Practice Sessions
- Real-time voice conversations with AI agents via ElevenLabs
- WebRTC-based audio streaming
- Automatic transcript generation
- Session recording and storage

### 3. AI-Powered Feedback
- Automated scoring of practice conversations
- GPT-4o-powered feedback generation
- Detailed scorecards with actionable insights
- Markdown-formatted feedback display

### 4. Progress Tracking
- User activity completion tracking
- Next activity recommendations
- Visual progress indicators
- Activity status (locked/unlocked/completed)

### 5. User Management
- Supabase authentication
- User profiles with roles (admin/user)
- Settings management
- Session management with middleware

## 📚 Documentation

- **[Setup Guide](docs/SETUP.md)** - Get started with local development
- **[Architecture](docs/ARCHITECTURE.md)** - Understand the system design
- **[Deployment](docs/DEPLOYMENT.md)** - Deploy to production
- **[API Reference](docs/API.md)** - API endpoints documentation
- **[Features](docs/FEATURES.md)** - Detailed feature documentation
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

## 🚦 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase CLI
- Docker Desktop (for local Supabase)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd typeform-app-2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

4. **Set up Supabase**
   
   See the [Database Export README](export/README.md) for detailed instructions on importing the database.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

For detailed setup instructions, see [docs/SETUP.md](docs/SETUP.md).

## 🔑 Environment Variables

Required environment variables (see `.env.example` for template):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
SUPABASE_SECRET_KEY=

# API Configuration
LOCAL_API_URL=http://localhost:3000
WORKFLOW_API_KEY=

# AI Services
OPENAI_API_KEY=
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=

# Monitoring
SENTRY_AUTH_TOKEN=
```

## 🔄 Key Workflows

### Practice Call Scoring Flow
1. User completes voice conversation with AI agent
2. ElevenLabs sends transcript to webhook
3. Database trigger fires when status changes to 'processing'
4. API endpoint starts scoring workflow
5. OpenAI GPT-4o evaluates transcript against rubric
6. Scorecard saved to database
7. User views detailed feedback

### Activity Completion Flow
1. User completes Typeform activity
2. External webhook receives submission
3. Database function marks activity as complete
4. Client polls for completion
5. Next activity recommendation shown
6. Progress updated

## 🗄️ Database Schema

Key tables:
- `user_profiles` - User information and roles
- `levels` - Activity level organization
- `typeforms` - Learning activities
- `activity_requirements` - Prerequisites between activities
- `user_activity_completions` - Progress tracking
- `practice_calls` - Voice session records
- `scorecards` - AI-generated feedback
- `prompts` - Scoring rubric templates

For detailed schema documentation, see `export/schema.sql` and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## 🔐 Security Notes

- **Never commit `.env*` files** - Already in `.gitignore`
- **Row Level Security (RLS)** enabled on all tables
- **API key authentication** for workflow endpoints
- **Supabase Auth** for user authentication
- **Middleware** protects authenticated routes

## 🧪 Current Status

- ✅ Local development fully functional
- ✅ Database schema complete with migrations
- ✅ All core features implemented
- ⚠️ No production deployment yet
- ⚠️ External webhooks need configuration
- ⚠️ No automated tests

## 🛠️ Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Generate Supabase types
npx supabase gen types typescript --project-id <project-id> --schema public > lib/supabase/types.ts
```

## 📦 Key Dependencies

- `next@16.1.1` - React framework
- `@supabase/ssr@0.8.0` - Supabase SSR
- `@elevenlabs/react@0.12.3` - Voice AI SDK
- `@ai-sdk/openai@3.0.12` - OpenAI integration
- `@typeform/embed-react@4.11.0` - Typeform embeds
- `@sentry/nextjs@10.35.0` - Error monitoring
- `workflow@4.0.1-beta.48` - Background jobs

## 🤝 Contributing

See [docs/SETUP.md](docs/SETUP.md) for development setup and guidelines.

## 📄 License

[Add your license here]

## 📞 Support

For issues and questions:
- Review [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- Check the [Database Export README](export/README.md)
- Review Supabase logs and error messages

## 🔗 Related Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [ElevenLabs Documentation](https://elevenlabs.io/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Vercel Workflows Documentation](https://vercel.com/docs/workflow)

---

**Note**: This codebase includes a complete database export in the `export/` directory. See [export/README.md](export/README.md) for detailed instructions on setting up the database for a new environment.
