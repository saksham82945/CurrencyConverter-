export interface WorldCurrency {
  id: string;
  code: string;
  name: string;
  country: string;
  flag: string;
  symbol: string;
  ratePerUSD: number;
  decimals: number;
  popular?: boolean;
}

export const WORLD_CURRENCIES: WorldCurrency[] = [
  // Top Remittance & Corridors (Featured)
  { id: 'IN', code: 'INR', name: 'Indian Rupee', country: 'India', flag: '🇮🇳', symbol: '₹', ratePerUSD: 84.10, decimals: 2, popular: true },
  { id: 'PK', code: 'PKR', name: 'Pakistani Rupee', country: 'Pakistan', flag: '🇵🇰', symbol: '₨', ratePerUSD: 278.50, decimals: 2, popular: true },
  { id: 'EU', code: 'EUR', name: 'Euro', country: 'Eurozone', flag: '🇪🇺', symbol: '€', ratePerUSD: 0.92, decimals: 2, popular: true },
  { id: 'GB', code: 'GBP', name: 'British Pound', country: 'United Kingdom', flag: '🇬🇧', symbol: '£', ratePerUSD: 0.79, decimals: 2, popular: true },
  { id: 'AE', code: 'AED', name: 'UAE Dirham', country: 'United Arab Emirates', flag: '🇦🇪', symbol: 'AED ', ratePerUSD: 3.67, decimals: 2, popular: true },
  { id: 'CA', code: 'CAD', name: 'Canadian Dollar', country: 'Canada', flag: '🇨🇦', symbol: 'CA$', ratePerUSD: 1.38, decimals: 2, popular: true },
  { id: 'JP', code: 'JPY', name: 'Japanese Yen', country: 'Japan', flag: '🇯🇵', symbol: '¥', ratePerUSD: 152.40, decimals: 0, popular: true },
  { id: 'US', code: 'USD', name: 'US Dollar', country: 'United States', flag: '🇺🇸', symbol: '$', ratePerUSD: 1.00, decimals: 2, popular: true },
  { id: 'SA', code: 'SAR', name: 'Saudi Riyal', country: 'Saudi Arabia', flag: '🇸🇦', symbol: '﷼', ratePerUSD: 3.75, decimals: 2, popular: true },
  { id: 'AU', code: 'AUD', name: 'Australian Dollar', country: 'Australia', flag: '🇦🇺', symbol: 'A$', ratePerUSD: 1.52, decimals: 2, popular: true },
  { id: 'CN', code: 'CNY', name: 'Chinese Yuan', country: 'China', flag: '🇨🇳', symbol: '¥', ratePerUSD: 7.24, decimals: 2, popular: true },
  { id: 'SG', code: 'SGD', name: 'Singapore Dollar', country: 'Singapore', flag: '🇸🇬', symbol: 'S$', ratePerUSD: 1.32, decimals: 2, popular: true },
  { id: 'BD', code: 'BDT', name: 'Bangladeshi Taka', country: 'Bangladesh', flag: '🇧🇩', symbol: '৳', ratePerUSD: 119.80, decimals: 2, popular: true },
  { id: 'PH', code: 'PHP', name: 'Philippine Peso', country: 'Philippines', flag: '🇵🇭', symbol: '₱', ratePerUSD: 58.20, decimals: 2, popular: true },
  { id: 'QA', code: 'QAR', name: 'Qatari Riyal', country: 'Qatar', flag: '🇶🇦', symbol: '﷼', ratePerUSD: 3.64, decimals: 2, popular: true },
  { id: 'KW', code: 'KWD', name: 'Kuwaiti Dinar', country: 'Kuwait', flag: '🇰🇼', symbol: 'KD ', ratePerUSD: 0.307, decimals: 3, popular: true },
  { id: 'BH', code: 'BHD', name: 'Bahraini Dinar', country: 'Bahrain', flag: '🇧🇭', symbol: 'BD ', ratePerUSD: 0.376, decimals: 3, popular: true },
  { id: 'OM', code: 'OMR', name: 'Omani Rial', country: 'Oman', flag: '🇴🇲', symbol: 'OMR ', ratePerUSD: 0.385, decimals: 3, popular: true },
  { id: 'CH', code: 'CHF', name: 'Swiss Franc', country: 'Switzerland', flag: '🇨🇭', symbol: 'CHF ', ratePerUSD: 0.88, decimals: 2, popular: true },
  { id: 'MY', code: 'MYR', name: 'Malaysian Ringgit', country: 'Malaysia', flag: '🇲🇾', symbol: 'RM ', ratePerUSD: 4.42, decimals: 2, popular: true },
  { id: 'TH', code: 'THB', name: 'Thai Baht', country: 'Thailand', flag: '🇹🇭', symbol: '฿', ratePerUSD: 33.80, decimals: 2, popular: true },
  { id: 'ID', code: 'IDR', name: 'Indonesian Rupiah', country: 'Indonesia', flag: '🇮🇩', symbol: 'Rp ', ratePerUSD: 15600.0, decimals: 0, popular: true },
  { id: 'VN', code: 'VND', name: 'Vietnamese Dong', country: 'Vietnam', flag: '🇻🇳', symbol: '₫', ratePerUSD: 25300.0, decimals: 0, popular: true },
  { id: 'TR', code: 'TRY', name: 'Turkish Lira', country: 'Turkey', flag: '🇹🇷', symbol: '₺', ratePerUSD: 34.25, decimals: 2, popular: true },
  { id: 'BR', code: 'BRL', name: 'Brazilian Real', country: 'Brazil', flag: '🇧🇷', symbol: 'R$', ratePerUSD: 5.75, decimals: 2, popular: true },
  { id: 'MX', code: 'MXN', name: 'Mexican Peso', country: 'Mexico', flag: '🇲🇽', symbol: 'Mex$', ratePerUSD: 19.85, decimals: 2, popular: true },
  { id: 'ZA', code: 'ZAR', name: 'South African Rand', country: 'South Africa', flag: '🇿🇦', symbol: 'R ', ratePerUSD: 17.65, decimals: 2, popular: true },
  { id: 'EG', code: 'EGP', name: 'Egyptian Pound', country: 'Egypt', flag: '🇪🇬', symbol: 'E£', ratePerUSD: 48.60, decimals: 2, popular: true },
  { id: 'NG', code: 'NGN', name: 'Nigerian Naira', country: 'Nigeria', flag: '🇳🇬', symbol: '₦', ratePerUSD: 1650.0, decimals: 2, popular: true },
  { id: 'KE', code: 'KES', name: 'Kenyan Shilling', country: 'Kenya', flag: '🇰🇪', symbol: 'KSh ', ratePerUSD: 129.50, decimals: 2, popular: true },
  { id: 'LK', code: 'LKR', name: 'Sri Lankan Rupee', country: 'Sri Lanka', flag: '🇱🇰', symbol: 'Rs ', ratePerUSD: 293.50, decimals: 2, popular: true },
  { id: 'NP', code: 'NPR', name: 'Nepalese Rupee', country: 'Nepal', flag: '🇳🇵', symbol: 'Rs ', ratePerUSD: 134.50, decimals: 2, popular: true },

  // Asia & Pacific
  { id: 'HK', code: 'HKD', name: 'Hong Kong Dollar', country: 'Hong Kong', flag: '🇭🇰', symbol: 'HK$', ratePerUSD: 7.78, decimals: 2 },
  { id: 'KR', code: 'KRW', name: 'South Korean Won', country: 'South Korea', flag: '🇰🇷', symbol: '₩', ratePerUSD: 1380.0, decimals: 0 },
  { id: 'NZ', code: 'NZD', name: 'New Zealand Dollar', country: 'New Zealand', flag: '🇳🇿', symbol: 'NZ$', ratePerUSD: 1.66, decimals: 2 },
  { id: 'TW', code: 'TWD', name: 'New Taiwan Dollar', country: 'Taiwan', flag: '🇹🇼', symbol: 'NT$', ratePerUSD: 32.10, decimals: 2 },
  { id: 'AF', code: 'AFN', name: 'Afghan Afghani', country: 'Afghanistan', flag: '🇦🇫', symbol: '؋', ratePerUSD: 67.50, decimals: 2 },
  { id: 'BT', code: 'BTN', name: 'Bhutanese Ngultrum', country: 'Bhutan', flag: '🇧🇹', symbol: 'Nu ', ratePerUSD: 84.10, decimals: 2 },
  { id: 'MV', code: 'MVR', name: 'Maldivian Rufiyaa', country: 'Maldives', flag: '🇲🇻', symbol: 'Rf ', ratePerUSD: 15.45, decimals: 2 },
  { id: 'KH', code: 'KHR', name: 'Cambodian Riel', country: 'Cambodia', flag: '🇰🇭', symbol: '៛', ratePerUSD: 4050.0, decimals: 2 },
  { id: 'LA', code: 'LAK', name: 'Lao Kip', country: 'Laos', flag: '🇱🇦', symbol: '₭', ratePerUSD: 21900.0, decimals: 0 },
  { id: 'MM', code: 'MMK', name: 'Myanmar Kyat', country: 'Myanmar', flag: '🇲🇲', symbol: 'K ', ratePerUSD: 2100.0, decimals: 2 },
  { id: 'BN', code: 'BND', name: 'Brunei Dollar', country: 'Brunei', flag: '🇧🇳', symbol: 'B$', ratePerUSD: 1.32, decimals: 2 },
  { id: 'MN', code: 'MNT', name: 'Mongolian Tugrik', country: 'Mongolia', flag: '🇲🇳', symbol: '₮', ratePerUSD: 3410.0, decimals: 2 },
  { id: 'KZ', code: 'KZT', name: 'Kazakhstani Tenge', country: 'Kazakhstan', flag: '🇰🇿', symbol: '₸', ratePerUSD: 488.0, decimals: 2 },
  { id: 'UZ', code: 'UZS', name: 'Uzbekistani Som', country: 'Uzbekistan', flag: '🇺🇿', symbol: 'so\'m', ratePerUSD: 12800.0, decimals: 0 },
  { id: 'KG', code: 'KGS', name: 'Kyrgyzstani Som', country: 'Kyrgyzstan', flag: '🇰🇬', symbol: 'сом', ratePerUSD: 86.00, decimals: 2 },
  { id: 'TJ', code: 'TJS', name: 'Tajikistani Somoni', country: 'Tajikistan', flag: '🇹🇯', symbol: 'ЅМ', ratePerUSD: 10.65, decimals: 2 },
  { id: 'TM', code: 'TMT', name: 'Turkmenistani Manat', country: 'Turkmenistan', flag: '🇹🇲', symbol: 'T', ratePerUSD: 3.50, decimals: 2 },
  { id: 'FJ', code: 'FJD', name: 'Fijian Dollar', country: 'Fiji', flag: '🇫🇯', symbol: 'FJ$', ratePerUSD: 2.26, decimals: 2 },
  { id: 'PG', code: 'PGK', name: 'Papua New Guinean Kina', country: 'Papua New Guinea', flag: '🇵🇬', symbol: 'K ', ratePerUSD: 3.96, decimals: 2 },
  { id: 'WS', code: 'WST', name: 'Samoan Tala', country: 'Samoa', flag: '🇼🇸', symbol: 'WS$', ratePerUSD: 2.76, decimals: 2 },
  { id: 'VU', code: 'VUV', name: 'Vanuatu Vatu', country: 'Vanuatu', flag: '🇻🇺', symbol: 'VT', ratePerUSD: 120.0, decimals: 0 },
  { id: 'SB', code: 'SBD', name: 'Solomon Islands Dollar', country: 'Solomon Islands', flag: '🇸🇧', symbol: 'SI$', ratePerUSD: 8.45, decimals: 2 },
  { id: 'TO', code: 'TOP', name: 'Tongan Paʻanga', country: 'Tonga', flag: '🇹🇴', symbol: 'T$', ratePerUSD: 2.37, decimals: 2 },
  { id: 'MO', code: 'MOP', name: 'Macanese Pataca', country: 'Macau', flag: '🇲🇴', symbol: 'MOP$', ratePerUSD: 8.02, decimals: 2 },
  { id: 'TL', code: 'USD_TL', name: 'US Dollar', country: 'Timor-Leste', flag: '🇹🇱', symbol: '$', ratePerUSD: 1.00, decimals: 2 },
  { id: 'KI', code: 'AUD_KI', name: 'Australian Dollar', country: 'Kiribati', flag: '🇰🇮', symbol: 'A$', ratePerUSD: 1.52, decimals: 2 },
  { id: 'TV', code: 'AUD_TV', name: 'Australian Dollar', country: 'Tuvalu', flag: '🇹🇻', symbol: 'A$', ratePerUSD: 1.52, decimals: 2 },
  { id: 'NR', code: 'AUD_NR', name: 'Australian Dollar', country: 'Nauru', flag: '🇳🇷', symbol: 'A$', ratePerUSD: 1.52, decimals: 2 },
  { id: 'PW', code: 'USD_PW', name: 'US Dollar', country: 'Palau', flag: '🇵🇼', symbol: '$', ratePerUSD: 1.00, decimals: 2 },
  { id: 'MH', code: 'USD_MH', name: 'US Dollar', country: 'Marshall Islands', flag: '🇲🇭', symbol: '$', ratePerUSD: 1.00, decimals: 2 },
  { id: 'FM', code: 'USD_FM', name: 'US Dollar', country: 'Micronesia', flag: '🇫🇲', symbol: '$', ratePerUSD: 1.00, decimals: 2 },

  // Middle East
  { id: 'JO', code: 'JOD', name: 'Jordanian Dinar', country: 'Jordan', flag: '🇯🇴', symbol: 'JD ', ratePerUSD: 0.709, decimals: 3 },
  { id: 'IL', code: 'ILS', name: 'Israeli New Shekel', country: 'Israel', flag: '🇮🇱', symbol: '₪', ratePerUSD: 3.72, decimals: 2 },
  { id: 'IQ', code: 'IQD', name: 'Iraqi Dinar', country: 'Iraq', flag: '🇮🇶', symbol: 'ID ', ratePerUSD: 1310.0, decimals: 0 },
  { id: 'LB', code: 'LBP', name: 'Lebanese Pound', country: 'Lebanon', flag: '🇱🇧', symbol: 'L£', ratePerUSD: 89500.0, decimals: 0 },
  { id: 'YE', code: 'YER', name: 'Yemeni Rial', country: 'Yemen', flag: '🇾🇪', symbol: '﷼', ratePerUSD: 250.0, decimals: 2 },
  { id: 'SY', code: 'SYP', name: 'Syrian Pound', country: 'Syria', flag: '🇸🇾', symbol: 'S£', ratePerUSD: 13000.0, decimals: 0 },

  // Europe (Eurozone Nations with National Flags)
  { id: 'DE', code: 'EUR', name: 'Euro', country: 'Germany', flag: '🇩🇪', symbol: '€', ratePerUSD: 0.92, decimals: 2, popular: true },
  { id: 'FR', code: 'EUR', name: 'Euro', country: 'France', flag: '🇫🇷', symbol: '€', ratePerUSD: 0.92, decimals: 2, popular: true },
  { id: 'IT', code: 'EUR', name: 'Euro', country: 'Italy', flag: '🇮🇹', symbol: '€', ratePerUSD: 0.92, decimals: 2 },
  { id: 'ES', code: 'EUR', name: 'Euro', country: 'Spain', flag: '🇪🇸', symbol: '€', ratePerUSD: 0.92, decimals: 2 },
  { id: 'NL', code: 'EUR', name: 'Euro', country: 'Netherlands', flag: '🇳🇱', symbol: '€', ratePerUSD: 0.92, decimals: 2 },
  { id: 'BE', code: 'EUR', name: 'Euro', country: 'Belgium', flag: '🇧🇪', symbol: '€', ratePerUSD: 0.92, decimals: 2 },
  { id: 'IE', code: 'EUR', name: 'Euro', country: 'Ireland', flag: '🇮🇪', symbol: '€', ratePerUSD: 0.92, decimals: 2 },
  { id: 'AT', code: 'EUR', name: 'Euro', country: 'Austria', flag: '🇦🇹', symbol: '€', ratePerUSD: 0.92, decimals: 2 },
  { id: 'PT', code: 'EUR', name: 'Euro', country: 'Portugal', flag: '🇵🇹', symbol: '€', ratePerUSD: 0.92, decimals: 2 },
  { id: 'GR', code: 'EUR', name: 'Euro', country: 'Greece', flag: '🇬🇷', symbol: '€', ratePerUSD: 0.92, decimals: 2 },
  { id: 'FI', code: 'EUR', name: 'Euro', country: 'Finland', flag: '🇫🇮', symbol: '€', ratePerUSD: 0.92, decimals: 2 },
  { id: 'LU', code: 'EUR', name: 'Euro', country: 'Luxembourg', flag: '🇱🇺', symbol: '€', ratePerUSD: 0.92, decimals: 2 },
  { id: 'SK', code: 'EUR', name: 'Euro', country: 'Slovakia', flag: '🇸🇰', symbol: '€', ratePerUSD: 0.92, decimals: 2 },
  { id: 'SI', code: 'EUR', name: 'Euro', country: 'Slovenia', flag: '🇸🇮', symbol: '€', ratePerUSD: 0.92, decimals: 2 },
  { id: 'EE', code: 'EUR', name: 'Euro', country: 'Estonia', flag: '🇪🇪', symbol: '€', ratePerUSD: 0.92, decimals: 2 },
  { id: 'LV', code: 'EUR', name: 'Euro', country: 'Latvia', flag: '🇱🇻', symbol: '€', ratePerUSD: 0.92, decimals: 2 },
  { id: 'LT', code: 'EUR', name: 'Euro', country: 'Lithuania', flag: '🇱🇹', symbol: '€', ratePerUSD: 0.92, decimals: 2 },
  { id: 'CY', code: 'EUR', name: 'Euro', country: 'Cyprus', flag: '🇨🇾', symbol: '€', ratePerUSD: 0.92, decimals: 2 },
  { id: 'MT', code: 'EUR', name: 'Euro', country: 'Malta', flag: '🇲🇹', symbol: '€', ratePerUSD: 0.92, decimals: 2 },
  { id: 'HR', code: 'EUR', name: 'Euro', country: 'Croatia', flag: '🇭🇷', symbol: '€', ratePerUSD: 0.92, decimals: 2 },
  { id: 'MC', code: 'EUR', name: 'Euro', country: 'Monaco', flag: '🇲🇨', symbol: '€', ratePerUSD: 0.92, decimals: 2 },
  { id: 'AD', code: 'EUR', name: 'Euro', country: 'Andorra', flag: '🇦🇩', symbol: '€', ratePerUSD: 0.92, decimals: 2 },
  { id: 'SM', code: 'EUR', name: 'Euro', country: 'San Marino', flag: '🇸🇲', symbol: '€', ratePerUSD: 0.92, decimals: 2 },
  { id: 'VA', code: 'EUR', name: 'Euro', country: 'Vatican City', flag: '🇻🇦', symbol: '€', ratePerUSD: 0.92, decimals: 2 },
  { id: 'ME', code: 'EUR', name: 'Euro', country: 'Montenegro', flag: '🇲🇪', symbol: '€', ratePerUSD: 0.92, decimals: 2 },
  { id: 'XK', code: 'EUR', name: 'Euro', country: 'Kosovo', flag: '🇽🇰', symbol: '€', ratePerUSD: 0.92, decimals: 2 },

  // Non-Eurozone Europe
  { id: 'NO', code: 'NOK', name: 'Norwegian Krone', country: 'Norway', flag: '🇳🇴', symbol: 'kr', ratePerUSD: 10.95, decimals: 2 },
  { id: 'SE', code: 'SEK', name: 'Swedish Krona', country: 'Sweden', flag: '🇸🇪', symbol: 'kr', ratePerUSD: 10.65, decimals: 2 },
  { id: 'DK', code: 'DKK', name: 'Danish Krone', country: 'Denmark', flag: '🇩🇰', symbol: 'kr', ratePerUSD: 6.88, decimals: 2 },
  { id: 'IS', code: 'ISK', name: 'Icelandic Krona', country: 'Iceland', flag: '🇮🇸', symbol: 'kr', ratePerUSD: 137.50, decimals: 0 },
  { id: 'PL', code: 'PLN', name: 'Polish Zloty', country: 'Poland', flag: '🇵🇱', symbol: 'zł', ratePerUSD: 4.02, decimals: 2 },
  { id: 'CZ', code: 'CZK', name: 'Czech Koruna', country: 'Czech Republic', flag: '🇨🇿', symbol: 'Kč', ratePerUSD: 23.35, decimals: 2 },
  { id: 'HU', code: 'HUF', name: 'Hungarian Forint', country: 'Hungary', flag: '🇭🇺', symbol: 'Ft', ratePerUSD: 375.0, decimals: 0 },
  { id: 'RO', code: 'RON', name: 'Romanian Leu', country: 'Romania', flag: '🇷🇴', symbol: 'lei', ratePerUSD: 4.58, decimals: 2 },
  { id: 'BG', code: 'BGN', name: 'Bulgarian Lev', country: 'Bulgaria', flag: '🇧🇬', symbol: 'лв', ratePerUSD: 1.80, decimals: 2 },
  { id: 'RS', code: 'RSD', name: 'Serbian Dinar', country: 'Serbia', flag: '🇷🇸', symbol: 'дин', ratePerUSD: 108.0, decimals: 2 },
  { id: 'BA', code: 'BAM', name: 'Bosnia Convertible Mark', country: 'Bosnia & Herzegovina', flag: '🇧🇦', symbol: 'KM', ratePerUSD: 1.80, decimals: 2 },
  { id: 'AL', code: 'ALL', name: 'Albanian Lek', country: 'Albania', flag: '🇦🇱', symbol: 'L', ratePerUSD: 90.50, decimals: 2 },
  { id: 'MK', code: 'MKD', name: 'Macedonian Denar', country: 'North Macedonia', flag: '🇲🇰', symbol: 'ден', ratePerUSD: 56.60, decimals: 2 },
  { id: 'RU', code: 'RUB', name: 'Russian Ruble', country: 'Russia', flag: '🇷🇺', symbol: '₽', ratePerUSD: 96.50, decimals: 2 },
  { id: 'UA', code: 'UAH', name: 'Ukrainian Hryvnia', country: 'Ukraine', flag: '🇺🇦', symbol: '₴', ratePerUSD: 41.30, decimals: 2 },
  { id: 'BY', code: 'BYN', name: 'Belarusian Ruble', country: 'Belarus', flag: '🇧🇾', symbol: 'Br', ratePerUSD: 3.28, decimals: 2 },
  { id: 'MD', code: 'MDL', name: 'Moldovan Leu', country: 'Moldova', flag: '🇲🇩', symbol: 'L', ratePerUSD: 17.90, decimals: 2 },
  { id: 'GE', code: 'GEL', name: 'Georgian Lari', country: 'Georgia', flag: '🇬🇪', symbol: '₾', ratePerUSD: 2.74, decimals: 2 },
  { id: 'AM', code: 'AMD', name: 'Armenian Dram', country: 'Armenia', flag: '🇦🇲', symbol: '֏', ratePerUSD: 387.0, decimals: 2 },
  { id: 'AZ', code: 'AZN', name: 'Azerbaijani Manat', country: 'Azerbaijan', flag: '🇦🇿', symbol: '₼', ratePerUSD: 1.70, decimals: 2 },
  { id: 'LI', code: 'CHF_LI', name: 'Swiss Franc', country: 'Liechtenstein', flag: '🇱🇮', symbol: 'CHF ', ratePerUSD: 0.88, decimals: 2 },
  { id: 'GI', code: 'GIP', name: 'Gibraltar Pound', country: 'Gibraltar', flag: '🇬🇮', symbol: '£', ratePerUSD: 0.79, decimals: 2 },

  // Americas
  { id: 'AR', code: 'ARS', name: 'Argentine Peso', country: 'Argentina', flag: '🇦🇷', symbol: '$', ratePerUSD: 995.0, decimals: 2 },
  { id: 'CL', code: 'CLP', name: 'Chilean Peso', country: 'Chile', flag: '🇨🇱', symbol: '$', ratePerUSD: 955.0, decimals: 0 },
  { id: 'CO', code: 'COP', name: 'Colombian Peso', country: 'Colombia', flag: '🇨🇴', symbol: '$', ratePerUSD: 4320.0, decimals: 0 },
  { id: 'PE', code: 'PEN', name: 'Peruvian Sol', country: 'Peru', flag: '🇵🇪', symbol: 'S/.', ratePerUSD: 3.77, decimals: 2 },
  { id: 'UY', code: 'UYU', name: 'Uruguayan Peso', country: 'Uruguay', flag: '🇺🇾', symbol: '$U', ratePerUSD: 41.50, decimals: 2 },
  { id: 'PY', code: 'PYG', name: 'Paraguayan Guarani', country: 'Paraguay', flag: '🇵🇾', symbol: '₲', ratePerUSD: 7850.0, decimals: 0 },
  { id: 'BO', code: 'BOB', name: 'Bolivian Boliviano', country: 'Bolivia', flag: '🇧🇴', symbol: 'Bs', ratePerUSD: 6.96, decimals: 2 },
  { id: 'CR', code: 'CRC', name: 'Costa Rican Colon', country: 'Costa Rica', flag: '🇨🇷', symbol: '₡', ratePerUSD: 512.0, decimals: 2 },
  { id: 'DO', code: 'DOP', name: 'Dominican Peso', country: 'Dominican Republic', flag: '🇩🇴', symbol: 'RD$', ratePerUSD: 60.20, decimals: 2 },
  { id: 'GT', code: 'GTQ', name: 'Guatemalan Quetzal', country: 'Guatemala', flag: '🇬🇹', symbol: 'Q', ratePerUSD: 7.75, decimals: 2 },
  { id: 'HN', code: 'HNL', name: 'Honduran Lempira', country: 'Honduras', flag: '🇭🇳', symbol: 'L', ratePerUSD: 25.10, decimals: 2 },
  { id: 'NI', code: 'NIO', name: 'Nicaraguan Cordoba', country: 'Nicaragua', flag: '🇳🇮', symbol: 'C$', ratePerUSD: 36.80, decimals: 2 },
  { id: 'PA', code: 'PAB', name: 'Panamanian Balboa', country: 'Panama', flag: '🇵🇦', symbol: 'B/.', ratePerUSD: 1.00, decimals: 2 },
  { id: 'JM', code: 'JMD', name: 'Jamaican Dollar', country: 'Jamaica', flag: '🇯🇲', symbol: 'J$', ratePerUSD: 158.0, decimals: 2 },
  { id: 'TT', code: 'TTD', name: 'Trinidad and Tobago Dollar', country: 'Trinidad & Tobago', flag: '🇹🇹', symbol: 'TT$', ratePerUSD: 6.80, decimals: 2 },
  { id: 'BS', code: 'BSD', name: 'Bahamian Dollar', country: 'Bahamas', flag: '🇧🇸', symbol: 'B$', ratePerUSD: 1.00, decimals: 2 },
  { id: 'BB', code: 'BBD', name: 'Barbadian Dollar', country: 'Barbados', flag: '🇧🇧', symbol: 'Bds$', ratePerUSD: 2.00, decimals: 2 },
  { id: 'BZ', code: 'BZD', name: 'Belize Dollar', country: 'Belize', flag: '🇧🇿', symbol: 'BZ$', ratePerUSD: 2.00, decimals: 2 },
  { id: 'EC', code: 'USD_EC', name: 'US Dollar', country: 'Ecuador', flag: '🇪🇨', symbol: '$', ratePerUSD: 1.00, decimals: 2 },
  { id: 'SV', code: 'USD_SV', name: 'US Dollar', country: 'El Salvador', flag: '🇸🇻', symbol: '$', ratePerUSD: 1.00, decimals: 2 },
  { id: 'GY', code: 'GYD', name: 'Guyanese Dollar', country: 'Guyana', flag: '🇬🇾', symbol: 'G$', ratePerUSD: 209.0, decimals: 2 },
  { id: 'SR', code: 'SRD', name: 'Surinamese Dollar', country: 'Suriname', flag: '🇸🇷', symbol: 'Sr$', ratePerUSD: 35.20, decimals: 2 },
  { id: 'HT', code: 'HTG', name: 'Haitian Gourde', country: 'Haiti', flag: '🇭🇹', symbol: 'G', ratePerUSD: 131.50, decimals: 2 },
  { id: 'AW', code: 'AWG', name: 'Aruban Florin', country: 'Aruba', flag: '🇦🇼', symbol: 'Afl ', ratePerUSD: 1.80, decimals: 2 },
  { id: 'CW', code: 'ANG', name: 'Netherlands Antillean Guilder', country: 'Curaçao & Sint Maarten', flag: '🇨🇼', symbol: 'NAƒ', ratePerUSD: 1.79, decimals: 2 },
  { id: 'BM', code: 'BMD', name: 'Bermudian Dollar', country: 'Bermuda', flag: '🇧🇲', symbol: 'BD$', ratePerUSD: 1.00, decimals: 2 },
  { id: 'KY', code: 'KYD', name: 'Cayman Islands Dollar', country: 'Cayman Islands', flag: '🇰🇾', symbol: 'CI$', ratePerUSD: 0.83, decimals: 2 },
  { id: 'XC', code: 'XCD', name: 'East Caribbean Dollar', country: 'East Caribbean (Antigua, Dominica, St Lucia)', flag: '🇦🇮', symbol: 'EC$', ratePerUSD: 2.70, decimals: 2 },

  // Africa
  { id: 'GH', code: 'GHS', name: 'Ghanaian Cedi', country: 'Ghana', flag: '🇬🇭', symbol: 'GH₵', ratePerUSD: 15.80, decimals: 2 },
  { id: 'MA', code: 'MAD', name: 'Moroccan Dirham', country: 'Morocco', flag: '🇲🇦', symbol: 'MAD ', ratePerUSD: 9.85, decimals: 2 },
  { id: 'TN', code: 'TND', name: 'Tunisian Dinar', country: 'Tunisia', flag: '🇹🇳', symbol: 'DT', ratePerUSD: 3.08, decimals: 3 },
  { id: 'DZ', code: 'DZD', name: 'Algerian Dinar', country: 'Algeria', flag: '🇩🇿', symbol: 'DA', ratePerUSD: 133.50, decimals: 2 },
  { id: 'ET', code: 'ETB', name: 'Ethiopian Birr', country: 'Ethiopia', flag: '🇪🇹', symbol: 'Br', ratePerUSD: 122.0, decimals: 2 },
  { id: 'TZ', code: 'TZS', name: 'Tanzanian Shilling', country: 'Tanzania', flag: '🇹🇿', symbol: 'TSh', ratePerUSD: 2680.0, decimals: 2 },
  { id: 'UG', code: 'UGX', name: 'Ugandan Shilling', country: 'Uganda', flag: '🇺🇬', symbol: 'USh', ratePerUSD: 3670.0, decimals: 0 },
  { id: 'RW', code: 'RWF', name: 'Rwandan Franc', country: 'Rwanda', flag: '🇷🇼', symbol: 'FRw', ratePerUSD: 1365.0, decimals: 0 },
  { id: 'ZM', code: 'ZMW', name: 'Zambian Kwacha', country: 'Zambia', flag: '🇿🇲', symbol: 'ZK', ratePerUSD: 26.80, decimals: 2 },
  { id: 'BW', code: 'BWP', name: 'Botswana Pula', country: 'Botswana', flag: '🇧🇼', symbol: 'P', ratePerUSD: 13.50, decimals: 2 },
  { id: 'NA', code: 'NAD', name: 'Namibian Dollar', country: 'Namibia', flag: '🇳🇦', symbol: 'N$', ratePerUSD: 17.65, decimals: 2 },
  { id: 'MZ', code: 'MZN', name: 'Mozambican Metical', country: 'Mozambique', flag: '🇲🇿', symbol: 'MT', ratePerUSD: 63.90, decimals: 2 },
  { id: 'AO', code: 'AOA', name: 'Angolan Kwanza', country: 'Angola', flag: '🇦🇴', symbol: 'Kz', ratePerUSD: 935.0, decimals: 2 },
  { id: 'CD', code: 'CDF', name: 'Congolese Franc', country: 'DR Congo', flag: '🇨🇩', symbol: 'FC', ratePerUSD: 2850.0, decimals: 2 },
  { id: 'SN', code: 'XOF', name: 'West African CFA Franc', country: 'Senegal & West Africa', flag: '🇸🇳', symbol: 'CFA ', ratePerUSD: 603.50, decimals: 0 },
  { id: 'CI', code: 'XOF_CI', name: 'West African CFA Franc', country: 'Ivory Coast (Côte d\'Ivoire)', flag: '🇨🇮', symbol: 'CFA ', ratePerUSD: 603.50, decimals: 0 },
  { id: 'CM', code: 'XAF', name: 'Central African CFA Franc', country: 'Cameroon & Central Africa', flag: '🇨🇲', symbol: 'FCFA ', ratePerUSD: 603.50, decimals: 0 },
  { id: 'GA', code: 'XAF_GA', name: 'Central African CFA Franc', country: 'Gabon', flag: '🇬🇦', symbol: 'FCFA ', ratePerUSD: 603.50, decimals: 0 },
  { id: 'CG', code: 'XAF_CG', name: 'Central African CFA Franc', country: 'Republic of the Congo', flag: '🇨🇬', symbol: 'FCFA ', ratePerUSD: 603.50, decimals: 0 },
  { id: 'TD', code: 'XAF_TD', name: 'Central African CFA Franc', country: 'Chad', flag: '🇹🇩', symbol: 'FCFA ', ratePerUSD: 603.50, decimals: 0 },
  { id: 'BJ', code: 'XOF_BJ', name: 'West African CFA Franc', country: 'Benin', flag: '🇧🇯', symbol: 'CFA ', ratePerUSD: 603.50, decimals: 0 },
  { id: 'BF', code: 'XOF_BF', name: 'West African CFA Franc', country: 'Burkina Faso', flag: '🇧🇫', symbol: 'CFA ', ratePerUSD: 603.50, decimals: 0 },
  { id: 'ML', code: 'XOF_ML', name: 'West African CFA Franc', country: 'Mali', flag: '🇲🇱', symbol: 'CFA ', ratePerUSD: 603.50, decimals: 0 },
  { id: 'NE', code: 'XOF_NE', name: 'West African CFA Franc', country: 'Niger', flag: '🇳🇪', symbol: 'CFA ', ratePerUSD: 603.50, decimals: 0 },
  { id: 'TG', code: 'XOF_TG', name: 'West African CFA Franc', country: 'Togo', flag: '🇹🇬', symbol: 'CFA ', ratePerUSD: 603.50, decimals: 0 },
  { id: 'MU', code: 'MUR', name: 'Mauritian Rupee', country: 'Mauritius', flag: '🇲🇺', symbol: '₨', ratePerUSD: 46.20, decimals: 2 },
  { id: 'SC', code: 'SCR', name: 'Seychellois Rupee', country: 'Seychelles', flag: '🇸🇨', symbol: 'SR', ratePerUSD: 14.10, decimals: 2 },
  { id: 'MG', code: 'MGA', name: 'Malagasy Ariary', country: 'Madagascar', flag: '🇲🇬', symbol: 'Ar', ratePerUSD: 4650.0, decimals: 0 },
  { id: 'MW', code: 'MWK', name: 'Malawian Kwacha', country: 'Malawi', flag: '🇲🇼', symbol: 'MK', ratePerUSD: 1740.0, decimals: 2 },
  { id: 'SL', code: 'SLL', name: 'Sierra Leonean Leone', country: 'Sierra Leone', flag: '🇸🇱', symbol: 'Le', ratePerUSD: 22800.0, decimals: 2 },
  { id: 'LR', code: 'LRD', name: 'Liberian Dollar', country: 'Liberia', flag: '🇱🇷', symbol: 'L$', ratePerUSD: 198.0, decimals: 2 },
  { id: 'GM', code: 'GMD', name: 'Gambian Dalasi', country: 'Gambia', flag: '🇬🇲', symbol: 'D', ratePerUSD: 71.50, decimals: 2 },
  { id: 'GN', code: 'GNF', name: 'Guinean Franc', country: 'Guinea', flag: '🇬🇳', symbol: 'FG', ratePerUSD: 8650.0, decimals: 0 },
  { id: 'CV', code: 'CVE', name: 'Cape Verdean Escudo', country: 'Cape Verde', flag: '🇨🇻', symbol: 'Esc', ratePerUSD: 101.50, decimals: 2 },
  { id: 'DJ', code: 'DJF', name: 'Djiboutian Franc', country: 'Djibouti', flag: '🇩🇯', symbol: 'Fdj', ratePerUSD: 178.0, decimals: 0 },
  { id: 'SO', code: 'SOS', name: 'Somali Shilling', country: 'Somalia', flag: '🇸🇴', symbol: 'Sh', ratePerUSD: 571.0, decimals: 2 },
  { id: 'ER', code: 'ERN', name: 'Eritrean Nakfa', country: 'Eritrea', flag: '🇪🇷', symbol: 'Nfk', ratePerUSD: 15.00, decimals: 2 },
  { id: 'LY', code: 'LYD', name: 'Libyan Dinar', country: 'Libya', flag: '🇱🇾', symbol: 'LD', ratePerUSD: 4.82, decimals: 3 },
  { id: 'MR', code: 'MRU', name: 'Mauritanian Ouguiya', country: 'Mauritania', flag: '🇲🇷', symbol: 'UM', ratePerUSD: 39.80, decimals: 2 },
  { id: 'SZ', code: 'SZL', name: 'Swazi Lilangeni', country: 'Eswatini', flag: '🇸🇿', symbol: 'L', ratePerUSD: 17.65, decimals: 2 },
  { id: 'LS', code: 'LSL', name: 'Lesotho Loti', country: 'Lesotho', flag: '🇱🇸', symbol: 'L', ratePerUSD: 17.65, decimals: 2 },
  { id: 'BI', code: 'BIF', name: 'Burundian Franc', country: 'Burundi', flag: '🇧🇮', symbol: 'FBu', ratePerUSD: 2930.0, decimals: 0 },
  { id: 'KM', code: 'KMF', name: 'Comorian Franc', country: 'Comoros', flag: '🇰🇲', symbol: 'CF', ratePerUSD: 452.0, decimals: 0 },
  { id: 'ST', code: 'STN', name: 'Sao Tome Dobra', country: 'Sao Tome & Principe', flag: '🇸🇹', symbol: 'Db', ratePerUSD: 22.50, decimals: 2 },
  { id: 'ZW', code: 'ZWG', name: 'Zimbabwe Gold (ZiG)', country: 'Zimbabwe', flag: '🇿🇼', symbol: 'ZiG ', ratePerUSD: 26.50, decimals: 2 },
  { id: 'SS', code: 'SSP', name: 'South Sudanese Pound', country: 'South Sudan', flag: '🇸🇸', symbol: 'SS£', ratePerUSD: 1550.0, decimals: 2 },
  { id: 'SD', code: 'SDG', name: 'Sudanese Pound', country: 'Sudan', flag: '🇸🇩', symbol: 'SDG ', ratePerUSD: 601.0, decimals: 2 }
];

// Map by currency code (sanitizing composite keys like USD_TL -> USD)
export const WORLD_CURRENCY_MAP = new Map<string, WorldCurrency>();
for (const item of WORLD_CURRENCIES) {
  const pureCode = item.code.split('_')[0].toUpperCase();
  if (!WORLD_CURRENCY_MAP.has(pureCode)) {
    WORLD_CURRENCY_MAP.set(pureCode, item);
  }
}

export function getWorldCurrency(codeOrId: string): WorldCurrency {
  const clean = (codeOrId || 'USD').split('_')[0].toUpperCase();
  // Try code map
  const foundByCode = WORLD_CURRENCY_MAP.get(clean);
  if (foundByCode) return foundByCode;

  // Try id or country match
  const foundById = WORLD_CURRENCIES.find(
    (c) => c.id.toUpperCase() === clean || c.code.toUpperCase() === clean
  );
  if (foundById) return foundById;

  return {
    id: clean,
    code: clean,
    name: `${clean} Currency`,
    country: 'International',
    flag: '🌐',
    symbol: `${clean} `,
    ratePerUSD: 1.0,
    decimals: 2
  };
}

export function formatWorldCurrency(amount: number, currencyCode: string): string {
  const curr = getWorldCurrency(currencyCode);
  const formattedNumber = amount.toLocaleString('en-US', {
    minimumFractionDigits: curr.decimals,
    maximumFractionDigits: curr.decimals
  });
  return `${curr.symbol}${formattedNumber}`;
}
