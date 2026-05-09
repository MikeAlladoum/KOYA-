'use client';

import { useState, useEffect } from 'react';
import { getAllOrders, updateOrderStatus, EscrowOrder, createEscrowOrder } from '@/lib/escrow';
import { EscrowStatus, SUPPORTED_COUNTRIES } from '@/lib/constants';
import { formatUsdc } from '@/lib/solana';
import { getMockAgentById } from '@/lib/mockData';

export default function AgentPanel() {
  const [orders, setOrders] = useState<EscrowOrder[]>([]);
  const [codeInput, setCodeInput] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  const reload = () => {
    setOrders(getAllOrders().sort((a, b) => b.createdAt - a.createdAt));
  };

  const loadDemoOrder = () => {
    createEscrowOrder({
      txSignature: 'devnet_sim_demo1234',
      sender: 'DemoWallet1111111111111111111111111111',
      recipientPhone: '+228 90 12 34 56',
      recipientCountry: 'TG',
      amount: 50,
      fee: 0.75,
      agentId: 'agent_1',
      payoutMethod: 'Cash',
    });
    reload();
  };

  useEffect(() => {
    reload();
    const interval = setInterval(reload, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleConfirm = async (order: EscrowOrder) => {
    const code = codeInput[order.id]?.trim();
    if (code !== order.withdrawCode) {
      alert('Wrong pickup code — ask the beneficiary to check again.');
      return;
    }
    setProcessingId(order.id);

    // Step 1: PENDING → PROCESSING (immediate)
    updateOrderStatus(order.id, EscrowStatus.PROCESSING);
    reload();

    // Step 2: PROCESSING → CLAIMED (after 2.5s animation)
    await new Promise((r) => setTimeout(r, 2500));
    updateOrderStatus(order.id, EscrowStatus.CLAIMED);
    setProcessingId(null);
    reload();
  };

  const pending = orders.filter((o) => o.status === EscrowStatus.PENDING);
  const processing = orders.filter((o) => o.status === EscrowStatus.PROCESSING);
  const claimed = orders.filter((o) => o.status === EscrowStatus.CLAIMED);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Pending" value={pending.length} color="text-amber-400" />
        <StatCard label="Processing" value={processing.length} color="text-blue-400" />
        <StatCard label="Claimed" value={claimed.length} color="text-koya-green" />
      </div>

      {orders.length === 0 ? (
        <div className="bg-koya-surface border border-koya-border rounded-2xl p-10 text-center space-y-4">
          <p className="text-4xl">&#128685;</p>
          <p className="text-koya-text font-semibold">No transfers yet</p>
          <p className="text-koya-muted text-sm">
            Send money from the Send page — orders will appear here instantly
          </p>
          <button
            onClick={loadDemoOrder}
            className="mt-2 bg-koya-green/10 border border-koya-green/30 text-koya-green text-sm font-semibold rounded-xl px-4 py-2 hover:bg-koya-green/20 transition-all active:scale-95"
          >
            Load demo order
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              codeInput={codeInput[order.id] ?? ''}
              onCodeChange={(v) => setCodeInput((p) => ({ ...p, [order.id]: v }))}
              onConfirm={() => handleConfirm(order)}
              isConfirming={processingId === order.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  codeInput,
  onCodeChange,
  onConfirm,
  isConfirming,
}: {
  order: EscrowOrder;
  codeInput: string;
  onCodeChange: (v: string) => void;
  onConfirm: () => void;
  isConfirming: boolean;
}) {
  const country = SUPPORTED_COUNTRIES.find((c) => c.code === order.recipientCountry);
  const agent = getMockAgentById(order.agentId ?? 'agent_1');
  const payoutIcon = order.payoutMethod === 'TMoney' ? '📱' : '💵';
  const payoutLabel = order.payoutMethod === 'TMoney' ? 'T-Money' : 'Cash';

  // ── CLAIMED ──────────────────────────────────────────────────────────────
  if (order.status === EscrowStatus.CLAIMED) {
    return (
      <div className="bg-koya-surface border border-koya-green/30 rounded-2xl p-4 space-y-2 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-koya-text font-semibold text-sm">{country?.flag} {order.recipientPhone}</p>
            <p className="text-koya-muted text-xs">
              {new Date(order.createdAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-koya-text font-black text-lg">${formatUsdc(order.amount)}</p>
            <span className="text-xs px-2 py-0.5 rounded-full border text-koya-green bg-koya-green/10 border-koya-green/20">
              ✓ Claimed
            </span>
          </div>
        </div>
        <div className="bg-koya-green/5 border border-koya-green/20 rounded-xl px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{payoutIcon}</span>
            <span className="text-koya-muted text-xs">{payoutLabel} delivered</span>
          </div>
          <span className="text-koya-green text-xs font-semibold">+${formatUsdc(order.fee)} earned</span>
        </div>
      </div>
    );
  }

  // ── PROCESSING ────────────────────────────────────────────────────────────
  if (order.status === EscrowStatus.PROCESSING) {
    return (
      <div className="bg-koya-surface border border-blue-500/30 rounded-2xl p-4 space-y-3 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-koya-text font-semibold text-sm">{country?.flag} {order.recipientPhone}</p>
            <p className="text-koya-muted text-xs">${formatUsdc(order.amount)}</p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full border text-blue-400 bg-blue-900/20 border-blue-500/20">
            ⚡ Processing
          </span>
        </div>
        <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-3 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
          <div>
            <p className="text-blue-300 text-sm font-medium">Releasing USDC to your wallet...</p>
            <p className="text-blue-400/60 text-xs">Solana confirmation in progress</p>
          </div>
        </div>
      </div>
    );
  }

  // ── PENDING ───────────────────────────────────────────────────────────────â”€
  return (
    <div className="bg-koya-surface border border-koya-border rounded-2xl p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-koya-text font-semibold text-sm">{country?.flag} {order.recipientPhone}</p>
          <p className="text-koya-muted text-xs mt-0.5">
            {new Date(order.createdAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-koya-text font-black text-lg">${formatUsdc(order.amount)}</p>
          <span className="text-xs px-2 py-0.5 rounded-full border text-amber-400 bg-amber-900/20 border-amber-500/20">
            ⧖ Pending
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 bg-koya-bg rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
          <span>{payoutIcon}</span>
          <span className="text-koya-muted">{payoutLabel}</span>
        </div>
        <div className="flex-1 bg-koya-bg rounded-xl px-3 py-2 flex justify-between text-xs">
          <span className="text-koya-muted">Your fee</span>
          <span className="text-koya-green font-semibold">+${formatUsdc(order.fee)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-koya-muted text-xs">Ask beneficiary for the 6-digit code:</p>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={codeInput}
          onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, ''))}
          placeholder="_ _ _ _ _ _"
          className="w-full bg-koya-bg border border-koya-border rounded-xl px-4 h-12 text-koya-text text-center text-2xl tracking-[0.5em] outline-none focus:border-koya-green transition-colors"
        />
        <button
          onClick={onConfirm}
          disabled={codeInput.length !== 6 || isConfirming}
          className="w-full bg-koya-green text-black font-bold rounded-xl h-12 text-sm disabled:opacity-40 active:scale-[0.98] transition-all"
        >
          {isConfirming ? 'Confirming...' : 'Confirm delivery →'}
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-koya-surface border border-koya-border rounded-xl p-3 text-center">
      <p className={`font-black text-2xl ${color}`}>{value}</p>
      <p className="text-koya-muted text-xs mt-0.5">{label}</p>
    </div>
  );
}

