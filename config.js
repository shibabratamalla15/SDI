// ============================================================
// SDI — Supabase configuration
// Fill these in from: Supabase Dashboard -> Project Settings -> API
// ============================================================
const SUPABASE_URL = "https://mskflhqoxnnoqsmsdvca.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1za2ZsaHFveG5ub3FzbXNkdmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODUxNjIsImV4cCI6MjEwMjU2MTE2Mn0.9iiVDS-ZED21RegW3fuRm4zQ0T5aovyg6pJicAEOEkM";

// This must exactly match the email of the Owner account you create
// in Supabase Authentication, and the 'owner@sdi.app' value used
// inside schema.sql's RLS policies.
const OWNER_EMAIL = "shibabratamalla15@.com";

// Store display name (shown in the header)
const STORE_NAME = "Shibam Drugs India";

// ---- Do not edit below this line ----
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
