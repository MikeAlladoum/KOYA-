import { v4 as uuidv4 } from 'uuid';
import { EscrowStatus } from './constants';

export interface EscrowOrder {
  id: string;
  txSignature: string;
  sender: string;
  recipientPhone: string;
  recipientCountry: string;
  amount: number; // USDC
  fee: number;    // USDC
  status: EscrowStatus;
  createdAt: number;
  confirmedAt?: number;
  releasedAt?: number;
  agentId?: string;
  withdrawCode: string;
}

// Stockage en mémoire pour la démo hackathon
// En production, utiliser un programme Anchor onchain
const escrowStore: Map<string, EscrowOrder> = new Map();

/**
 * Crée un nouvel ordre d'escrow après le transfert USDC
 */
export function createEscrowOrder(params: {
  txSignature: string;
  sender: string;
  recipientPhone: string;
  recipientCountry: string;
  amount: number;
  fee: number;
  agentId?: string;
}): EscrowOrder {
  const order: EscrowOrder = {
    id: uuidv4(),
    txSignature: params.txSignature,
    sender: params.sender,
    recipientPhone: params.recipientPhone,
    recipientCountry: params.recipientCountry,
    amount: params.amount,
    fee: params.fee,
    status: EscrowStatus.LOCKED,
    createdAt: Date.now(),
    agentId: params.agentId,
    withdrawCode: generateWithdrawCode(),
  };

  escrowStore.set(order.id, order);

  // Persister dans localStorage pour la démo
  if (typeof window !== 'undefined') {
    const orders = getAllOrders();
    localStorage.setItem('koya_orders', JSON.stringify(orders));
  }

  return order;
}

/**
 * Génère un code de retrait à 6 chiffres
 */
function generateWithdrawCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Récupère un ordre par son ID
 */
export function getOrder(id: string): EscrowOrder | undefined {
  // Essayer le store en mémoire, puis localStorage
  if (escrowStore.has(id)) return escrowStore.get(id);

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('koya_orders');
    if (stored) {
      const orders: EscrowOrder[] = JSON.parse(stored);
      const order = orders.find((o) => o.id === id);
      if (order) {
        escrowStore.set(order.id, order);
        return order;
      }
    }
  }
  return undefined;
}

/**
 * Récupère tous les ordres (pour l'agent)
 */
export function getAllOrders(): EscrowOrder[] {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('koya_orders');
    if (stored) {
      const orders: EscrowOrder[] = JSON.parse(stored);
      orders.forEach((o) => escrowStore.set(o.id, o));
      return orders;
    }
  }
  return Array.from(escrowStore.values());
}

/**
 * L'agent confirme l'ordre (il a remis le cash)
 */
export function confirmOrder(orderId: string, agentId: string): EscrowOrder {
  const order = getOrder(orderId);
  if (!order) throw new Error('Ordre introuvable');
  if (order.status !== EscrowStatus.LOCKED) throw new Error('Ordre non verrouillé');

  const updated: EscrowOrder = {
    ...order,
    status: EscrowStatus.CONFIRMED,
    confirmedAt: Date.now(),
    agentId,
  };

  escrowStore.set(orderId, updated);
  persistOrders();
  return updated;
}

/**
 * Libère les fonds vers l'agent après confirmation
 */
export function releaseOrder(orderId: string): EscrowOrder {
  const order = getOrder(orderId);
  if (!order) throw new Error('Ordre introuvable');
  if (order.status !== EscrowStatus.CONFIRMED) throw new Error('Ordre non confirmé');

  const updated: EscrowOrder = {
    ...order,
    status: EscrowStatus.RELEASED,
    releasedAt: Date.now(),
  };

  escrowStore.set(orderId, updated);
  persistOrders();
  return updated;
}

/**
 * Annule un ordre si non encore confirmé
 */
export function cancelOrder(orderId: string): EscrowOrder {
  const order = getOrder(orderId);
  if (!order) throw new Error('Ordre introuvable');
  if (order.status === EscrowStatus.RELEASED) throw new Error('Ordre déjà libéré');

  const updated: EscrowOrder = {
    ...order,
    status: EscrowStatus.CANCELLED,
  };

  escrowStore.set(orderId, updated);
  persistOrders();
  return updated;
}

/**
 * Récupère les ordres par numéro de téléphone
 */
export function getOrdersByPhone(phone: string): EscrowOrder[] {
  return getAllOrders().filter((o) => o.recipientPhone === phone);
}

function persistOrders() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('koya_orders', JSON.stringify(getAllOrders()));
  }
}
