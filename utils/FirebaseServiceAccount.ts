
// ⚠️ SECURITY WARNING ⚠️
// Embedding the Service Account Private Key in the client-side code is NOT recommended for production apps.
// Ideally, this logic should reside in a secure backend (Firebase Cloud Functions).
// We are implementing this CLIENT-SIDE only per specific user request to avoid external scripts.

export const SERVICE_ACCOUNT = {
    "project_id": "goo-now-1ce44",
    "private_key_id": "56b453f3324317c51dbfacd19f32bb364f9b5a84",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC8LfXvjw05i6QA\neGMpaExBT38HlBOar3Ykux8w38ZlYL/1+X/HCe0n/QS2Sb7NVKBUGVFxWTjlX5aG\ncGQeRYeSX9dJnohRE9IPbmu7I6YWX13mys6RSijKPQAxM7x9a9acVjbIaQyAP7V7\ndwjnl4+ICb+QVMpkz4F87P2s9algCOYt5NY+1YNujoGzAfiiDl598Ib3hlnwwWiA\na52aDY51baXEa3LrrmYKDqxJDe59nAdVWZJS79h09m34lLHgVtPBWzhUnQ70dRhl\n1ESI47dL2tEHb9wwgSMAB7iZv0Z59SwRHFr6+dsolzfcgZKWcwu2Gnno/NoV+CNT\nHvtis6K1AgMBAAECggEAAtcaFQK5OzWe2jz27jCQpL8Llp8xs+N9v9ctL4J+eZg+\nEtCFu7OBfK7by9k4GTGeS+FSnTMwtybmsY0aYxSUk8KA5YUQNKe9GMDcvRHa12VF\nbbmA6FN7YyC26Ic0i0YTPVUrICzpuePRnD/zMUpUfxlP5rXzlMBHCY4q1ASkiPpY\nGIxWuV9ilT0lzbri2+a7CjJMRPLpffFJyt7fGcXqin0Fg8xGsXnsCeC1iEwXksDW\nwqKGSqV7rShBfJxWvO1hn6cqUFuNlLTSmxeKE8w0RylIQNfQjJ1LMrv5fyo4SYUK\nEFiUMFDhta6LLQ5j93XaYl4Ri2TwpmLGgm/DqNCpkQKBgQDtBuAYEQ2Uhv7W4wUA\n+jnvbuZPDHFcLEFqUrXpu/vUoqTKRy7wG5vnD9NNr5gxPo9+wHKUevp67XftUmUv\npt9noy2bj+E4pIT22EUcTfLLXR4w31lZfszzWZoIzi9DT9ZEziv3T5/zm7ziW8HS\ng4knJIK3dJ9BUzPFEegWk6YivQKBgQDLPhyysZHw5lY+tRELd0frLIraTAALIjNe\nirUQIv4w8OA8Mvh9s2bGobM4CTscT3ZsghvDcGi1UEzceQa+Pb++qtl3c6IaI1G/\nqTawUSAXMAaqY9qgFjQVatvgljFjjNAegKt+0+wJIpdtSXorV+52Te2IXNySVfWc\ncTHdirA7WQKBgFdXz0BPGGgBDut0oKVpj+vRPAEpHqTOkhRyAiLtaLFEdeEsNfm4\n0sxkooLgD/8lhI86r35TivW9iBHl6O+UWILCOM44SNAsn+qua1kwyCV0XOm5hB1c\ngn2yKPbRs8zkIJseNkleCB0m6IWpNlUyr1nDNIAR85WI6WzXWmTnZ7MpAoGABbAF\nSZLijKVFgJe8lF+QKaqjcBx0W9tnKJwlGQCBsIjtHYInpgzhMWnRBB5uAwrOO5cg\ng8WfiINowzq3z5cWyJUrZMZdoPGgFgb8Os7qYPu9FAObWKOGbZsB8DUDyM9l+5SK\nOBBiKJdJOYu22YOqbrEblpdSrN2u8+PPC24YJHECgYEAmLxOkqzcDiPHaoWBygRt\nMMIctJTkgQfTzvLK0zWwBQIEd0hEe7J59g4gIepFQGFmX40hsVJKcgmk45EVfGSE\nL2g2suJ5GV838jB0tioO0QQLo6RdDCfZ6Se6+Bp0AusZ4pg4Fe2q6dp/xVJQgcb/\nG1UYnMbznK6Kq3HHG6lYCLU=\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-fbsvc@goo-now-1ce44.iam.gserviceaccount.com",
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
