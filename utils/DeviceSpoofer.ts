
import { SafeLocalStorage } from './storage';

export interface SpoofedDevice {
    imei: string;
    androidId: string;
    manufacturer: string;
    model: string;
    brand: string;
    device: string;
    network: {
        ssid: string;
        bssid: string;
        operator: string;
    };
}

const DEVICE_MODELS = [
    { brand: 'Samsung', manufacturer: 'samsung', model: 'SM-G991B', device: 'p3s' }, // S21
    { brand: 'Samsung', manufacturer: 'samsung', model: 'SM-A528B', device: 'a52s' }, // A52s
    { brand: 'Xiaomi', manufacturer: 'Xiaomi', model: 'M2102J20SG', device: 'vayu' }, // Poco X3 Pro
    { brand: 'Oppo', manufacturer: 'OPPO', model: 'CPH2127', device: 'OPPO A53' },
    { brand: 'Vivo', manufacturer: 'vivo', model: 'V2027', device: 'V2027' },
    { brand: 'Huawei', manufacturer: 'HUAWEI', model: 'VOG-L29', device: 'HWVOG' }, // P30 Pro
    { brand: 'Realme', manufacturer: 'Realme', model: 'RMX3363', device: 'RMX3363' }, // GT Master
    { brand: 'Infinix', manufacturer: 'Infinix', model: 'X695', device: 'X695' } // Note 10 Pro
];

const NETWORKS = [
    { ssid: 'WE_4G_HOME', operator: 'WE' },
    { ssid: 'Vodafone_Home_5G', operator: 'Vodafone' },
    { ssid: 'Etisalat_Fiber', operator: 'Etisalat' },
    { ssid: 'Orange_DSL_Plus', operator: 'Orange' },
    { ssid: 'Home_WiFi_2.4G', operator: 'WE' },
    { ssid: 'TP-Link_Extender', operator: 'Vodafone' }
];

const generateRandomHex = (length: number) => {
    let result = '';
    const characters = '0123456789abcdef';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

const generateIMEI = () => {
    // Determine the first 14 digits (TAC + Serial)
    let imei = '35' + Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');

    // Calculate Luhn Check Digit
    let sum = 0;
    for (let i = 0; i < 14; i++) {
        let digit = parseInt(imei[i]);
        if (i % 2 !== 0) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return imei + checkDigit;
};

const generateRandomMac = () => {
    return 'XX:XX:XX:XX:XX:XX'.replace(/X/g, () => {
        return '0123456789ABCDEF'.charAt(Math.floor(Math.random() * 16));
    });
};

export const DeviceSpoofer = {
    getDeviceInfo: (): SpoofedDevice => {
        // Try to load existing spoofed profile
        const existing = SafeLocalStorage.get('spoofed_device_info', null);
        if (existing) {
            return existing;
        }

        // Generate NEW Profile
        const randomModel = DEVICE_MODELS[Math.floor(Math.random() * DEVICE_MODELS.length)];
        const randomNetwork = NETWORKS[Math.floor(Math.random() * NETWORKS.length)];

        const newProfile: SpoofedDevice = {
            imei: generateIMEI(),
            androidId: generateRandomHex(16),
            brand: randomModel.brand,
            manufacturer: randomModel.manufacturer,
            model: randomModel.model,
            device: randomModel.device,
            network: {
                ssid: randomNetwork.ssid,
                operator: randomNetwork.operator,
                bssid: generateRandomMac()
            }
        };

        // Persist it
        SafeLocalStorage.set('spoofed_device_info', newProfile);
        console.log('[DeviceSpoofer] Generated New Identity:', newProfile.model, newProfile.imei);

        return newProfile;
    }
};
