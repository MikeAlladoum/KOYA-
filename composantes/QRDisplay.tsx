'use client';

import { QRCodeSVG } from 'qrcode.react';
import { EscrowOrder } from '@/lib/escrow';
import { formatUsdc } from '@/lib/solana';
import { SUPPORTED_COUNTRIES } from '@/lib/constants';
import { getMockAgentById } from '@/lib/mockData';

interface QRDisplayProps {
  order: EscrowOrder;
}

export default function QRDisplay({ order }: QRDisplayProps) {
  const country = SUPPORTED_COUNTRIES.find((c) => c.code === order.recipientCountry);
  const agent = getMockAgentById(order.agentId ?? 'agent_1');

  // QR encodes the deep link for the recipient
  const qrValue = `koya://pickup?code=${order.withdrawCode}&amount=${order.amount}&agent=${order.agentId ?? 'agent_1'}`;

  // Also encode a web fallback URL
  const webUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/receive?id=${order.id}&code=${order.withdrawCode}`
    : `/receive?id=${order.id}&code=${order.withdrawCode}`;

  return (
    <div className="bg-koya-surface border border-koya-border rounded-2xl p-5 space-y-5 animate-slide-up">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="text-koya-green text-4xl">✓</div>
        <h3 className="text-koya-text font-bold text-lg">Money sent!</h3>
        <p className="text-koya-muted text-sm">
          <span className="text-koya-text font-semibold">${formatUsdc(order.amount)} USDC</span>
          {' '}on its way to {country?.flag} {country?.name}
        </p>
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        <div className="bg-white p-4 rounded-2xl shadow-lg">
          <QRCodeSVG
            value={webUrl}
            size={192}
            bgColor="#FFFFFF"
            fgColor="#0a0c0f"
            level="H"
            includeMargin={false}
          />
        </div>
      </div>

      {/* Pickup code */}
      <div className="text-center space-y-2">
        <p className="text-koya-muted text-xs uppercase tracking-wider">6-digit pickup code</p>
        <div className="flex justify-center gap-2">
          {order.withdrawCode.split('').map((digit, i) => (
            <div
              key={i}
              className="w-10 h-12 bg-koya-bg border border-koya-green/50 rounded-xl flex items-center justify-center text-koya-green text-xl font-black"
            >
              {digit}
            </div>
          ))}
        </div>
        <p className="text-koya-muted text-xs">Share this code with the recipient</p>
      </div>

      {/* Agent info */}
      {agent && (
        <div className="bg-koya-bg rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-koya-green/10 flex items-center justify-center text-xl shrink-0">🏪</div>
          <div>
            <p className="text-koya-text text-sm font-medium">{agent.name}</p>
            <p className="text-koya-muted text-xs">{agent.location}</p>
          </div>
        </div>
      )}

      {/* Tx signature */}
      {order.txSignature && !order.txSignature.startsWith('demo_') && (
        <div className="bg-koya-bg rounded-xl px-3 py-2">
          <p className="text-koya-muted text-xs">Solana transaction</p>
          <a
            href={`https://explorer.solana.com/tx/${order.txSignature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-koya-green text-xs font-mono break-all hover:underline"
          >
            {order.txSignature.slice(0, 20)}...
          </a>
        </div>
      )}

      {/* Protection notice */}
      <div className="flex items-start gap-2 bg-amber-900/10 border border-amber-500/20 rounded-xl p-3">
        <span className="text-amber-400 shrink-0">⚠️</span>
        <p className="text-amber-300/80 text-xs">
          Max agent fee: 2% — enforced by Solana smart contract. No agent can charge more.
        </p>
      </div>
    </div>
  );
}
