// ==============================================================================
// UniVerse AI — Direct Password Reset Utility (Firebase Admin SDK)
// ==============================================================================
// Use this tool to set or update a user's password directly on the server,
// bypassing email delivery delays or spam folder filtering.
// ==============================================================================

const fs = require('fs');
const path = require('path');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const envPath = path.resolve(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('[ERROR] .env.local not found at:', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (k) => {
  const m = envContent.match(new RegExp('^' + k + '=(.*)$', 'm'));
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
};

const clientEmail = getEnv('FIREBASE_CLIENT_EMAIL');
let privateKey = getEnv('FIREBASE_PRIVATE_KEY');
const projectId = getEnv('FIREBASE_PROJECT_ID') || getEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID');

if (privateKey) {
  privateKey = privateKey.replace(/\\n/g, '\n');
}

if (!clientEmail || !privateKey || !projectId) {
  console.error('[ERROR] Missing Firebase Admin credentials in .env.local');
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
}

const auth = getAuth();

const email = process.argv[2] || 'vanaparthishankar27@gmail.com';
const newPassword = process.argv[3];

async function main() {
  console.log('================================================================');
  console.log('UniVerse AI — Direct Password Management Utility');
  console.log('================================================================\n');

  if (!newPassword) {
    console.log(`Checking account: ${email}...`);
    try {
      const user = await auth.getUserByEmail(email);
      console.log(`✓ User found: UID = ${user.uid}`);
      console.log(`  Providers: ${user.providerData.map((p) => p.providerId).join(', ')}`);
      console.log(`  Email Verified: ${user.emailVerified}`);
      console.log('\nTo set or change this user\'s password directly, run:');
      console.log(`  node scripts/set_user_password.js ${email} "YourNewPassword123!"\n`);
    } catch (err) {
      console.error(`[ERROR] User "${email}" not found in Firebase Authentication: ${err.message}`);
      process.exit(1);
    }
    return;
  }

  if (newPassword.length < 6) {
    console.error('[ERROR] Password must be at least 6 characters long.');
    process.exit(1);
  }

  console.log(`Setting new password for account: ${email}...`);
  try {
    const user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, {
      password: newPassword,
    });

    console.log('\n================================================================');
    console.log('✓ SUCCESS: Password updated successfully in Firebase!');
    console.log(`  Account:  ${email}`);
    console.log(`  UID:      ${user.uid}`);
    console.log(`  Password: (updated to your provided value)`);
    console.log('  You can now sign in at /login using this email and new password.');
    console.log('================================================================\n');
  } catch (err) {
    console.error('[ERROR] Failed to update password:', err.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
