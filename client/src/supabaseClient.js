import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://keetgrchresbfiyfwndu.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_BS_NZezGDAFTXzFef86Kyw_OCtGIdbW';

export const supabase = createClient(supabaseUrl, supabaseKey);
