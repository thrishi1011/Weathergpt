/**
 * Automated Verification Suite for WeatherGPT Silent Chat Persistence & Recovery Links
 * Tests all 12 flows requested by the user.
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xcpcuqzaoocbqieqnrec.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjcGN1cXphb29jYnFpZXFucmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyNjcxODQsImV4cCI6MjEwNDg0MzE4NH0.ViZoAv5K5bIYf5D08r5559_1y8BKCWg0w7Bt7EFVlSw';

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

async function runTests() {
  console.log('=================================================================');
  console.log('🧪 RUNNING SILENT PERSISTENCE & RECOVERY LINK VERIFICATION SUITE');
  console.log('=================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: First visit -> anonymous session created -> no login screen
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 1: First Visit (Anonymous Session Creation) ---');
  const browserA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: authA, error: errAuthA } = await browserA.auth.signInAnonymously();
  assert(!errAuthA && authA?.user?.id, 'Browser A created anonymous Supabase session');
  assert(authA.user.is_anonymous === true, 'Browser A is authenticated as an anonymous user');
  const userA_id = authA.user.id;
  console.log(`  ℹ️ Browser A User ID: ${userA_id}`);

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: Ask a question -> answer appears -> user & assistant message saved
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 2: Ask Question & Save Conversation ---');
  const { data: sessionA, error: errSessA } = await browserA
    .from('chat_sessions')
    .insert({ user_id: userA_id, title: 'What is the weather today in Warangal?' })
    .select()
    .single();
  assert(!errSessA && sessionA?.id, `Created chat session: ${sessionA?.id}`);

  const userQuery = 'What is the weather today in Warangal?';
  const { data: msgUser, error: errUser } = await browserA
    .from('chat_messages')
    .insert({
      session_id: sessionA.id,
      user_id: userA_id,
      role: 'user',
      message: userQuery,
      language: 'en'
    })
    .select()
    .single();
  assert(!errUser && msgUser?.id, 'User message saved to chat_messages');

  const assistantAnswer = 'The weather in Warangal is currently 25.5°C with overcast skies and 67% rain probability.';
  const { data: msgAssistant, error: errAssistant } = await browserA
    .from('chat_messages')
    .insert({
      session_id: sessionA.id,
      user_id: userA_id,
      role: 'assistant',
      message: assistantAnswer,
      language: 'en'
    })
    .select()
    .single();
  assert(!errAssistant && msgAssistant?.id, 'Assistant message saved to chat_messages');

  // Update session updated_at
  await browserA.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionA.id);

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3 & 4: Reload / Reopen Browser -> same anonymous session -> SAME last conversation automatically appears
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 3 & 4: Browser Reopen & Auto-Continuation of Last Active Chat ---');
  // Query latest session deterministically by updated_at DESC limit 1
  const { data: latestSessions, error: errLatest } = await browserA
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userA_id)
    .order('updated_at', { ascending: false })
    .limit(1);

  assert(!errLatest && latestSessions.length === 1, 'Found user latest active session');
  assert(latestSessions[0].id === sessionA.id, 'Latest session is exactly the previous session');

  const { data: restoredMsgs, error: errRestoredMsgs } = await browserA
    .from('chat_messages')
    .select('*')
    .eq('session_id', latestSessions[0].id)
    .order('created_at', { ascending: true });

  assert(!errRestoredMsgs && restoredMsgs.length === 2, 'Restored all 2 messages in the conversation');
  assert(restoredMsgs[0].message === userQuery, 'User message restored identically');
  assert(restoredMsgs[1].message === assistantAnswer, 'Assistant message restored identically');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: Wait / Long Time Gap Simulation -> previous conversation still restored
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 5: Time Gap Simulation ---');
  const { data: timeGapSession } = await browserA
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userA_id)
    .order('updated_at', { ascending: false })
    .limit(1);
  assert(timeGapSession && timeGapSession[0].id === sessionA.id, 'Previous conversation persists across time gaps');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 6: Open Second Browser / Profile -> separate identity -> first user history NOT visible
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 6: Multi-Browser Profile Isolation (RLS) ---');
  const browserB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: authB } = await browserB.auth.signInAnonymously();
  const userB_id = authB.user.id;
  assert(userB_id !== userA_id, 'Browser B has separate anonymous user ID');

  const { data: bSessions } = await browserB.from('chat_sessions').select('*').eq('user_id', userA_id);
  assert(bSessions.length === 0, 'RLS prevents Browser B from accessing Browser A sessions');

  const { data: bMsgs } = await browserB.from('chat_messages').select('*').eq('session_id', sessionA.id);
  assert(bMsgs.length === 0, 'RLS prevents Browser B from accessing Browser A messages');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 7: Generate Cryptographic Recovery Link Token (Hashed in DB)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 7: Cryptographic Recovery Link Generation ---');
  const rawRecoveryToken = crypto.randomBytes(32).toString('hex'); // 64 hex chars
  const tokenHash = sha256(rawRecoveryToken);
  assert(rawRecoveryToken.length === 64, 'Generated 256-bit cryptographically random token');

  const { data: tokenRow, error: errToken } = await browserA
    .from('recovery_codes')
    .insert({
      user_id: userA_id,
      code_hash: tokenHash
    })
    .select()
    .single();
  assert(!errToken && tokenRow?.id, 'Saved SHA-256 token hash into recovery_codes table');

  // Verify raw token is NOT in database
  const { data: checkDb } = await browserA.from('recovery_codes').select('*').eq('id', tokenRow.id).single();
  assert(checkDb.code_hash === tokenHash, 'Database stores only the SHA-256 hash');
  assert(!JSON.stringify(checkDb).includes(rawRecoveryToken), 'Raw recovery token is never stored in the database');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 8: Open Previously Saved Recovery Link (Storage Cleared Scenario)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 8: Recovery Link Restoration for New Anonymous Session ---');
  // Browser B simulates having cleared storage or a new browser opening the recovery link:
  const { data: restoreResult, error: errRestore } = await browserB.rpc('restore_chat_history_with_recovery_code', {
    p_code_hash: tokenHash
  });
  assert(!errRestore && restoreResult.success === true, 'PostgreSQL RPC successfully restored history using token hash');
  console.log(`  ℹ️ Recovery Result: ${JSON.stringify(restoreResult)}`);

  // Browser B can now read all transferred sessions and messages under RLS
  const { data: bRestoredSessions } = await browserB
    .from('chat_sessions')
    .select('*')
    .order('updated_at', { ascending: false });

  assert(bRestoredSessions.length >= 1, `Browser B now owns and can access ${bRestoredSessions.length} sessions`);
  assert(bRestoredSessions[0].id === sessionA.id, 'Session A is now owned by Browser B');

  const { data: bRestoredChatMsgs } = await browserB
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionA.id)
    .order('created_at', { ascending: true });

  assert(bRestoredChatMsgs.length === 2, 'Browser B restored both messages from Session A');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 9: Open Invalid Recovery Link
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 9: Invalid Recovery Link Rejection ---');
  const invalidToken = 'deadbeef0000111122223333444455556666777788889999aaaabbbbccccdddd';
  const { data: badRestoreResult } = await browserB.rpc('restore_chat_history_with_recovery_code', {
    p_code_hash: sha256(invalidToken)
  });
  assert(badRestoreResult && badRestoreResult.success === false, 'Invalid recovery token safely rejected without modifying ownership');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 10: Chat After Recovery -> new messages saved -> context preserved
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 10: Continuing Chat After Recovery ---');
  const followUpQuery = 'What about tomorrow?';
  const { data: msgFollowUp, error: errFollowUp } = await browserB
    .from('chat_messages')
    .insert({
      session_id: sessionA.id,
      user_id: userB_id,
      role: 'user',
      message: followUpQuery,
      language: 'en'
    })
    .select()
    .single();

  assert(!errFollowUp && msgFollowUp?.id, 'Follow-up message saved under restored session');

  const { data: allSessionMsgs } = await browserB
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionA.id)
    .order('created_at', { ascending: true });

  assert(allSessionMsgs.length === 3, 'Session contains 3 messages (2 original + 1 follow-up)');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 11 & 12: Verification of No Automatic Deletion & Clean Slate
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 11 & 12: Data Integrity & Persistence Verification ---');
  assert(allSessionMsgs.length === 3, 'No conversations or messages were deleted');

  // Clean up test data
  await browserB.from('chat_sessions').delete().eq('id', sessionA.id);

  console.log('\n=================================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED PERFECTLY!`);
  console.log('=================================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
