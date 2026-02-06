// PromptPay QR Code Generator
// Reference: https://www.bot.or.th/Thai/PaymentSystems/PromptPay/Documents/PromptPay_QRcode.pdf

// CRC16-CCITT calculation
const crc16 = (str) => {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
};

// Format TLV (Tag-Length-Value)
const formatTLV = (tag, value) => {
    const length = value.length.toString().padStart(2, '0');
    return `${tag}${length}${value}`;
};

// Generate PromptPay QR Code payload
export const generatePromptPayPayload = (promptPayId, amount = null) => {
    // Remove dashes and format phone number
    let formattedId = promptPayId.replace(/[-\s]/g, '');

    // If it's a phone number (10 digits), add country code
    if (formattedId.length === 10 && formattedId.startsWith('0')) {
        formattedId = '0066' + formattedId.substring(1); // Thai country code
    } else if (formattedId.length === 13) {
        // National ID - keep as is
        formattedId = formattedId;
    }

    // Build payload parts
    let payload = '';

    // Payload Format Indicator (ID: 00)
    payload += formatTLV('00', '01');

    // Point of Initiation Method (ID: 01)
    // 11 = Static, 12 = Dynamic
    payload += formatTLV('01', amount ? '12' : '11');

    // Merchant Account Information - PromptPay (ID: 29)
    let merchantInfo = '';
    merchantInfo += formatTLV('00', 'A000000677010111'); // AID for PromptPay
    merchantInfo += formatTLV('01', formattedId);       // PromptPay ID
    payload += formatTLV('29', merchantInfo);

    // Transaction Currency (ID: 53) - THB = 764
    payload += formatTLV('53', '764');

    // Transaction Amount (ID: 54) - if specified
    if (amount && amount > 0) {
        const amountNum = parseFloat(amount);
        payload += formatTLV('54', amountNum.toFixed(2));
    }

    // Country Code (ID: 58)
    payload += formatTLV('58', 'TH');

    // CRC (ID: 63) - placeholder for now
    payload += '6304';

    // Calculate and append CRC
    const crcValue = crc16(payload);
    payload = payload.slice(0, -4) + crcValue;

    return payload;
};

// Demo PromptPay number for testing
export const DEMO_PROMPTPAY_ID = '0812345678';

export default generatePromptPayPayload;
