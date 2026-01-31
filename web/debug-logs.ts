import { db } from './lib/firebase.js';

async function checkLogs() {
    const activeSubs = await db.collection('subscribers').where('status', '==', 'active').get();
    console.log(`Active subscribers: ${activeSubs.size}`);

    const snapshot = await db.collection('mail_history').orderBy('sent_at', 'desc').get();
    console.log(`Total logs: ${snapshot.size}`);

    let totalRecipients = 0;
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const todayKST = new Date(now.getTime() + kstOffset).toISOString().split('T')[0];

    console.log(`Today (KST): ${todayKST}`);

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        const logKST = new Date(new Date(data.sent_at).getTime() + kstOffset).toISOString().split('T')[0];
        console.log(`- ${data.sent_at} (KST: ${logKST}) | Recipient: ${data.recipient_count} | Status: ${data.status}`);

        if (logKST === todayKST && data.status === 'success') {
            totalRecipients += (Number(data.recipient_count) || 0);
        }
    });

    console.log(`\nCalculated Today Recipient Total: ${totalRecipients}`);
}

checkLogs().catch(console.error);
