


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."can_user_access_activity"("p_user_id" "uuid", "p_activity_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_required_count int;
  v_completed_count int;
begin
  -- Count how many prerequisites are required
  select count(*)
  into v_required_count
  from activity_requirements
  where activity_id = p_activity_id;
  
  -- If no requirements, always accessible
  if v_required_count = 0 then
    return true;
  end if;
  
  -- Count how many required activities the user has completed
  select count(*)
  into v_completed_count
  from activity_requirements ar
  inner join user_activity_completions uac
    on uac.activity_id = ar.requires_activity_id
    and uac.user_id = p_user_id
  where ar.activity_id = p_activity_id;
  
  -- User can access if they've completed all requirements
  return v_completed_count >= v_required_count;
end;
$$;


ALTER FUNCTION "public"."can_user_access_activity"("p_user_id" "uuid", "p_activity_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_activity"("p_user_id" "uuid", "p_activity_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into user_activity_completions (user_id, activity_id)
  values (p_user_id, p_activity_id)
  on conflict (user_id, activity_id) do nothing;
end;
$$;


ALTER FUNCTION "public"."complete_activity"("p_user_id" "uuid", "p_activity_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_practice_call_processing"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  api_key TEXT;
  api_url TEXT;
BEGIN
  -- Only process if status changed to 'processing'
  IF NEW.scoring_status = 'processing' AND OLD.scoring_status != 'processing' THEN
    
    -- Retrieve API key and URL from Vault
    SELECT decrypted_secret INTO api_key
    FROM vault.decrypted_secrets
    WHERE name = 'workflow_api_key'
    LIMIT 1;
    
    SELECT decrypted_secret INTO api_url
    FROM vault.decrypted_secrets
    WHERE name = 'next_api_url'
    LIMIT 1;
    
    -- Call the API - let it handle all validation and business logic
    PERFORM net.http_post(
      url := api_url || '/api/practice/score-practice-call',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || api_key,
        'ngrok-skip-browser-warning', 'true'
      ),
      body := jsonb_build_object('practice_call_id', NEW.id::text)
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_practice_call_processing"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_requirements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "activity_id" "uuid" NOT NULL,
    "requires_activity_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activity_requirements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."levels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "order_index" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."levels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."typeforms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "level_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL,
    "published" boolean DEFAULT true NOT NULL,
    "activity_slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "form_id" "text",
    "hint" "text"
);


ALTER TABLE "public"."typeforms" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."active_activity_hierarchy" AS
 SELECT "l"."id" AS "level_id",
    "l"."title" AS "level_title",
    "l"."description" AS "level_description",
    "l"."order_index" AS "level_order",
    "t"."id" AS "activity_id",
    "t"."title" AS "activity_title",
    "t"."activity_slug",
    "t"."description" AS "activity_description",
    "t"."order_index" AS "activity_order",
    "t"."published" AS "activity_published",
    "t"."form_id",
    "t"."hint",
    COALESCE("array_agg"("ar"."requires_activity_id") FILTER (WHERE ("ar"."requires_activity_id" IS NOT NULL)), '{}'::"uuid"[]) AS "requires_activity_ids"
   FROM (("public"."levels" "l"
     LEFT JOIN "public"."typeforms" "t" ON (("t"."level_id" = "l"."id")))
     LEFT JOIN "public"."activity_requirements" "ar" ON (("ar"."activity_id" = "t"."id")))
  WHERE (("t"."id" IS NULL) OR ("t"."published" = true))
  GROUP BY "l"."id", "l"."title", "l"."description", "l"."order_index", "t"."id", "t"."title", "t"."activity_slug", "t"."description", "t"."order_index", "t"."published", "t"."form_id", "t"."hint"
  ORDER BY "l"."order_index", "t"."order_index";


ALTER VIEW "public"."active_activity_hierarchy" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_key" (
    "decrypted_secret" "text" COLLATE "pg_catalog"."C"
);


ALTER TABLE "public"."api_key" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."practice_calls" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "call_data" "jsonb",
    "conversation_id" "text",
    "call_duration_secs" integer,
    "transcript" "jsonb",
    "scoring_status" "text" NOT NULL,
    "status_reason" "text",
    "transcript_text" "text",
    CONSTRAINT "practice_calls_scoring_status_check" CHECK (("scoring_status" = ANY (ARRAY['waiting'::"text", 'processing'::"text", 'complete'::"text", 'failed'::"text", 'skipped'::"text"])))
);


ALTER TABLE "public"."practice_calls" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prompts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "label" "text" NOT NULL,
    "template" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."prompts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scorecards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "practice_call_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "feedback" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."scorecards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_activity_completions" (
    "user_id" "uuid" NOT NULL,
    "activity_id" "uuid" NOT NULL,
    "completed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_activity_completions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "username" "text" NOT NULL,
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'user'::"text"])))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activity_requirements"
    ADD CONSTRAINT "activity_requirements_activity_id_requires_activity_id_key" UNIQUE ("activity_id", "requires_activity_id");



ALTER TABLE ONLY "public"."activity_requirements"
    ADD CONSTRAINT "activity_requirements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."levels"
    ADD CONSTRAINT "modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."practice_calls"
    ADD CONSTRAINT "practice_sessions_conversation_id_key" UNIQUE ("conversation_id");



ALTER TABLE ONLY "public"."practice_calls"
    ADD CONSTRAINT "practice_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prompts"
    ADD CONSTRAINT "prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scorecards"
    ADD CONSTRAINT "scorecards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."typeforms"
    ADD CONSTRAINT "typeforms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scorecards"
    ADD CONSTRAINT "unique_practice_call_scorecard" UNIQUE ("practice_call_id");



ALTER TABLE ONLY "public"."user_activity_completions"
    ADD CONSTRAINT "user_activity_completions_pkey" PRIMARY KEY ("user_id", "activity_id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_activity_requirements_activity" ON "public"."activity_requirements" USING "btree" ("activity_id");



CREATE INDEX "idx_activity_requirements_requires" ON "public"."activity_requirements" USING "btree" ("requires_activity_id");



CREATE INDEX "idx_practice_calls_scoring_status" ON "public"."practice_calls" USING "btree" ("scoring_status") WHERE ("scoring_status" = 'processing'::"text");



CREATE INDEX "idx_user_completions_user" ON "public"."user_activity_completions" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "trigger_practice_call_processing" AFTER UPDATE ON "public"."practice_calls" FOR EACH ROW EXECUTE FUNCTION "public"."handle_practice_call_processing"();



ALTER TABLE ONLY "public"."activity_requirements"
    ADD CONSTRAINT "activity_requirements_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."typeforms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_requirements"
    ADD CONSTRAINT "activity_requirements_requires_activity_id_fkey" FOREIGN KEY ("requires_activity_id") REFERENCES "public"."typeforms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."practice_calls"
    ADD CONSTRAINT "practice_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scorecards"
    ADD CONSTRAINT "scorecards_practice_call_id_fkey" FOREIGN KEY ("practice_call_id") REFERENCES "public"."practice_calls"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scorecards"
    ADD CONSTRAINT "scorecards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."typeforms"
    ADD CONSTRAINT "typeforms_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "public"."levels"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_activity_completions"
    ADD CONSTRAINT "user_activity_completions_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."typeforms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_activity_completions"
    ADD CONSTRAINT "user_activity_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




























































































































































GRANT ALL ON FUNCTION "public"."can_user_access_activity"("p_user_id" "uuid", "p_activity_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_user_access_activity"("p_user_id" "uuid", "p_activity_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_user_access_activity"("p_user_id" "uuid", "p_activity_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_activity"("p_user_id" "uuid", "p_activity_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_activity"("p_user_id" "uuid", "p_activity_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_activity"("p_user_id" "uuid", "p_activity_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_practice_call_processing"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_practice_call_processing"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_practice_call_processing"() TO "service_role";


















GRANT ALL ON TABLE "public"."activity_requirements" TO "anon";
GRANT ALL ON TABLE "public"."activity_requirements" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_requirements" TO "service_role";



GRANT ALL ON TABLE "public"."levels" TO "anon";
GRANT ALL ON TABLE "public"."levels" TO "authenticated";
GRANT ALL ON TABLE "public"."levels" TO "service_role";



GRANT ALL ON TABLE "public"."typeforms" TO "anon";
GRANT ALL ON TABLE "public"."typeforms" TO "authenticated";
GRANT ALL ON TABLE "public"."typeforms" TO "service_role";



GRANT ALL ON TABLE "public"."active_activity_hierarchy" TO "anon";
GRANT ALL ON TABLE "public"."active_activity_hierarchy" TO "authenticated";
GRANT ALL ON TABLE "public"."active_activity_hierarchy" TO "service_role";



GRANT ALL ON TABLE "public"."api_key" TO "anon";
GRANT ALL ON TABLE "public"."api_key" TO "authenticated";
GRANT ALL ON TABLE "public"."api_key" TO "service_role";



GRANT ALL ON TABLE "public"."practice_calls" TO "anon";
GRANT ALL ON TABLE "public"."practice_calls" TO "authenticated";
GRANT ALL ON TABLE "public"."practice_calls" TO "service_role";



GRANT ALL ON TABLE "public"."prompts" TO "anon";
GRANT ALL ON TABLE "public"."prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."prompts" TO "service_role";



GRANT ALL ON TABLE "public"."scorecards" TO "anon";
GRANT ALL ON TABLE "public"."scorecards" TO "authenticated";
GRANT ALL ON TABLE "public"."scorecards" TO "service_role";



GRANT ALL ON TABLE "public"."user_activity_completions" TO "anon";
GRANT ALL ON TABLE "public"."user_activity_completions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activity_completions" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































