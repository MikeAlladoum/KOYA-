// Mock data for demo — used when wallet not connected or devnet is slow

export const MOCK_AGENTS = [
  {
    id: 'agent_1',
    name: 'Kodjo — Akodessewa Market',
    fee_bps: 150,
    location: 'Lomé, Akodessewa',
    available: true,
  },
  {
    id: 'agent_2',
    name: 'Ama — Kégué Quarter',
    fee_bps: 180,
    location: 'Lomé, Kégué',
    available: true,
  },
  {
    id: 'agent_3',
    name: 'Edem — Adidogomé',
    fee_bps: 120,
    location: 'Lomé, Adidogomé',
    available: false,
  },
];

export const MOCK_PENDING_ORDERS = [
  {
    id: 'order_001',
    amount: 200,
    currency: 'USDC',
    recipient: '+228 90 XX XX 42',
    code: '847291',
    created_at: '2026-05-06T10:30:00Z',
    fee_bps: 150,
    agent_id: 'agent_1',
  },
  {
    id: 'order_002',
    amount: 50,
    currency: 'USDC',
    recipient: '+228 91 XX XX 17',
    code: '293840',
    created_at: '2026-05-06T11:15:00Z',
    fee_bps: 180,
    agent_id: 'agent_2',
  },
];

export function getMockAgentById(id: string) {
  return MOCK_AGENTS.find((a) => a.id === id) ?? MOCK_AGENTS[0];
}

export function calcFee(amount: number, fee_bps: number): number {
  return (amount * fee_bps) / 10_000;
}

export function calcReceived(amount: number, fee_bps: number): number {
  return amount - calcFee(amount, fee_bps);
}

export function fmtBps(fee_bps: number): string {
  return `${(fee_bps / 100).toFixed(2)}%`;
}
