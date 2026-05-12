import { createClient } from '@supabase/supabase-js';

const getEnv = (name: string): string => {
  try {
    const messengerMeta = import.meta as any;
    const value = messengerMeta.env[name];
    if (typeof value === 'string') return value.trim();
  } catch (e) {
    // Fallback
    const value = (import.meta as any).env?.[name];
    if (typeof value === 'string') return value.trim();
  }
  return '';
};

const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');

const isMissing = !url || url.includes('YOUR_SUPABASE') || url.includes('your-project-id');

// Always initialize the client with something valid-looking to prevent load-time crashes.
// Real error handling happens when use occurs.
const finalUrl = isMissing ? 'https://placeholder.supabase.co' : url;
const finalKey = isMissing ? 'placeholder' : key;

export const supabase = createClient(finalUrl, finalKey);

if (isMissing) {
  console.warn('Supabase configuration is missing. Authentication and database features will not work.');
}

export const isSupabaseConfigured = () => !isMissing;

