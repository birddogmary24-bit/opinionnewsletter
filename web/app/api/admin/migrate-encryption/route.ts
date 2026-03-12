import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/firebase';
import { decryptEmail, encryptEmail } from '@/lib/crypto';

// POST /api/admin/migrate-encryption
// Re-encrypts all subscriber emails using the current ENCRYPTION_KEY.
// Use this after setting LEGACY_ENCRYPTION_KEY to the old key and ENCRYPTION_KEY to the new key.
export async function POST() {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('admin_session');

        if (session?.value !== 'authenticated') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!process.env.ENCRYPTION_KEY) {
            return NextResponse.json({ error: 'ENCRYPTION_KEY is not configured' }, { status: 500 });
        }

        const snapshot = await db.collection('subscribers').get();
        let migrated = 0;
        let failed = 0;

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const decrypted = decryptEmail(data.email);

            if (decrypted === null) {
                failed++;
                continue;
            }

            // Skip plaintext emails (already handled by decryptEmail returning as-is)
            // Re-encrypt with current ENCRYPTION_KEY
            try {
                const reEncrypted = encryptEmail(decrypted);
                await db.collection('subscribers').doc(doc.id).update({ email: reEncrypted });
                migrated++;
            } catch {
                failed++;
            }
        }

        return NextResponse.json({ success: true, migrated, failed, total: snapshot.size });
    } catch {
        console.error("Error during encryption migration");
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
