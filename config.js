// ============================================================
// SDI — Supabase configuration
// Fill these in from: Supabase Dashboard -> Project Settings -> API
// ============================================================
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";

// This must exactly match the email of the Owner account you create
// in Supabase Authentication, and the 'owner@sdi.app' value used
// inside schema.sql's RLS policies.
const OWNER_EMAIL = "owner@sdi.app";

// Store display name (shown in the header)
const STORE_NAME = "Shibam Drugs India";

// ---- Do not edit below this line ----
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
