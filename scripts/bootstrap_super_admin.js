// ==============================================================================
// UniVerse AI — Super Admin Bootstrap Script (Section 26)
// ==============================================================================
// This script runs strictly on the server-side, verifies the target account
// via Firebase Admin SDK, assigns custom claims { role: 'super_admin', admin: true },
// records the role in Supabase database `admin_roles`, and logs the immutable audit event.
// ==============================================================================

const fs = require('fs');
const path = require('path');

// Ensure node_modules are resolvable
const projectRoot = path.resolve(__dirname, '..');
module.paths.push(path.join(projectRoot, 'node_modules'));

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { createClient } = require('@supabase/supabase-js');

// 1. Load environment variables
const envPath = path.join(projectRoot, '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('[BOOTSTRAP ERROR] .env.local file not found at:', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (key) => {
  const m = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : null;
};

const clientEmail = getEnv('FIREBASE_CLIENT_EMAIL');
let privateKey = getEnv('FIREBASE_PRIVATE_KEY');
const projectId = getEnv('FIREBASE_PROJECT_ID') || getEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseServiceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

if (privateKey) {
  privateKey = privateKey.replace(/\\n/g, '\n');
}

if (!clientEmail || !privateKey || !projectId) {
  console.error('[BOOTSTRAP ERROR] Missing Firebase Admin credentials in .env.local');
  process.exit(1);
}

// Target email passed as CLI argument or defaults to verified initial account
const targetEmail = process.argv[2] || 'vanaparthishankar27@gmail.com';

async function bootstrap() {
  console.log('================================================================');
  console.log('UniVerse AI — First Super Admin Bootstrap Process');
  console.log('================================================================\n');

  // Initialize Firebase Admin
  if (!getApps().length) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  }

  const auth = getAuth();
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 1. Check if an active Super Admin already exists in admin_roles (One-time guard)
  console.log('[1/4] Checking existing administrative hierarchy...');
  try {
    const { data: existingSuperAdmins, error: dbErr } = await supabase
      .from('admin_roles')
      .select('id, user_id, email, is_active')
      .eq('role', 'super_admin')
      .eq('is_active', true);

    if (!dbErr && existingSuperAdmins && existingSuperAdmins.length > 0) {
      console.warn(`[WARNING] Active Super Admin already registered: ${existingSuperAdmins[0].email}`);
      console.log('Bootstrap is locked to prevent duplicate execution.');
      process.exit(0);
    }
  } catch (err) {
    console.log('      (admin_roles table not yet queried or initialized, proceeding)');
  }

  // 2. Fetch target user from Firebase Authentication
  console.log(`[2/4] Verifying target account: ${targetEmail}...`);
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(targetEmail);
    console.log(`      ✓ Target user confirmed in Firebase: UID = ${userRecord.uid}`);
  } catch (err) {
    console.error(`[ERROR] User "${targetEmail}" was not found in Firebase Authentication: ${err.message}`);
    process.exit(1);
  }

  // 3. Assign Custom Claims
  console.log('[3/4] Embedding cryptographic custom claims (role: super_admin, admin: true)...');
  await auth.setCustomUserClaims(userRecord.uid, {
    role: 'super_admin',
    admin: true,
  });
  console.log('      ✓ Custom claims set successfully.');

  // 4. Update Supabase Database records & Audit Log
  console.log('[4/4] Recording Super Admin role & logging immutable audit trail in Supabase...');
  try {
    await supabase.from('admin_roles').upsert({
      user_id: userRecord.uid,
      email: userRecord.email,
      role: 'super_admin',
      assigned_by: 'system_bootstrap',
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    await supabase.from('admin_audit_logs').insert({
      user_id: userRecord.uid,
      email: userRecord.email,
      role: 'super_admin',
      action: 'super_admin_bootstrap',
      target_entity: 'system',
      target_id: userRecord.uid,
      new_state: { role: 'super_admin', admin: true },
      metadata: { source: 'bootstrap_script', email: userRecord.email },
    });

    console.log('      ✓ Database role and audit log created.');
  } catch (err) {
    console.warn('      (Database record note:', err.message, ')');
  }

  console.log('\n================================================================');
  console.log('✓ SUCCESS: Super Admin Account Activated!');
  console.log(`  Account: ${userRecord.email}`);
  console.log(`  UID:     ${userRecord.uid}`);
  console.log(`  Role:    super_admin`);
  console.log('  Login:   Log in at /login, then navigate to /admin');
  console.log('================================================================');
}

bootstrap().catch((err) => {
  console.error('[FATAL BOOTSTRAP ERROR]:', err);
  process.exit(1);
});
