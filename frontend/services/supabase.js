/**
 * Supabase Anonymous Auth & Chat History Service for WeatherGPT
 * Provides:
 * - Silent persistent anonymous authentication
 * - Session restoration on reload / browser reopen
 * - RLS-compliant chat session & message CRUD
 * - Secure hashed recovery code generation & ownership transfer
 */

import { createClient } from '@supabase/supabase-js';

// WeatherGPT Public Supabase Configuration
export const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || 'https://xcpcuqzaoocbqieqnrec.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjcGN1cXphb29jYnFpZXFucmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyNjcxODQsImV4cCI6MjEwNDg0MzE4NH0.ViZoAv5K5bIYf5D08r5559_1y8BKCWg0w7Bt7EFVlSw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: window.localStorage
  }
});

let currentUser = null;
let isInitializingAuth = null;

/**
 * Initialize or restore Supabase Anonymous Auth session.
 * 1. Checks existing session in localStorage.
 * 2. If no valid session, silently signs in anonymously.
 * 3. Returns the authenticated User object.
 */
export async function initAuthSession() {
  if (currentUser) return currentUser;
  if (isInitializingAuth) return isInitializingAuth;

  isInitializingAuth = (async () => {
    try {
      // 1. Check existing session
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      if (session && session.user) {
        currentUser = session.user;
        return currentUser;
      }

      // 2. No session found -> Create anonymous user
      const { data, error: anonErr } = await supabase.auth.signInAnonymously();
      if (anonErr) {
        console.warn('[WeatherGPT Supabase] Anonymous sign-in error:', anonErr.message);
        // Retry once if network glitch
        const retryRes = await supabase.auth.signInAnonymously();
        if (retryRes.data?.user) {
          currentUser = retryRes.data.user;
          return currentUser;
        }
        return null;
      }

      if (data && data.user) {
        currentUser = data.user;
        return currentUser;
      }
    } catch (err) {
      console.warn('[WeatherGPT Supabase] Auth initialization exception:', err.message);
    } finally {
      isInitializingAuth = null;
    }
    return null;
  })();

  return isInitializingAuth;
}

/**
 * Get current authenticated user
 */
export async function getActiveUser() {
  if (!currentUser) {
    currentUser = await initAuthSession();
  }
  return currentUser;
}

/**
 * Fetch all chat sessions for the current anonymous user, ordered by most recently updated
 */
export async function fetchUserSessions() {
  const user = await getActiveUser();
  if (!user) return [];

  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('[WeatherGPT Supabase] Error fetching sessions:', error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn('[WeatherGPT Supabase] fetchUserSessions failed:', e);
    return [];
  }
}

/**
 * Fetch all messages for a specific session ordered chronologically
 */
export async function fetchSessionMessages(sessionId) {
  if (!sessionId) return [];
  const user = await getActiveUser();
  if (!user) return [];

  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[WeatherGPT Supabase] Error fetching messages:', error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn('[WeatherGPT Supabase] fetchSessionMessages failed:', e);
    return [];
  }
}

/**
 * Create a new chat session for current user
 */
export async function createChatSession(initialTitle = 'New Conversation') {
  const user = await getActiveUser();
  if (!user) throw new Error('Cannot create session: User not authenticated');

  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: user.id,
      title: initialTitle.trim() || 'New Conversation'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create chat session: ${error.message}`);
  }
  return data;
}

/**
 * Update chat session title
 */
export async function updateChatSessionTitle(sessionId, title) {
  if (!sessionId || !title) return;
  const user = await getActiveUser();
  if (!user) return;

  try {
    await supabase
      .from('chat_sessions')
      .update({
        title: title.trim().slice(0, 100),
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('user_id', user.id);
  } catch (e) {
    console.warn('[WeatherGPT Supabase] Error updating session title:', e);
  }
}

/**
 * Update chat session updated_at timestamp
 */
export async function touchChatSession(sessionId) {
  if (!sessionId) return;
  const user = await getActiveUser();
  if (!user) return;

  try {
    await supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_id', user.id);
  } catch (e) {
    console.warn('[WeatherGPT Supabase] Error touching session timestamp:', e);
  }
}

/**
 * Save a message to chat_messages table
 */
export async function saveChatMessage({ sessionId, role, message, language = 'en' }) {
  if (!sessionId || !message || !role) return null;
  const user = await getActiveUser();
  if (!user) throw new Error('Cannot save message: User not authenticated');

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      user_id: user.id,
      role: role,
      message: message.trim(),
      language: language || 'en'
    })
    .select()
    .single();

  if (error) {
    console.warn('[WeatherGPT Supabase] Error saving message:', error.message);
    throw error;
  }

  // Update session updated_at
  await touchChatSession(sessionId);

  return data;
}

/**
 * Delete a chat session and all its cascading messages
 */
export async function deleteChatSession(sessionId) {
  if (!sessionId) return false;
  const user = await getActiveUser();
  if (!user) return false;

  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', user.id);

  if (error) {
    console.warn('[WeatherGPT Supabase] Error deleting session:', error.message);
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// RECOVERY CODE SYSTEM (Cryptographic, Hashed, Zero raw user_id exposure)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a SHA-256 hex string from text using Web Crypto API
 */
export async function sha256Hex(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a cryptographically random recovery code in format: WG-XXXX-XXXX
 */
function generateRandomCodeString() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude 0, 1, I, O for readability
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars[randomBytes[i] % chars.length];
    part2 += chars[randomBytes[i + 4] % chars.length];
  }
  return `WG-${part1}-${part2}`;
}

/**
 * Get or create a secure recovery code for the current anonymous session.
 * Stores only SHA-256 hash in Supabase, keeping the raw code client-side.
 */
export async function getOrCreateRecoveryCode() {
  const user = await getActiveUser();
  if (!user) return null;

  const localKey = `weathergpt_recovery_code_${user.id}`;
  const cachedCode = localStorage.getItem(localKey) || localStorage.getItem('weathergpt_last_recovery_code');

  if (cachedCode) {
    return cachedCode;
  }

  // Generate new code
  const rawCode = generateRandomCodeString();
  const normalized = rawCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const hash = await sha256Hex(normalized);

  try {
    // Store hash in recovery_codes table
    const { error } = await supabase
      .from('recovery_codes')
      .insert({
        user_id: user.id,
        code_hash: hash
      });

    if (!error || error.code === '23505') { // Unique constraint violation is fine
      localStorage.setItem(localKey, rawCode);
      localStorage.setItem('weathergpt_last_recovery_code', rawCode);
      return rawCode;
    }
  } catch (e) {
    console.warn('[WeatherGPT Supabase] Error saving recovery code:', e);
  }

  return rawCode;
}

/**
 * Restore chat history using a saved recovery code.
 * Calls Postgres SECURITY DEFINER function to re-assign session ownership to current user.
 */
export async function restoreChatWithRecoveryCode(inputCode) {
  if (!inputCode || !inputCode.trim()) {
    return { success: false, message: 'Please enter a valid recovery code' };
  }

  const user = await getActiveUser();
  if (!user) {
    return { success: false, message: 'Unable to authenticate session' };
  }

  // Normalize code: remove dashes/spaces and uppercase
  const normalized = inputCode.trim().replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const hash = await sha256Hex(normalized);

  try {
    const { data, error } = await supabase.rpc('restore_chat_history_with_recovery_code', {
      p_code_hash: hash
    });

    if (error) {
      return { success: false, message: error.message || 'Recovery failed' };
    }

    if (data && data.success) {
      // Store recovered code locally
      localStorage.setItem(`weathergpt_recovery_code_${user.id}`, inputCode.trim().toUpperCase());
      localStorage.setItem('weathergpt_last_recovery_code', inputCode.trim().toUpperCase());
      return {
        success: true,
        message: data.message || 'Chat history successfully restored!',
        sessionsCount: data.transferred_sessions || 0,
        messagesCount: data.transferred_messages || 0
      };
    }

    return {
      success: false,
      message: data?.message || 'Invalid or expired recovery code'
    };
  } catch (err) {
    return {
      success: false,
      message: err.message || 'Failed to communicate with recovery service'
    };
  }
}
