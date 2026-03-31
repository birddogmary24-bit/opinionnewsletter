import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

// manually init since we are running as a script
const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
let credential;

if (existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    credential = admin.credential.cert(serviceAccount);
    console.log('Firebase: Loaded credentials from service account file');
} else {
    credential = admin.credential.applicationDefault();
    console.log("Firebase: Using Application Default Credentials (ADC)");
}

admin.initializeApp({
    credential,
    projectId: 'opnionnewsletter'
});

const db = getFirestore(admin.app(), 'opinionnewsletterdb');

async function main() {
    console.log("\n--- Latest Mail History ---");
    try {
        const mailHistory = await db.collection('mail_history')
            .orderBy('sent_at', 'desc')
            .limit(5)
            .get();
        mailHistory.forEach(doc => {
            console.log(doc.id, "=>", doc.data());
        });
    } catch (e) {
        console.error("Error querying mail history:", e);
    }
    
    console.log("\n--- Recent Logs ---");
    try {
        const logs = await db.collection('logs')
            .orderBy('timestamp', 'desc')
            .limit(5)
            .get();
        logs.forEach(doc => {
            console.log(doc.id, "=>", doc.data());
        });
    } catch (e) {
        console.log("No recent logs found or collection doesn't exist");
    }

    process.exit(0);
}

main();
