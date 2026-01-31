import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import path from 'path';

if (!admin.apps.length) {
    try {
        // Determine path to service account
        // In local dev, process.cwd() is the 'web' folder.
        const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH || path.join(process.cwd(), 'service-account.json');

        console.log(`Loading service account from: ${serviceAccountPath}`);
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: 'opnionnewsletter'
        });
        console.log("🔥 Firebase Admin Initialized");
    } catch (error) {
        console.error("Firebase admin init error", error);
    }
}

// Explicitly use the named database 'opinionnewsletterdb'
// We use admin.app() to get the initialized default app instance
export const db = getFirestore(admin.app(), 'opinionnewsletterdb');
