'use client';

export default function validatePhone(phone, country) {
    if (!phone) {
        return 'Phone number is required';
    }

    // Remove any non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Country-specific validation
    switch (country) {
        case 'IN': // India
            const indianNumber = digitsOnly.replace(/^91/, '');
            if (indianNumber.length !== 10) {
                return 'Indian phone numbers must be 10 digits';
            }
            if (!/^[6-9]\d{9}$/.test(indianNumber)) {
                return 'Please enter a valid Indian mobile number';
            }
            break;
            
        case 'US': // United States
        case 'CA': // Canada (same format as US)
            if (digitsOnly.length !== 10) {
                return 'US/Canada phone numbers must be 10 digits';
            }
            if (!/^[2-9]\d{9}$/.test(digitsOnly)) {
                return 'Please enter a valid US/Canada phone number';
            }
            break;
            
        case 'GB': // United Kingdom
            if (!/^(\+44|0)7\d{9}$/.test(phone)) {
                return 'Please enter a valid UK mobile number';
            }
            break;
            
        case 'AU': // Australia
            if (!/^(\+61|0)4\d{8}$/.test(phone)) {
                return 'Please enter a valid Australian mobile number';
            }
            break;
            
        case 'DE': // Germany
            if (!/^(\+49|0)[1-9]\d{4,14}$/.test(phone)) {
                return 'Please enter a valid German phone number';
            }
            break;
            
        case 'FR': // France
            if (!/^(\+33|0)[67]\d{8}$/.test(phone)) {
                return 'Please enter a valid French mobile number';
            }
            break;
            
        case 'BR': // Brazil
            if (!/^(\+55|0)[1-9]{2}9?\d{8}$/.test(phone)) {
                return 'Please enter a valid Brazilian phone number';
            }
            break;
            
        case 'CN': // China
            if (!/^(\+86|0)1[3-9]\d{9}$/.test(phone)) {
                return 'Please enter a valid Chinese mobile number';
            }
            break;
            
        case 'JP': // Japan
            if (!/^(\+81|0)[789]0\d{8}$/.test(phone)) {
                return 'Please enter a valid Japanese mobile number';
            }
            break;
            
        case 'KR': // South Korea
            if (!/^(\+82|0)1[0-9]\d{7,8}$/.test(phone)) {
                return 'Please enter a valid South Korean phone number';
            }
            break;
            
        case 'MX': // Mexico
            if (!/^(\+52|0|01)?[1-9]\d{9,10}$/.test(phone)) {
                return 'Please enter a valid Mexican phone number';
            }
            break;
            
        case 'RU': // Russia
            case 'KZ': // Kazakhstan (similar format)
            case 'UZ': // Uzbekistan (similar format)
            case 'BY': // Belarus (similar format)
            case 'UA': // Ukraine (similar format)
            case 'AM': // Armenia (similar format)
            case 'AZ': // Azerbaijan (similar format)
            case 'GE': // Georgia (similar format)
            case 'KG': // Kyrgyzstan (similar format)
            case 'MD': // Moldova (similar format)
            case 'TJ': // Tajikistan (similar format)
            case 'TM': // Turkmenistan (similar format)
                if (!/^(\+7|8)[0-9]{10}$/.test(phone)) {
                    return 'Please enter a valid phone number for this region';
                }
                break;
            
        case 'SG': // Singapore
            if (!/^(\+65|0)[689]\d{7}$/.test(phone)) {
                return 'Please enter a valid Singaporean mobile number';
            }
            break;
            
        case 'ZA': // South Africa
            if (!/^(\+27|0)[6-8]\d{8}$/.test(phone)) {
                return 'Please enter a valid South African mobile number';
            }
            break;
            
        case 'NG': // Nigeria
            if (!/^(\+234|0)[7-9][01]\d{8}$/.test(phone)) {
                return 'Please enter a valid Nigerian mobile number';
            }
            break;
            
        case 'EG': // Egypt
            if (!/^(\+20|0)1[0125]\d{8}$/.test(phone)) {
                return 'Please enter a valid Egyptian mobile number';
            }
            break;
            
        case 'SA': // Saudi Arabia
            if (!/^(\+966|0)5\d{8}$/.test(phone)) {
                return 'Please enter a valid Saudi mobile number';
            }
            break;
            
        case 'AE': // UAE
            if (!/^(\+971|0)5[024568]\d{7}$/.test(phone)) {
                return 'Please enter a valid UAE mobile number';
            }
            break;
            
        case 'IL': // Israel
            if (!/^(\+972|0)5[0-9]\d{7}$/.test(phone)) {
                return 'Please enter a valid Israeli mobile number';
            }
            break;
            
        case 'TR': // Turkey
            if (!/^(\+90|0)5\d{9}$/.test(phone)) {
                return 'Please enter a valid Turkish mobile number';
            }
            break;
            
        case 'ID': // Indonesia
            if (!/^(\+62|0)8[1-9]\d{7,10}$/.test(phone)) {
                return 'Please enter a valid Indonesian mobile number';
            }
            break;
            
        case 'TH': // Thailand
            if (!/^(\+66|0)[689]\d{8}$/.test(phone)) {
                return 'Please enter a valid Thai mobile number';
            }
            break;
            
        case 'VN': // Vietnam
            if (!/^(\+84|0)(3|5|7|8|9)\d{8}$/.test(phone)) {
                return 'Please enter a valid Vietnamese mobile number';
            }
            break;
            
        case 'PH': // Philippines
            if (!/^(\+63|0)9\d{9}$/.test(phone)) {
                return 'Please enter a valid Philippine mobile number';
            }
            break;
            
        case 'MY': // Malaysia
            if (!/^(\+60|0)1[0-9]\d{7,8}$/.test(phone)) {
                return 'Please enter a valid Malaysian mobile number';
            }
            break;
            
        case 'IT': // Italy
            if (!/^(\+39|0)3\d{8,9}$/.test(phone)) {
                return 'Please enter a valid Italian mobile number';
            }
            break;
            
        case 'ES': // Spain
            if (!/^(\+34|0)[67]\d{8}$/.test(phone)) {
                return 'Please enter a valid Spanish mobile number';
            }
            break;
            
        case 'NL': // Netherlands
            if (!/^(\+31|0)6\d{8}$/.test(phone)) {
                return 'Please enter a valid Dutch mobile number';
            }
            break;
            
        case 'SE': // Sweden
            if (!/^(\+46|0)7[02369]\d{7}$/.test(phone)) {
                return 'Please enter a valid Swedish mobile number';
            }
            break;
            
        case 'NO': // Norway
            if (!/^(\+47|0)[49]\d{7}$/.test(phone)) {
                return 'Please enter a valid Norwegian mobile number';
            }
            break;
            
        case 'DK': // Denmark
            if (!/^(\+45|0)[2-9]\d{7}$/.test(phone)) {
                return 'Please enter a valid Danish phone number';
            }
            break;
            
        case 'FI': // Finland
            if (!/^(\+358|0)\d{1,3}\d{4,10}$/.test(phone)) {
                return 'Please enter a valid Finnish phone number';
            }
            break;
            
        case 'PL': // Poland
            if (!/^(\+48|0)[5-8]\d{8}$/.test(phone)) {
                return 'Please enter a valid Polish mobile number';
            }
            break;
            
        case 'PT': // Portugal
            if (!/^(\+351|0)9[1236]\d{7}$/.test(phone)) {
                return 'Please enter a valid Portuguese mobile number';
            }
            break;
            
        case 'AR': // Argentina
            if (!/^(\+54|0)9\d{10}$/.test(phone)) {
                return 'Please enter a valid Argentine mobile number';
            }
            break;
            
        case 'CL': // Chile
            if (!/^(\+56|0)9\d{8}$/.test(phone)) {
                return 'Please enter a valid Chilean mobile number';
            }
            break;
            
        case 'CO': // Colombia
            if (!/^(\+57|0)3\d{9}$/.test(phone)) {
                return 'Please enter a valid Colombian mobile number';
            }
            break;
            
        case 'PE': // Peru
            if (!/^(\+51|0)9\d{8}$/.test(phone)) {
                return 'Please enter a valid Peruvian mobile number';
            }
            break;
            
        default:
            // Generic validation for other countries
            if (digitsOnly.length < 5 || digitsOnly.length > 15) {
                return 'Please enter a valid phone number';
            }
            if (!/^[1-9]\d{4,14}$/.test(digitsOnly)) {
                return 'Please enter a valid phone number';
            }
    }
    return '';
};