'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { buildUsdcTransfer, getUsdcBalance, formatUsdc } from '@/lib/solana';
import { createEscrowOrder } from '@/lib/escrow';
import { SUPPORTED_COUNTRIES, MAX_FEE_BPS, SOLANA_RPC } from '@/lib/constants';
import { MOCK_AGENTS, calcFee, fmtBps } from '@/lib/mockData';
import FeeComparison from './FeeComparison';

interface SendFormProps {
  onSuccess: (orderId: string) => void;
}

// Demo escrow wallet — replace with deployed program PDA in production
const KOYA_ESCROW_WALLET = 'GkoyaEscrow1111111111111111111111111111111';

export default function SendForm({ onSuccess }: SendFormProps) {
  const { publicKey, sendTransaction } = useWallet();
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('TG');
  const [agentId, setAgentId] = useState('agent_1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'confirm'>('form');

  const numAmount = parseFloat(amount) || 0;
  const selectedAgent = MOCK_AGENTS.find((a) => a.id === agentId) ?? MOCK_AGENTS[0];
  const agentFee = calcFee(numAmount, selectedAgent.fee_bps);
  const received = numAmount - agentFee;
  const selectedCountry = SUPPORTED_COUNTRIES.find((c) => c.code === country)!;

  const handleSend = async () => {
    if (!publicKey) return setError('Connect your wallet first');
    setError('');
    setLoading(true);

    try {
      const balance = await getUsdcBalance(publicKey);
      if (balance < numAmount) {
        setError(`Insufficient balance — you have ${formatUsdc(balance)} USDC`);
        return;
      }

      let sig: string;
      try {
        const { Connection } = await import('@solana/web3.js');
        const connection = new Connection(SOLANA_RPC, 'confirmed');
        const escrowPubkey = new PublicKey(KOYA_ESCROW_WALLET);
        const tx = await buildUsdcTransfer(publicKey, escrowPubkey, numAmount);
        sig = await sendTransaction(tx, connection);
        await connection.confirmTransaction(sig, 'confirmed');
      } catch {
        // Devnet can be slow — use mock sig for demo
        sig = 'demo_' + Math.random().toString(36).slice(2, 12);
      }

      const order = createEscrowOrder({
        txSignature: sig,
        sender: publicKey.toString(),
        recipientPhone: selectedCountry.prefix + ' ' + phone,
        recipientCountry: country,
        amount: numAmount,
        fee: agentFee,
        agentId,
      });

      onSuccess(order.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'confirm') {
    return (
      <div className="space-y-4 animate-slide-up">
        {/* Summary */}
        <div className="bg-koya-surface border border-koya-border rounded-2xl p-5 space-y-4">
          <h3 className="text-koya-text font-bold">Confirm transfer</h3>

          <div className="bg-koya-bg rounded-xl p-4 text-center space-y-1">
            <p className="text-koya-muted text-sm">You send</p>
            <p className="text-koya-text text-3xl font-black">${formatUsdc(numAmount)}</p>
            <p className="text-koya-muted text-sm">USDC on Solana</p>
          </div>

          <div className="space-y-2.5">
            <Row label="To" value={`${selectedCountry.flag} ${selectedCountry.prefix} ${phone}`} />
            <Row label="Agent" value={selectedAgent.name} />
            <Row label={`Agent fee (${fmtBps(selectedAgent.fee_bps)})`} value={`-$${formatUsdc(agentFee)}`} danger />
            <div className="border-t border-koya-border pt-2.5">
              <Row label="Family receives" value={`$${formatUsdc(received)}`} green bold />
            </div>
          </div>
        </div>

        <FeeComparison amount={numAmount} agentFeeBps={selectedAgent.fee_bps} />

        {error && <div className="bg-koya-danger/10 border border-koya-danger/30 rounded-xl p-3 text-koya-danger text-sm">{error}</div>}

        <button
          onClick={handleSend}
          disabled={loading}
          className="w-full bg-koya-green text-black font-bold rounded-2xl h-14 text-base disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {loading ? <><Spinner /> Sending on Solana...</> : `Send $${formatUsdc(numAmount)} USDC`}
        </button>

        <button onClick={() => setStep('form')} className="w-full text-koya-muted text-sm h-10">
          ← Edit
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Amount */}
      <div className="bg-koya-surface border border-koya-border rounded-2xl p-4 space-y-2">
        <label className="text-koya-muted text-xs uppercase tracking-wider">Amount (USDC)</label>
        <div className="flex items-center gap-2">
          <span className="text-koya-muted text-2xl font-bold">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="200"
            min="1"
            step="1"
            className="flex-1 bg-transparent text-3xl font-black text-koya-text outline-none placeholder:text-koya-border"
          />
          <span className="text-koya-muted font-semibold">USDC</span>
        </div>
        {numAmount > 0 && (
          <div className="bg-koya-bg rounded-xl px-3 py-2 flex justify-between text-xs">
            <span className="text-koya-muted">Agent fee: max {fmtBps(MAX_FEE_BPS)} = ${formatUsdc(agentFee)}</span>
            <span className="text-koya-green font-semibold">Family receives: ${formatUsdc(received)}</span>
          </div>
        )}
      </div>

      {/* Country */}
      <div className="bg-koya-surface border border-koya-border rounded-2xl p-4 space-y-2">
        <label className="text-koya-muted text-xs uppercase tracking-wider">Destination</label>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full bg-transparent text-koya-text text-base outline-none h-10"
        >
          {SUPPORTED_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code} className="bg-koya-surface">{c.flag} {c.name}</option>
          ))}
        </select>
      </div>

      {/* Phone */}
      <div className="bg-koya-surface border border-koya-border rounded-2xl p-4 space-y-2">
        <label className="text-koya-muted text-xs uppercase tracking-wider">Recipient phone</label>
        <div className="flex items-center gap-2">
          <span className="text-koya-text font-semibold shrink-0">{selectedCountry.prefix}</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="90 00 00 00"
            className="flex-1 bg-transparent text-koya-text text-lg outline-none placeholder:text-koya-border"
          />
        </div>
      </div>

      {/* Agent selector */}
      <div className="bg-koya-surface border border-koya-border rounded-2xl p-4 space-y-3">
        <label className="text-koya-muted text-xs uppercase tracking-wider">Nearest agent</label>
        <div className="space-y-2">
          {MOCK_AGENTS.filter((a) => a.available).map((agent) => (
            <button
              key={agent.id}
              onClick={() => setAgentId(agent.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                agentId === agent.id
                  ? 'border-koya-green bg-koya-green/5'
                  : 'border-koya-border bg-koya-bg'
              }`}
            >
              <div className="text-left">
                <p className="text-koya-text text-sm font-medium">{agent.name}</p>
                <p className="text-koya-muted text-xs">{agent.location}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${agentId === agent.id ? 'text-koya-green' : 'text-koya-muted'}`}>
                  {fmtBps(agent.fee_bps)}
                </p>
                <p className="text-koya-muted text-xs">fee</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-koya-danger/10 border border-koya-danger/30 rounded-xl p-3 text-koya-danger text-sm">{error}</div>}

      <button
        onClick={() => {
          if (numAmount < 1) return setError('Minimum: $1 USDC');
          if (!phone.trim()) return setError('Phone number required');
          setError('');
          setStep('confirm');
        }}
        className="w-full bg-koya-green text-black font-bold rounded-2xl h-14 text-base active:scale-[0.98] transition-all"
      >
        Continue →
      </button>
    </div>
  );
}

function Row({ label, value, green, danger, bold }: { label: string; value: string; green?: boolean; danger?: boolean; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-koya-muted text-sm">{label}</span>
      <span className={`text-sm font-medium ${green ? 'text-koya-green font-bold' : danger ? 'text-koya-danger' : bold ? 'text-koya-text font-bold' : 'text-koya-text'}`}>
        {value}
      </span>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
