'use client';

import { useState, useEffect } from 'react';
import { getAllOrders, confirmOrder, releaseOrder, EscrowOrder } from '@/lib/escrow';
import { EscrowStatus } from '@/lib/constants';
import { formatUsdc } from '@/lib/solana';
import { SUPPORTED_COUNTRIES } from '@/lib/constants';
import { getMockAgentById, MOCK_PENDING_ORDERS, calcFee, fmtBps } from '@/lib/mockData';

const DEMO_AGENT_ID = 'agent_1';

export default function AgentPanel() {
  const [orders, setOrders] = useState<EscrowOrder[]>([]);
  const [filter, setFilter] = useState<EscrowStatus | 'ALL'>('ALL');
  const [processing, setProcessing] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState<Record<string, string>>({});
  const [useMock, setUseMock] = useState(false);

  useEffect(() => {
    const real = getAllOrders().reverse();
    if (real.length === 0) {
      setUseMock(true);
    } else {
      setOrders(real);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const real = getAllOrders().reverse();
      if (real.length > 0) { setOrders(real); setUseMock(false); }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const displayOrders = useMock
    ? MOCK_PENDING_ORDERS.map((o) => ({
        id: o.id,
        txSignature: 'mock',
        sender: 'DemoSender',
        recipientPhone: o.recipient,
        recipientCountry: 'TG',
        amount: o.amount,
        fee: calcFee(o.amount, o.fee_bps),
        status: EscrowStatus.LOCKED,
        createdAt: new Date(o.created_at).getTime(),
        agentId: o.agent_id,
        withdrawCode: o.code,
      } as EscrowOrder))
    : orders;

  const filtered = displayOrders.filter((o) => filter === 'ALL' || o.status === filter);
  const pendingCount = displayOrders.filter((o) => o.status === EscrowStatus.LOCKED).length;

  const earnedUSDC = displayOrders
    .filter((o) => o.status === EscrowStatus.RELEASED)
    .reduce((sum, o) => sum + o.fee, 0);

  const handleConfirm = (order: EscrowOrder) => {
    const code = codeInput[order.id]?.trim();
    if (useMock) {
      alert(`Demo mode: would release $${order.amount} USDC to agent wallet`);
      return;
    }
    if (code !== order.withdrawCode) {
      alert('Wrong pickup code');
      return;
    }
    setProcessing(order.id);
    try {
      confirmOrder(order.id, DEMO_AGENT_ID);
      releaseOrder(order.id);
      setOrders(getAllOrders().reverse());
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-4">
      {useMock && (
        <div className="bg-koya-surface border border-koya-border rounded-xl p-3">
          <span className="text-koya-muted text-xs">Demo mode - showing mock orders</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Pending" value={pendingCount} color="text-amber-400" />
        <StatCard
          label="Delivered"
          value={displayOrders.filter((o) => o.status === EscrowStatus.RELEASED).length}
          color="text-koya-green"
        />
        <StatCard label="Earned" value={`$${formatUsdc(earnedUSDC)}`} color="text-koya-green" isString />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['ALL', EscrowStatus.LOCKED, EscrowStatus.RELEASED, EscrowStatus.CANCELLED] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filter === s ? 'bg-koya-green text-black' : 'bg-koya-surface border border-koya-border text-koya-muted'
            }`}
          >
            {s === 'ALL' ? 'All' : s === EscrowStatus.LOCKED ? 'Pending' : s === EscrowStatus.RELEASED ? 'Delivered' : 'Cancelled'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-koya-muted text-sm">No orders yet</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isMock={useMock}
              codeInput={codeInput[order.id] ?? ''}
              onCodeChange={(v) => setCodeInput((p) => ({ ...p, [order.id]: v }))}
              onConfirm={() => handleConfirm(order)}
              isProcessing={processing === order.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  isMock,
  codeInput,
  onCodeChange,
  onConfirm,
  isProcessing,
}: {
  order: EscrowOrder;
  isMock: boolean;
  codeInput: string;
  onCodeChange: (v: string) => void;
  onConfirm: () => void;
  isProcessing: boolean;
}) {
  const country = SUPPORTED_COUNTRIES.find((c) => c.code === order.recipientCountry);
  const agent = getMockAgentById(order.agentId ?? DEMO_AGENT_ID);
  const agentFee = order.fee;
  const isLocked = order.status === EscrowStatus.LOCKED;

  const statusStyle = {
    [EscrowStatus.LOCKED]: 'text-amber-400 bg-amber-900/20 border-amber-500/20',
    [EscrowStatus.CONFIRMED]: 'text-blue-400 bg-blue-900/20 border-blue-500/20',
    [EscrowStatus.RELEASED]: 'text-koya-green bg-koya-green/10 border-koya-green/20',
    [EscrowStatus.CANCELLED]: 'text-koya-danger bg-koya-danger/10 border-koya-danger/20',
  }[order.status];

  return (
    <div className="bg-koya-surface border border-koya-border rounded-2xl p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-koya-text font-semibold text-sm">
            {country?.flag} {order.recipientPhone}
          </p>
          <p className="text-koya-muted text-xs mt-0.5">
            {new Date(order.createdAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-koya-text font-black text-lg">${formatUsdc(order.amount)}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${statusStyle}`}>{order.status}</span>
        </div>
      </div>

      <div className="bg-koya-bg rounded-xl px-3 py-2 flex justify-between text-xs">
        <span className="text-koya-muted">Your fee ({fmtBps(agent.fee_bps)})</span>
        <span className="text-koya-green font-semibold">+${formatUsdc(agentFee)}</span>
      </div>

      {isLocked && (
        <div className="space-y-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={isMock ? order.withdrawCode : codeInput}
            onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, ''))}
            readOnly={isMock}
            placeholder="Enter 6-digit code"
            className="w-full bg-koya-bg border border-koya-border rounded-xl px-4 h-12 text-koya-text text-center text-xl tracking-widest outline-none focus:border-koya-green transition-colors"
          />
          <button
            onClick={onConfirm}
            disabled={isProcessing || (!isMock && codeInput.length !== 6)}
            className="w-full bg-koya-green text-black font-bold rounded-xl h-12 text-sm disabled:opacity-40 active:scale-[0.98] transition-all"
          >
            {isProcessing ? 'Processing...' : 'Mark as delivered'}
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, isString }: { label: string; value: number | string; color: string; isString?: boolean }) {
  return (
    <div className="bg-koya-surface border border-koya-border rounded-xl p-3 text-center">
      <p className={`font-black ${color} ${isString ? 'text-lg' : 'text-2xl'}`}>{value}</p>
      <p className="text-koya-muted text-xs mt-0.5">{label}</p>
    </div>
  );
}
