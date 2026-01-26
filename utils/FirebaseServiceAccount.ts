
// ⚠️ SECURITY WARNING ⚠️
// Embedding the Service Account Private Key in the client-side code is NOT recommended for production apps.
// Ideally, this logic should reside in a secure backend (Firebase Cloud Functions).
// We are implementing this CLIENT-SIDE only per specific user request to avoid external scripts.

export const SERVICE_ACCOUNT = {
    "project_id": import.meta.env.VITE_SERVICE_ACCOUNT_PROJECT_ID,
    "private_key_id": import.meta.env.VITE_SERVICE_ACCOUNT_PRIVATE_KEY_ID,
    "private_key": import.meta.env.VITE_SERVICE_ACCOUNT_PRIVATE_KEY,
    "client_email": import.meta.env.VITE_SERVICE_ACCOUNT_CLIENT_EMAIL,
    "token_uri": "https://oauth2.googleapis.com/token"
};

// Helper: Convert base64 url safe
function base64Url(str: string) {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Helper: Convert array buffer to base64 url
function arrayBufferToBase64Url(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return base64Url(binary);
}

// Helper: Parse PEM to ArrayBuffer
function str2ab(str: string) {
    const binaryString = window.atob(str);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

let cachedAccessToken: string | null = null;
let tokenExpiry: number = 0;

export const getFcmV1AccessToken = async (): Promise<string | null> => {
    // Return cached if valid
    if (cachedAccessToken && Date.now() < tokenExpiry) {
        return cachedAccessToken;
    }

    try {
        const header = {
            alg: "RS256",
            typ: "JWT"
        };

        const now = Math.floor(Date.now() / 1000);
        const claimSet = {
            iss: SERVICE_ACCOUNT.client_email,
            scope: "https://www.googleapis.com/auth/firebase.messaging",
            aud: SERVICE_ACCOUNT.token_uri,
            exp: now + 3600, // 1 hour
            iat: now
        };

        const encodedHeader = base64Url(JSON.stringify(header));
        const encodedClaimSet = base64Url(JSON.stringify(claimSet));
        const data = `${encodedHeader}.${encodedClaimSet}`;

        // Prepare Key
        // Remove headers and newlines from PEM
        const pemContents = SERVICE_ACCOUNT.private_key
            .replace(/\\n/g, '')
            .replace(/-----BEGIN PRIVATE KEY-----/, '')
            .replace(/-----END PRIVATE KEY-----/, '')
            .replace(/\s/g, '');

        const binaryKey = str2ab(pemContents);

        // Import Key using Web Crypto API
        const key = await window.crypto.subtle.importKey(
            "pkcs8",
            binaryKey,
            {
                name: "RSASSA-PKCS1-v1_5",
                hash: { name: "SHA-256" }
            },
            false,
            ["sign"]
        );

        // Sign
        const signature = await window.crypto.subtle.sign(
            "RSASSA-PKCS1-v1_5",
            key,
            new TextEncoder().encode(data)
        );

        const signedJwt = `${data}.${arrayBufferToBase64Url(signature)}`;

        // Exchange JWT for Access Token
        const response = await fetch(SERVICE_ACCOUNT.token_uri, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${signedJwt}`
        });

        const json = await response.json();

        if (json.access_token) {
            cachedAccessToken = json.access_token;
            tokenExpiry = Date.now() + (json.expires_in * 1000) - 60000; // Buffer 1 min
            console.log("FCM V1 Token Generated successfully");
            return cachedAccessToken;
        } else {
            console.error("Failed to generate FCM Token", json);
            return null;
        }

    } catch (e) {
        console.error("Error generating FCM V1 Token:", e);
        return null;
    }
};
