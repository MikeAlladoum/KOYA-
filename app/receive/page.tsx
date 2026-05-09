'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getOrder, EscrowOrder, confirmOrder, releaseOrder } from '@/lib/escrow';
import { EscrowStatus, SUPPORTED_COUNTRIES } from '@/lib/constants';
import { formatUsdc } from '@/lib/solana';
import { getMockAgentById } from '@/lib/mockData';

function ReceiveContent() {
  const params = useSearchParams();
  const orderId = params.get('id');
  const urlCode = params.get('code');

  const [order, setOrder] = useState<EscrowOrder | null>(null);
  const [phone, setPhone] = useState('');
  const [codeInput, setCodeInput] = useState(urlCode ?? '');
  const [step, setStep] = useState<'lookup' | 'confirm' | 'done'>(orderId ? 'confirm' : 'lookup');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (orderId && urlCode) {
      const o = getOrder(orderId);
      if (o) { setOrder(o); setStep('confirm'); }
    }
  }, [orderId, urlCode]);

  const handleSearch = () => {
    setError('');
    const orders = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('koya_orders') ?? '[]' : '[]') as EscrowOrder[];
    const match = orders.find((o) => o.recipientPhone.replace(/\s/g, '').includes(phone.replace(/\s/g, '')));
    if (match) { setOrder(match); setStep('confirm'); }
    else setError('No transfer found for this number.');
  };

  const handleConfirm = () => {
    if (!order) return;
    if (codeInput.trim() !== order.withdrawCode) { setError('Wrong pickup code.'); return; }
    setLoading(true);
    try {
      confirmOrder(order.id, order.agentId ?? 'agent_1');
      releaseOrder(order.id);
      setOrder({ ...order, status: EscrowStatus.CLAIMED });
      setStep('done');
    } finally {
      setLoading(false);
    }
  };

  const country = order ? SUPPORTED_COUNTRIES.find((c) => c.code === order.recipientCountry) : null;
  const agent = order ? getMockAgentById(order.agentId ?? 'agent_1') : null;

  if (step === 'done' && order) {
    return (
      <div className="space-y-4 animate-slide-up">
        <div className="bg-koya-surface border border-koya-green/30 rounded-2xl p-6 text-center space-y-3">
          <div className="text-5xl">✅</div>
          <h2 className="text-koya-text font-bold text-xl">Cash received!</h2>
          <p className="text-koya-muted text-sm">
            {formatUsdc(order.amount)} USDC has been released to your agent.
          </p>
          <p className="text-koya-green font-semibold text-2xl">${formatUsdc(order.amount)}</p>
        </div>
        <Link href="/" className="flex items-center justify-center w-full bg-koya-surface border border-koya-border text-koya-text font-medium rounded-xl h-12 text-sm">
          ← Back home
        </Link>
      </div>
    );
  }

  if (step === 'confirm' && order) {
    return (
      <div className="space-y-4 animate-slide-up">
        {/* Amount card */}
        <div className="bg-koya-surface border border-koya-border rounded-2xl p-5 space-y-4">
          <div className="text-center">
            <p className="text-koya-muted text-sm">Amount to receive</p>
            <p className="text-koya-green text-4xl font-black mt-1">${formatUsdc(order.amount)}</p>
            <p className="text-koya-muted text-xs mt-1">
              {country?.flag} {country?.name} · {order.recipientPhone}
            </p>
          </div>

          {agent && (
            <div className="bg-koya-bg rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-koya-green/10 flex items-center justify-center text-xl">🏪</div>
              <div>
                <p className="text-koya-text text-sm font-medium">{agent.name}</p>
                <p className="text-koya-muted text-xs">{agent.location}</p>
              </div>
            </div>
          )}
        </div>

        {/* Code input */}
        <div className="bg-koya-surface border border-koya-border rounded-2xl p-5 space-y-3">
          <p className="text-koya-text font-medium text-sm">Enter your 6-digit pickup code</p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ''))}
            placeholder="● ● ● ● ● ●"
            className="w-full bg-koya-bg border border-koya-border rounded-xl px-4 h-14 text-koya-text text-center text-2xl tracking-[0.5em] outline-none focus:border-koya-green transition-colors"
          />
          {error && <p className="text-koya-danger text-sm">{error}</p>}
        </div>

        <button
          onClick={handleConfirm}
          disabled={loading || codeInput.length !== 6}
          className="w-full bg-koya-green text-black font-bold rounded-2xl h-14 text-base disabled:opacity-40 active:scale-[0.98] transition-all"
        >
          {loading ? <Spinner /> : '✓ Confirm I received the cash'}
        </button>

        <div className="flex items-center gap-2 text-xs text-koya-muted bg-koya-surface border border-koya-border rounded-xl p-3">
          <span>🔒</span>
          <span>Max agent fee: 2% — enforced by Solana smart contract</span>
        </div>
      </div>
    );
  }

  // Lookup step
  return (
    <div className="space-y-4">
      <div className="bg-koya-surface border border-koya-border rounded-2xl p-5 space-y-4">
        <p className="text-koya-text font-semibold">Find your transfer</p>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+228 90 00 00 00"
          className="w-full bg-koya-bg border border-koya-border rounded-xl px-4 h-12 text-koya-text outline-none focus:border-koya-green transition-colors"
        />
        {error && <p className="text-koya-danger text-sm">{error}</p>}
        <button onClick={handleSearch} className="w-full bg-koya-green text-black font-bold rounded-xl h-12">
          Search
        </button>
      </div>

      <div className="bg-koya-surface border border-koya-border rounded-2xl p-4 space-y-3">
        <p className="text-koya-text text-sm font-semibold">How to pick up cash</p>
        <ol className="space-y-2">
          {[
            'Sender shares a QR code or 6-digit code with you',
            'Find a nearby Koya agent',
            'Show the code — agent hands you the cash',
            'Max 2% fee — protected by the blockchain',
          ].map((s, i) => (
            <li key={i} className="flex gap-2 text-koya-muted text-sm">
              <span className="text-koya-green font-bold shrink-0">{i + 1}.</span>
              {s}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 mx-auto" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function ReceivePage() {
  return (
    <main className="min-h-screen flex flex-col bg-koya-bg animate-fade-in">
      <header className="flex items-center gap-3 px-5 pt-6 pb-4">
        <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-xl bg-koya-surface border border-koya-border text-koya-muted hover:text-koya-text transition-colors">
          ←
        </Link>
        <h1 className="text-koya-text font-bold text-lg">Pick up cash</h1>
      </header>

      <div className="flex-1 px-5 pb-8 animate-slide-up">
        <Suspense fallback={<div className="flex-1 flex items-center justify-center text-koya-muted">Loading...</div>}>
          <ReceiveContent />
        </Suspense>
      </div>
    </main>
  );
}
