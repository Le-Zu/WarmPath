import * as admin from 'firebase-admin';
import {readFileSync } from 'fs';
import path from 'path';

// Points to secure JSON file
const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json')

// Read and parse the JSON file
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

// Initialize the Admin app
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Export the auth module, so that middleware can use it
export const adminAuth = admin.auth();
