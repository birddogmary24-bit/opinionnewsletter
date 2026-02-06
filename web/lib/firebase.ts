import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import path from 'path';

if (!admin.apps.length) {
    try {
        const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH || path.join(process.cwd(), 'service-account.json');

        let credential;
        try {
            // Try loading from file first (local dev)
            const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
            credential = admin.credential.cert(serviceAccount);
            console.log(`🔥 Firebase: Loaded credentials from ${serviceAccountPath}`);
        } catch (e) {
            // Fallback to ADC (Cloud Run environment)
            credential = admin.credential.applicationDefault();
            console.log("🔥 Firebase: Using Application Default Credentials (ADC)");
        }

        admin.initializeApp({
            credential,
            projectId: 'opnionnewsletter'
        });
    } catch (error) {
        console.error("Firebase admin init error", error);
    }
}

// Explicitly use the named database 'opinionnewsletterdb'
// We use admin.app() to get the initialized default app instance
export const db = getFirestore(admin.app(), 'opinionnewsletterdb');
