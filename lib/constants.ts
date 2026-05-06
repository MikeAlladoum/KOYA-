import { PublicKey } from '@solana/web3.js';

// ─── App identity ────────────────────────────────────────────────────────────
export const APP_NAME = 'Koya';
export const APP_TAGLINE = 'Send money home. Not fees.';
export const KOYA_MEANING = 'To send — in Ewe, the language of Lomé, Togo';

// ─── Solana ──────────────────────────────────────────────────────────────────
export const SOLANA_RPC = 'https://api.devnet.solana.com';
/** @deprecated use SOLANA_RPC */
export const RPC_URL = SOLANA_RPC;

// USDC Devnet mint address
export const USDC_MINT_DEVNET = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
export const USDC_MINT = new PublicKey(USDC_MINT_DEVNET);
export const USDC_DECIMALS = 6;

// ─── Fee rules ───────────────────────────────────────────────────────────────
/** Hard cap: 2% — enforced in smart contract */
export const MAX_FEE_BPS = 200;
export const ESCROW_TIMEOUT_H = 24;

// Western Union fee rate for comparison (~10%)
export const WESTERN_UNION_FEE_BPS = 1000;

// ─── Countries served ────────────────────────────────────────────────────────
export const SUPPORTED_COUNTRIES = [
  { code: 'TG', name: 'Togo', flag: '🇹🇬', prefix: '+228' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳', prefix: '+221' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', prefix: '+225' },
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯', prefix: '+229' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', prefix: '+233' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', prefix: '+223' },
];

// ─── Escrow status ───────────────────────────────────────────────────────────
export enum EscrowStatus {
  LOCKED = 'LOCKED',
  CONFIRMED = 'CONFIRMED',
  RELEASED = 'RELEASED',
  CANCELLED = 'CANCELLED',
}

// ─── Routes ──────────────────────────────────────────────────────────────────
export const ROUTES = {
  HOME: '/',
  SEND: '/send',
  RECEIVE: '/receive',
  AGENT: '/agent',
} as const;
