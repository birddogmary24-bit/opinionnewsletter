export async function trackAmplitudeEvent(eventType: string, userId: string, eventProperties: any = {}) {
    const API_KEY = '8ea3ecbd77bd681c16097fe2fc257c82';

    // Fire and forget to avoid blocking the main thread too long
    // But we still wrap in a try-catch
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

        fetch('https://api2.amplitude.com/2/httpapi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*'
            },
            body: JSON.stringify({
                api_key: API_KEY,
                events: [
                    {
                        user_id: userId,
                        event_type: eventType,
                        event_properties: eventProperties,
                        time: Date.now()
                    }
                ]
            }),
            signal: controller.signal
        }).then(response => {
            clearTimeout(timeoutId);
            if (!response.ok) {
                response.json().then(errorData => {
                    console.error('Amplitude Tracking Error:', errorData);
                }).catch(() => { }); // Catch potential error if response.json() fails
            }
        }).catch(err => {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                console.warn('Amplitude tracking timed out');
            } else {
                console.error('Amplitude Tracking Fetch Error:', err);
            }
        });
    } catch (error) {
        console.error('Amplitude Track Error:', error);
    }
}
