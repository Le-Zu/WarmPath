/**
 * seed-firebase-users.ts
 *
 * Creates Firebase Authentication accounts for all DB users that do not yet
 * have a firebase_uid, then links the generated UID back into the database.
 *
 * Usage:
 *   npx tsx scripts/seed-firebase-users.ts
 *
 * Requires DATABASE_URL in .env and serviceAccountKey.json at the project root.
 *
 * Password used for all created accounts: 
 * Re-running is safe — existing accounts are detected and linked instead.
 */

import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';
import { basePrisma } from '../src/lib/prisma';
import 'dotenv/config';

const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const firebaseAuth = admin.auth();
const SEED_PASSWORD = 'Password123!';

async function seedFirebaseUsers() {
    const users = await basePrisma.users.findMany({
        where: { firebase_uid: null, is_active: true },
        select: {
            user_id: true,
            email: true,
            first_name: true,
            last_name: true,
        },
    });

    if (users.length === 0) {
        console.log('All active users already have Firebase accounts. Nothing to do.');
        return;
    }

    console.log(`Creating Firebase accounts for ${users.length} users...\n`);

    let created = 0;
    let linked = 0;
    let failed = 0;

    for (const user of users) {
        const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ') || undefined;

        try {
            const record = await firebaseAuth.createUser({
                email: user.email,
                password: SEED_PASSWORD,
                displayName,
                emailVerified: true,
            });

            await basePrisma.users.update({
                where: { user_id: user.user_id },
                data: { firebase_uid: record.uid },
            });

            console.log(`  created  ${user.email}  →  ${record.uid}`);
            created++;
        } catch (err: any) {
            if (err.code === 'auth/email-already-exists') {
                // Account exists in Firebase but is not linked to the DB record yet
                try {
                    const record = await firebaseAuth.getUserByEmail(user.email);

                    await basePrisma.users.update({
                        where: { user_id: user.user_id },
                        data: { firebase_uid: record.uid },
                    });

                    console.log(`  linked   ${user.email}  →  ${record.uid}  (account already existed)`);
                    linked++;
                } catch (linkErr: any) {
                    console.error(`  failed   ${user.email}  (link step): ${linkErr.message}`);
                    failed++;
                }
            } else {
                console.error(`  failed   ${user.email}: ${err.message}`);
                failed++;
            }
        }
    }

    console.log(`\nDone — created: ${created}, linked: ${linked}, failed: ${failed}`);
    console.log(`Password for all accounts: ${SEED_PASSWORD}`);
}

seedFirebaseUsers()
    .catch(console.error)
    .finally(() => process.exit(0));
