import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';

// Points to secure JSON file
// Using porcess.cwd() ensures it looks in the root of server/
const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');

// read and parse the JSON file
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Export the auth module so the routes can use it to verify tokens
export const auth = admin.auth();