# Supabase Project Export

This package contains a complete export of the Supabase project from `rkignudpkqyvtdmbwcez.supabase.co`, exported on February 2, 2026.

## Contents

This export includes:

1. **schema.sql** - Complete database schema including:
   - Tables, views, and materialized views
   - Functions and stored procedures
   - Triggers and constraints
   - Custom types and enums
   - Indexes

2. **data.sql** - All data records from your database tables (using PostgreSQL COPY format for efficient imports)

3. **roles.sql** - Custom database roles and permissions

4. **supabase/config.toml** - Project configuration file with settings for:
   - API configuration
   - Database settings
   - Authentication settings
   - Storage configuration
   - Edge Runtime settings
   - And more

## Prerequisites

Before importing this project, ensure you have:

1. **Supabase CLI** installed
   - macOS: `brew install supabase/tap/supabase`
   - npm: `npm install -g supabase`
   - Other platforms: See [Supabase CLI installation guide](https://supabase.com/docs/guides/cli)

2. **Docker Desktop** installed and running
   - Required for local development
   - Download from [docker.com](https://docs.docker.com/desktop/)

3. **A Supabase account** (free tier is sufficient)
   - Sign up at [supabase.com](https://supabase.com)

## Setup Instructions

### Option 1: Import to a New Supabase Project (Recommended)

1. **Create a new Supabase project**
   ```bash
   # Login to Supabase
   supabase login
   
   # Create a new project (or use the dashboard)
   supabase projects create your-project-name --org-id YOUR_ORG_ID
   ```

2. **Initialize local Supabase**
   ```bash
   # Create a new directory for your project
   mkdir my-project
   cd my-project
   
   # Initialize Supabase
   supabase init
   ```

3. **Copy the configuration**
   ```bash
   # Copy the config.toml from this export
   cp /path/to/export/supabase/config.toml supabase/config.toml
   ```

4. **Link to your new project**
   ```bash
   supabase link --project-ref YOUR_NEW_PROJECT_REF
   ```

5. **Import the schema**
   ```bash
   # Start local Supabase
   supabase start
   
   # Apply the schema
   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < /path/to/export/schema.sql
   
   # Or push to remote
   supabase db push
   ```

6. **Import the data**
   ```bash
   # Import data to local database
   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < /path/to/export/data.sql
   
   # Or import directly to remote (be careful!)
   # Get your database URL from the Supabase dashboard
   psql YOUR_DATABASE_URL < /path/to/export/data.sql
   ```

7. **Import custom roles** (if needed)
   ```bash
   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < /path/to/export/roles.sql
   ```

### Option 2: Import to Local Development Only

1. **Initialize local Supabase**
   ```bash
   mkdir my-project
   cd my-project
   supabase init
   ```

2. **Copy configuration**
   ```bash
   cp /path/to/export/supabase/config.toml supabase/config.toml
   ```

3. **Start Supabase**
   ```bash
   supabase start
   ```

4. **Import schema and data**
   ```bash
   # Import schema
   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < /path/to/export/schema.sql
   
   # Import data
   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < /path/to/export/data.sql
   
   # Import roles
   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < /path/to/export/roles.sql
   ```

## Environment Variables

You will need to set up your own environment variables. The original `.env.local` file was not included for security reasons. Here are the required variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_anon_key_here
SUPABASE_SECRET_KEY=your_service_role_key_here

# API Configuration
LOCAL_API_URL=http://localhost:3000
WORKFLOW_API_KEY=your_workflow_api_key_here

# Third-party Services (if needed)
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id_here
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here
```

You can find your Supabase keys in your project dashboard under Settings > API.

## Database Connection

After import, you can connect to your database using:

**Local Development:**
```
postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

**Remote Project:**
```
Get from Supabase Dashboard > Settings > Database > Connection String
```

## Important Notes

### What's Included
- ✅ Database schema (tables, views, functions, triggers)
- ✅ All data records
- ✅ Custom database roles
- ✅ Project configuration

### What's NOT Included
- ❌ Environment variables / secrets (you must configure these yourself)
- ❌ Supabase-managed schemas (`auth`, `storage`, `realtime` - these are automatically created)
- ❌ Storage bucket files (only bucket configurations are included)
- ❌ Vault secrets (must be reconfigured manually)
- ❌ Edge Functions (none were found in the original project)

### Schema Exclusions
The following Supabase-managed schemas are excluded from the export as they are automatically created and managed by Supabase:
- `auth` - Authentication system
- `storage` - File storage system
- `realtime` - Real-time subscriptions
- `extensions` - PostgreSQL extensions
- `graphql_public` - GraphQL API

## Troubleshooting

### "Permission denied" errors
Make sure you're using the correct database credentials and that your user has sufficient permissions.

### "Relation already exists" errors
This means some tables already exist. You may need to:
1. Drop existing tables, or
2. Use `supabase db reset` to start fresh

### "Docker daemon not running"
Start Docker Desktop before running Supabase commands.

### Import takes a long time
This is normal for large datasets. The `data.sql` file uses COPY statements which are optimized for bulk imports.

## Next Steps

After successful import:

1. **Verify the data**
   ```bash
   # Connect to your database
   supabase db start
   
   # Check tables
   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "\dt"
   ```

2. **Test your application**
   - Update your application's environment variables
   - Test database connections
   - Verify API endpoints work correctly

3. **Set up authentication**
   - Configure auth providers in the Supabase dashboard
   - Update redirect URLs for your domain

4. **Configure storage** (if needed)
   - Set up storage buckets in the dashboard
   - Upload any required files

## Support

For issues with:
- **Supabase CLI**: See [CLI documentation](https://supabase.com/docs/reference/cli)
- **Database import**: See [PostgreSQL documentation](https://www.postgresql.org/docs/)
- **Supabase platform**: Visit [Supabase support](https://supabase.com/support)

## Export Information

- **Exported from**: `rkignudpkqyvtdmbwcez.supabase.co`
- **Export date**: February 2, 2026
- **Supabase CLI version**: 2.72.7
- **PostgreSQL version**: 17.6

---

**Note**: This is a complete snapshot of the database at the time of export. Any changes made to the original project after this export will not be reflected in these files.
