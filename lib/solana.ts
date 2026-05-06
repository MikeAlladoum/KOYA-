import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { RPC_URL, USDC_MINT, USDC_DECIMALS } from './constants';

export const getConnection = (): Connection => {
  return new Connection(RPC_URL, 'confirmed');
};

/**
 * Récupère le solde USDC d'un wallet (en unités lisibles)
 */
export async function getUsdcBalance(walletAddress: PublicKey): Promise<number> {
  const connection = getConnection();
  try {
    const ata = await getAssociatedTokenAddress(USDC_MINT, walletAddress);
    const account = await getAccount(connection, ata);
    return Number(account.amount) / Math.pow(10, USDC_DECIMALS);
  } catch {
    return 0;
  }
}

/**
 * Récupère le solde SOL d'un wallet
 */
export async function getSolBalance(walletAddress: PublicKey): Promise<number> {
  const connection = getConnection();
  const balance = await connection.getBalance(walletAddress);
  return balance / LAMPORTS_PER_SOL;
}

/**
 * Construit une transaction de transfert USDC
 */
export async function buildUsdcTransfer(
  from: PublicKey,
  to: PublicKey,
  amount: number
): Promise<Transaction> {
  const connection = getConnection();
  const transaction = new Transaction();

  const fromAta = await getAssociatedTokenAddress(USDC_MINT, from);
  const toAta = await getAssociatedTokenAddress(USDC_MINT, to);

  // Créer le compte token associé du destinataire si inexistant
  try {
    await getAccount(connection, toAta);
  } catch {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        from,
        toAta,
        to,
        USDC_MINT,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  const amountInLamports = Math.floor(amount * Math.pow(10, USDC_DECIMALS));

  transaction.add(
    createTransferInstruction(
      fromAta,
      toAta,
      from,
      BigInt(amountInLamports),
      [],
      TOKEN_PROGRAM_ID
    )
  );

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = from;

  return transaction;
}

/**
 * Calcule les frais Koya en USD
 */
export function calculateKoyaFee(amount: number): number {
  return (amount * 50) / 10000; // 0.5%
}

/**
 * Calcule les frais Western Union pour comparaison
 */
export function calculateWesternUnionFee(amount: number): number {
  return (amount * 800) / 10000; // ~8%
}

/**
 * Formate un montant USDC pour l'affichage
 */
export function formatUsdc(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Raccourcit une adresse Solana
 */
export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
