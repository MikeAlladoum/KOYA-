import { v4 as uuidv4 } from 'uuid';
import { EscrowStatus, PayoutMethod } from './constants';

export interface EscrowOrder {
  id: string;
  txSignature: string;
  sender: string;
  recipientPhone: string;
  recipientCountry: string;
  amount: number;
  fee: number;
  status: EscrowStatus;
  payoutMethod: PayoutMethod;
  createdAt: number;
  processedAt?: number;
  claimedAt?: number;
  agentId?: string;
  withdrawCode: string;
}

const escrowStore: Map<string, EscrowOrder> = new Map();

function persist(orders: EscrowOrder[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('koya_orders', JSON.stringify(orders));
  }
}

export function createEscrowOrder(params: {
  txSignature: string;
  sender: string;
  recipientPhone: string;
  recipientCountry: string;
  amount: number;
  fee: number;
  agentId?: string;
  payoutMethod?: PayoutMethod;
}): EscrowOrder {
  const order: EscrowOrder = {
    id: uuidv4(),
    txSignature: params.txSignature,
    sender: params.sender,
    recipientPhone: params.recipientPhone,
    recipientCountry: params.recipientCountry,
    amount: params.amount,
    fee: params.fee,
    status: EscrowStatus.PENDING,
    payoutMethod: params.payoutMethod ?? 'Cash',
    createdAt: Date.now(),
    agentId: params.agentId,
    withdrawCode: generateWithdrawCode(),
  };
  escrowStore.set(order.id, order);
  persist(getAllOrders());
  return order;
}

function generateWithdrawCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getOrder(id: string): EscrowOrder | undefined {
  if (escrowStore.has(id)) return escrowStore.get(id);
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('koya_orders');
    if (stored) {
      const orders: EscrowOrder[] = JSON.parse(stored);
      const order = orders.find((o) => o.id === id);
      if (order) { escrowStore.set(order.id, order); return order; }
    }
  }
  return undefined;
}

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

export function updateOrderStatus(id: string, status: EscrowStatus): EscrowOrder | undefined {
  const order = getOrder(id);
  if (!order) return undefined;
  const updated: EscrowOrder = {
    ...order,
    status,
    processedAt: status === EscrowStatus.PROCESSING ? Date.now() : order.processedAt,
    claimedAt: status === EscrowStatus.CLAIMED ? Date.now() : order.claimedAt,
  };
  escrowStore.set(id, updated);
  const all = getAllOrders().map((o) => (o.id === id ? updated : o));
  persist(all);
  return updated;
}

// Backward-compatible aliases
export function confirmOrder(orderId: string, _agentId: string) {
  updateOrderStatus(orderId, EscrowStatus.PROCESSING);
}

export function releaseOrder(orderId: string) {
  updateOrderStatus(orderId, EscrowStatus.CLAIMED);
}

function persistOrders() {
  persist(getAllOrders());
}


