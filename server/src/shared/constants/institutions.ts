export interface SeedInstitution {
  name: string;
  bicSwift: string;
  routingNumber: string;
  country: string;
  supportedCurrencies: string[];
  supportedRail: 'ACH' | 'WIRE' | 'SEPA' | 'FASTER_PAYMENTS' | 'ZENGIN' | 'NEFT' | 'RAAST' | 'RTGS' | 'SWIFT';
  networkStatus: 'ONLINE' | 'DEGRADED';
  isFictionalDisclaimer: boolean;
}

export const SEED_INSTITUTIONS: SeedInstitution[] = [
  {
    name: 'Bank of Maldives PLC',
    bicSwift: 'MALBMVMV',
    routingNumber: '7701-BML',
    country: 'Maldives',
    supportedCurrencies: ['MVR', 'USD', 'EUR', 'GBP'],
    supportedRail: 'SWIFT',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'JPMorgan Chase Bank, N.A.',
    bicSwift: 'CHASUS33',
    routingNumber: '021000021',
    country: 'United States',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'JPY'],
    supportedRail: 'WIRE',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'Bank of America, N.A.',
    bicSwift: 'BOFAUS3N',
    routingNumber: '111000025',
    country: 'United States',
    supportedCurrencies: ['USD', 'EUR', 'GBP'],
    supportedRail: 'ACH',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'Citibank, N.A.',
    bicSwift: 'CITIUS33',
    routingNumber: '021000089',
    country: 'United States',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'PKR', 'CAD'],
    supportedRail: 'WIRE',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'Goldman Sachs Bank USA',
    bicSwift: 'GSNYUS33',
    routingNumber: '026014887',
    country: 'United States',
    supportedCurrencies: ['USD', 'EUR', 'GBP'],
    supportedRail: 'WIRE',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'Wells Fargo Bank, N.A.',
    bicSwift: 'PNBPUS33NNY',
    routingNumber: '121000247',
    country: 'United States',
    supportedCurrencies: ['USD', 'CAD'],
    supportedRail: 'ACH',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'Morgan Stanley Bank, N.A.',
    bicSwift: 'MSIBAG33',
    routingNumber: '021000018',
    country: 'United States',
    supportedCurrencies: ['USD', 'EUR'],
    supportedRail: 'WIRE',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'Barclays Bank PLC',
    bicSwift: 'BARCGB22',
    routingNumber: '20-00-00',
    country: 'United Kingdom',
    supportedCurrencies: ['GBP', 'EUR', 'USD'],
    supportedRail: 'FASTER_PAYMENTS',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'HSBC Bank plc',
    bicSwift: 'MIDLGB22',
    routingNumber: '40-05-15',
    country: 'United Kingdom',
    supportedCurrencies: ['GBP', 'EUR', 'USD', 'INR', 'PKR', 'CAD'],
    supportedRail: 'FASTER_PAYMENTS',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'Standard Chartered Bank',
    bicSwift: 'SCBLGB22',
    routingNumber: '60-92-42',
    country: 'United Kingdom',
    supportedCurrencies: ['GBP', 'USD', 'INR', 'PKR', 'EUR', 'AED'],
    supportedRail: 'WIRE',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'Deutsche Bank AG',
    bicSwift: 'DEUTDEDB',
    routingNumber: '50070010',
    country: 'Germany',
    supportedCurrencies: ['EUR', 'USD', 'GBP'],
    supportedRail: 'SEPA',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'BNP Paribas S.A.',
    bicSwift: 'BNPAFRPP',
    routingNumber: '30004-001',
    country: 'France',
    supportedCurrencies: ['EUR', 'USD', 'GBP'],
    supportedRail: 'SEPA',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'UBS Switzerland AG',
    bicSwift: 'UBSWCHZH',
    routingNumber: '0240-001',
    country: 'Switzerland',
    supportedCurrencies: ['EUR', 'USD', 'GBP'],
    supportedRail: 'WIRE',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'Crédit Agricole CIB',
    bicSwift: 'AGRIFRPP',
    routingNumber: '30002-005',
    country: 'France',
    supportedCurrencies: ['EUR', 'USD'],
    supportedRail: 'SEPA',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'MUFG Bank, Ltd. (Tokyo)',
    bicSwift: 'BOTKJPJT',
    routingNumber: '0005-001',
    country: 'Japan',
    supportedCurrencies: ['JPY', 'USD', 'EUR'],
    supportedRail: 'ZENGIN',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'Sumitomo Mitsui Banking Corporation (SMBC)',
    bicSwift: 'SMBCJPJT',
    routingNumber: '0009-001',
    country: 'Japan',
    supportedCurrencies: ['JPY', 'USD'],
    supportedRail: 'ZENGIN',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'Royal Bank of Canada (RBC)',
    bicSwift: 'ROYCCAT2',
    routingNumber: '00001-003',
    country: 'Canada',
    supportedCurrencies: ['CAD', 'USD', 'GBP'],
    supportedRail: 'WIRE',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'Toronto-Dominion Bank (TD)',
    bicSwift: 'TDOMCA22',
    routingNumber: '00004-004',
    country: 'Canada',
    supportedCurrencies: ['CAD', 'USD'],
    supportedRail: 'WIRE',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'State Bank of India (SBI)',
    bicSwift: 'SBININBB',
    routingNumber: 'SBIN0000691',
    country: 'India',
    supportedCurrencies: ['INR', 'USD', 'EUR', 'GBP'],
    supportedRail: 'NEFT',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'HDFC Bank Limited',
    bicSwift: 'HDFCINBB',
    routingNumber: 'HDFC0000060',
    country: 'India',
    supportedCurrencies: ['INR', 'USD', 'EUR', 'GBP'],
    supportedRail: 'NEFT',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'ICICI Bank Limited',
    bicSwift: 'ICICINBB',
    routingNumber: 'ICIC0000001',
    country: 'India',
    supportedCurrencies: ['INR', 'USD', 'EUR', 'GBP'],
    supportedRail: 'NEFT',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'Axis Bank Limited',
    bicSwift: 'UTIBINBB',
    routingNumber: 'UTIB0000001',
    country: 'India',
    supportedCurrencies: ['INR', 'USD', 'GBP'],
    supportedRail: 'NEFT',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'Habib Bank Limited (HBL)',
    bicSwift: 'HABBPKKA',
    routingNumber: '0002001',
    country: 'Pakistan',
    supportedCurrencies: ['PKR', 'USD', 'GBP', 'EUR', 'AED'],
    supportedRail: 'RAAST',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'United Bank Limited (UBL)',
    bicSwift: 'UNILPKKA',
    routingNumber: '0003001',
    country: 'Pakistan',
    supportedCurrencies: ['PKR', 'USD', 'GBP', 'AED'],
    supportedRail: 'RAAST',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'MCB Bank Limited',
    bicSwift: 'MUCBPKKA',
    routingNumber: '0004001',
    country: 'Pakistan',
    supportedCurrencies: ['PKR', 'USD', 'GBP'],
    supportedRail: 'RAAST',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'Meezan Bank Limited (Islamic)',
    bicSwift: 'MEZNPKKA',
    routingNumber: '0014001',
    country: 'Pakistan',
    supportedCurrencies: ['PKR', 'USD', 'AED'],
    supportedRail: 'RAAST',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'National Bank of Pakistan (NBP)',
    bicSwift: 'NBPAPKKA',
    routingNumber: '0001001',
    country: 'Pakistan',
    supportedCurrencies: ['PKR', 'USD'],
    supportedRail: 'RAAST',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'Emirates NBD',
    bicSwift: 'EBILAEAD',
    routingNumber: '0120-001',
    country: 'United Arab Emirates',
    supportedCurrencies: ['AED', 'USD', 'EUR', 'GBP', 'INR', 'PKR'],
    supportedRail: 'WIRE',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  },
  {
    name: 'DBS Bank Ltd (Singapore)',
    bicSwift: 'DBSSSGSG',
    routingNumber: '7171-001',
    country: 'Singapore',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY'],
    supportedRail: 'WIRE',
    networkStatus: 'ONLINE',
    isFictionalDisclaimer: false
  }
];
