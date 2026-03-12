/**
 * migrate-encryption.js
 *
 * 모든 구독자 이메일을 LEGACY_ENCRYPTION_KEY에서 ENCRYPTION_KEY로 재암호화합니다.
 *
 * 사용법:
 *   ENCRYPTION_KEY=<new_32char_key> \
 *   LEGACY_ENCRYPTION_KEY=<old_32char_key> \
 *   [SERVICE_ACCOUNT_PATH=./service-account.json] \
 *   node scripts/migrate-encryption.js
 *
 * Cloud Run (ADC 인증) 환경에서는 SERVICE_ACCOUNT_PATH 불필요.
 */

const admin = require('firebase-admin');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const LEGACY_ENCRYPTION_KEY = process.env.LEGACY_ENCRYPTION_KEY;
const IV_LENGTH = 16;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    console.error('❌ ENCRYPTION_KEY must be set (32 characters)');
    process.exit(1);
}
if (!LEGACY_ENCRYPTION_KEY || LEGACY_ENCRYPTION_KEY.length !== 32) {
    console.error('❌ LEGACY_ENCRYPTION_KEY must be set (32 characters)');
    process.exit(1);
}

// Firebase 초기화
const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH || path.join(process.cwd(), 'service-account.json');
let credential;
try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    credential = admin.credential.cert(serviceAccount);
    console.log('✅ Firebase: 서비스 계정 파일로 인증');
} catch {
    credential = admin.credential.applicationDefault();
    console.log('✅ Firebase: ADC(Application Default Credentials)로 인증');
}

admin.initializeApp({ credential, projectId: 'opnionnewsletter' });
const db = admin.getFirestore(admin.app(), 'opinionnewsletterdb');

function tryDecryptWithKey(text, key) {
    try {
        const parts = text.split(':');
        const iv = Buffer.from(parts.shift(), 'hex');
        const encrypted = Buffer.from(parts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch {
        return null;
    }
}

function encryptWithKey(text, key) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

async function migrate() {
    console.log('\n🔄 구독자 이메일 재암호화 마이그레이션 시작...\n');

    const snapshot = await db.collection('subscribers').get();
    console.log(`📋 총 ${snapshot.size}명의 구독자 발견\n`);

    let migrated = 0;
    let alreadyNew = 0;
    let failed = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const encryptedEmail = data.email;

        // 이미 새 키로 암호화된 경우 → 복호화 성공
        const withNewKey = tryDecryptWithKey(encryptedEmail, ENCRYPTION_KEY);
        if (withNewKey !== null) {
            console.log(`  ⏭️  ${doc.id.slice(0, 8)}... 이미 새 키로 암호화됨 (건너뜀)`);
            alreadyNew++;
            continue;
        }

        // 구 키로 복호화 시도
        const withLegacyKey = tryDecryptWithKey(encryptedEmail, LEGACY_ENCRYPTION_KEY);
        if (withLegacyKey === null) {
            // plaintext 이메일인지 확인 (콜론 없음)
            if (!encryptedEmail.includes(':')) {
                const reEncrypted = encryptWithKey(encryptedEmail, ENCRYPTION_KEY);
                await db.collection('subscribers').doc(doc.id).update({ email: reEncrypted });
                console.log(`  ✅ ${doc.id.slice(0, 8)}... plaintext → 새 키로 암호화 완료`);
                migrated++;
                continue;
            }
            console.error(`  ❌ ${doc.id.slice(0, 8)}... 복호화 실패 (두 키 모두 실패)`);
            failed++;
            continue;
        }

        // 새 키로 재암호화
        const reEncrypted = encryptWithKey(withLegacyKey, ENCRYPTION_KEY);
        await db.collection('subscribers').doc(doc.id).update({ email: reEncrypted });
        console.log(`  ✅ ${doc.id.slice(0, 8)}... 구 키 → 새 키 재암호화 완료`);
        migrated++;
    }

    console.log('\n========================================');
    console.log(`✅ 마이그레이션 완료`);
    console.log(`   - 재암호화: ${migrated}명`);
    console.log(`   - 이미 완료: ${alreadyNew}명`);
    console.log(`   - 실패: ${failed}명`);
    console.log(`   - 합계: ${snapshot.size}명`);
    console.log('========================================\n');

    if (failed > 0) {
        console.warn('⚠️  일부 구독자 마이그레이션 실패. 위 로그를 확인하세요.');
        process.exit(1);
    }

    process.exit(0);
}

migrate().catch(err => {
    console.error('❌ 마이그레이션 오류:', err);
    process.exit(1);
});
