import { SupportedCurrency } from '../constants/currencies';

export interface InstitutionDTO {
  id: string;
  name: string;
  bicSwift: string;
  routingNumber: string;
  country: string;
  supportedCurrencies: SupportedCurrency[];
  supportedRail: 'ACH' | 'WIRE' | 'SEPA' | 'FASTER_PAYMENTS' | 'ZENGIN' | 'NEFT' | 'RAAST' | 'RTGS' | 'SWIFT';
  networkStatus: 'ONLINE' | 'DEGRADED';
  isFictionalDisclaimer: boolean;
}
