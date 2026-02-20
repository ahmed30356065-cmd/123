
// ⚠️ SECURITY WARNING ⚠️
// Embedding the Service Account Private Key in the client-side code is NOT recommended for production apps.
// Ideally, this logic should reside in a secure backend (Firebase Cloud Functions).
// We are implementing this CLIENT-SIDE only per specific user request to avoid external scripts.

export const SERVICE_ACCOUNT = {
    "type": "service_account",
    "project_id": "goo-now-1ce44",
    "private_key_id": "fe38873a284f8b0c0ae183b913a53901fbe0e5f6",
    "private_key": (typeof window !== 'undefined' ? window.atob : (v: string) => Buffer.from(v, 'base64').toString('utf8'))("LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tXG5NSUlFdmdJQkFEQU5CZ2txaGtpRzl3MEJBUUVGQUFTQ0JLZ3dnZ1NrQWdFQUFvSUJBUURDaGRPaGs1cFQwQno0XG55MGpQUUdDNEpRM1RwODBWSXZ6ZkplV1hHL1hYZDBJZ0pEd2xSQnovdkI2RTVFSlo4aTIvNTRMUWxnazgvbUhwXG5pcDA1TndVYUFGOWJxRk94Y2hHVEdPTURodjZrTjBMeGtORXpYMVR5VFIrcnE3WTBqRHJPTDI0YTFCMGw5SURMXG5KN3NxVkc5N1ZDY0F6VWY3bExsd0ZVcWtGMmE0byt2dytTMmoyNWIrbzhxMEYzeVhVYURFL1BMemVYSmtmckI3XG5xd21WakdCaWNkTjhITk1wcHg3T3REUm9FdmVhbGU4NDhlUG81N2YxcVR4c2FZcmtUOXBubW96K0N1cDR3VE9nXG41bEV1ZzlaMDA3NUVjWmp4cXNJL1EvRHZaWlVxQUxTeGM2NEx0TlcrTDFGWkhuV2dYNlc4d3hSSHNTam0rNTlTXG54L1dudzloakFnTUJBQUVDZ2dFQVJaeVlzS0Rld0pHZ1hKUjYrTmdFQk1JVjRhR1NMYmM0b1M2eHE5THd0bXZTXG5PU2hlY2NPZlVSRmtKcEI5QWkwOW5BaGdjdjdPVFlxSFJZazZYSWhKQmhZT0NnSUIrV1ZsenF0QVNqbmNGSzVHXG5BYWFlaHZEZHVGeExNaWNmN0V3bW16UzBCVnZWRm9rYU1obUV6RkF0R1FoemNNRUZ1bzF0a3lPN2MxK0FmaUJpXG5qY1dkbzJEVFhTSEhsTXNHYlIyYjFMWmpnQ3g5NmxCWXh5VUVjZmUrQk5mWTVhdG5sYkhMTXhOOVZiV3N4YjhvXG4xZERKb1NhNVQwcjRQMkJWbjV4TmxZS25meUVmOUkzTWxWTkhhUmc3WVdRRG50MFE1VWxBeG9zTExhYjB1UE1CXG5aRVZKNjB2VEYzcnBkSVJXOE9NcnBkalFjNjNkSjcxWlUxSWU2QTFCaVFLQmdRRDVsWlFNK3p2M01SYXlTYWhiXG5aV2MrTzk4VHFtSmpzZnB4WU50bVFBZ1M1T3Mzc0lNbVk5c2lJdUxCZEFNdHZETVVTM0pYUDNicnV3TlNDTGhZXG4wNDloZ0NXR0NqY001c0JSOTM0QmR0Z09YK1RtdldUaE9GS01IOXk2ZEMwYXYyaHkzQ0lXdUZaZU1XUG1pdWFWXG5xV0s2QktLMU5JcWwzZmYvU21UZHpla0xyd0tCZ1FESGhlaXFSOTByR0czM3Q3M1pkOUZWcEJZYjUxMDRqMmplXG5tMWU4Zm92Q0VtUmtPQmkzamxlYmpzN3NUeVBiVnZoSUJGa3dEazV4RzFRaGt2dUNDRmtHUXQ4VTRnZFV0MGhKXG44bEw4U1YvVG9tb3FIWHFZWHZsVmEyTTRocDFveEdOaEJ0QVdrbEk1L3BQQ2ttejVPSDJJR3N3TDJaeVdDRXlWXG5VVUQxUk50bmpRS0JnUURJMjIzSWZLK25vYVBJVzZyWDB1V2htZ0ZQREVJZVJXOXRxeXNtUU1XK251Z0ZhMUpBXG5wUUFIbXRldUpEVWlxMkRZSmxlZ2kzeWkvV0FRdHQvVTdIMXBVLzNldjMzS0xqSDhSUmJ0Q3IyWjQrYU5JMEo2XG5WaDlva1lQTHNnOVNoVlFEaTlFTFE5S04vMldNZGFCWU5YYzBpT0tBdmdZT3NuSVF5OGdkRU1kS0ZRS0JnRnZlXG5iS0w3TS9zRDVKNkxHLzltREIxQzBHdEl2TU91UkxzN0M4cmUrYnNDZlBjb1hUa25jVzlPOGpnY3VJWG1KYXdEXG5WSTJzQ0xKTHd4RXlmRndETy9xR0QvR3RvWEtBY2VpYWkxdGU3YUNreC8xY1ZYYVRSSHJ3VjE5UG5Hc0JBa0ZLXG53Y1dpMmZtYUhxOFlmTlRFRGdqOVRiYW5IRko0djhxQS8wZnZ6SmFCQW9HQkFPV2FCWnl5alJRMlZqWllHQm42XG5sbEk4NlloVllvWEtuOC9CREZ0K0FxZzhwRHh0QVZPdExEZ2ROQjhuVGM5NTBVV0ZhbnRRcHF0c2hnN1JodnhlXG5RRFloRERnclVJazg1QUpKVFhTYWkxUThKT3dUTnNiZm15Z09OUEVPTDJCcVI4cjZubUFGV0RGZldONW5OdWYwXG4vcFNmRURVKzkrcTY2eWdrckVpZjhNMkRcbi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS1cbg=="),
    "client_email": "firebase-adminsdk-fbsvc@goo-now-1ce44.iam.gserviceaccount.com",
    "client_id": "101892209905039594886",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40goo-now-1ce44.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
};

// Helper: Convert string to base64 url safe
function base64Url(str: string) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Helper: Convert array buffer to base64 url safe
function arrayBufferToBase64Url(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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
    // Return cached if valid (with 5 min buffer)
    if (cachedAccessToken && Date.now() < (tokenExpiry - 300000)) {
        return cachedAccessToken;
    }

    try {
        const now = Math.floor(Date.now() / 1000);

        // 1. JWT Components (Strictly compact JSON)
        const header = '{"alg":"RS256","typ":"JWT"}';
        const claimSet = JSON.stringify({
            iss: SERVICE_ACCOUNT.client_email,
            scope: "https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/cloud-platform",
            aud: SERVICE_ACCOUNT.token_uri,
            exp: now + 3600,
            iat: now
        });

        const encodedHeader = base64Url(header);
        const encodedClaimSet = base64Url(claimSet);
        const data = `${encodedHeader}.${encodedClaimSet}`;

        // 2. Prepare & Import Key
        const pemContents = SERVICE_ACCOUNT.private_key
            .replace(/\\n/g, '')
            .replace(/-----BEGIN PRIVATE KEY-----/, '')
            .replace(/-----END PRIVATE KEY-----/, '')
            .replace(/\s/g, '');

        const binaryKey = str2ab(pemContents);
        const key = await window.crypto.subtle.importKey(
            "pkcs8",
            binaryKey,
            { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
            false,
            ["sign"]
        );

        // 3. Sign
        const encoder = new TextEncoder();
        const signature = await window.crypto.subtle.sign(
            "RSASSA-PKCS1-v1_5",
            key,
            encoder.encode(data)
        );

        // DEBUG: Check key import success
        // console.log("[FCM] Key imported:", key.algorithm);


        const signedJwt = `${data}.${arrayBufferToBase64Url(signature)}`;

        // 4. Token Exchange
        const response = await fetch(SERVICE_ACCOUNT.token_uri, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: signedJwt
            }).toString()
        });

        const json = await response.json();

        if (json.access_token) {
            cachedAccessToken = json.access_token;
            tokenExpiry = Date.now() + (json.expires_in * 1000);
            console.log("[FCM] Generated Access Token Successfully");
            return cachedAccessToken;
        } else {
            console.error("[FCM] Token Generation Error:", json);
            return null;
        }

    } catch (e) {
        console.error("[FCM] JWT Cryptography Error:", e);
        return null;
    }
};
