// import 'react-native-url-polyfill/auto'
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://aebfwwdjqwhpjqnvnrno.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlYmZ3d2RqcXdocGpxbnZucm5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMjY1MzIsImV4cCI6MjA1OTgwMjUzMn0.SowAU8r_trAwez-rciEWAU3PvJSgT0vXCvHi9Ebb_wc";

export const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL || supabaseUrl,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || supabaseAnonKey,
    {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    }
);