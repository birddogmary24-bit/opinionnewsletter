
import fetch from 'node-fetch';

async function triggerTestSend() {
    const url = 'https://opinion-newsletter-web-810426728503.us-central1.run.app/api/admin/send';
    console.log(`Triggering test email to ${url}...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': 'admin_session=authenticated'
            },
            body: JSON.stringify({
                type: 'group',
                targetGroup: 'test'
            })
        });

        const data = await response.json();
        console.log('Response Status:', response.status);
        console.log('Response Body:', data);
    } catch (error) {
        console.error('Error triggering test send:', error);
    }
}

triggerTestSend();
