'use client';

import { QRCodeSVG } from 'qrcode.react';
import { EscrowOrder } from '@/lib/escrow';
import { formatUsdc } from '@/lib/solana';
import { SUPPORTED_COUNTRIES } from '@/lib/constants';
import { getMockAgentById } from '@/lib/mockData';

export default function QRDisplay({ order }: { order: EscrowOrder }) {
  const country = SUPPORTED_COUNTRIES.find((c) => c.code === order.recipientCountry);
  const agent = getMockAgentById(order.agentId ?? 'agent_1');

  const webUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/receive?id=${order.id}&code=${order.withdrawCode}`
    : `/receive?id=${order.id}&code=${order.withdrawCode}`;

  const whatsappMsg = encodeURIComponent(
    `Your Koya transfer is ready 🎉\n\n` +
    `Amount: *$${formatUsdc(order.amount)} USDC*\n` +
    `Pickup code: *${order.withdrawCode}*\n\n` +
    `Open: ${webUrl}\n\n` +
    `Go to ${agent?.name} — ${agent?.location} and show this code.`
  );

  const isDevnetSim = order.txSignature?.startsWith('devnet_sim');

  return (
    <div className="bg-koya-surface border border-koya-border rounded-2xl p-5 space-y-5 animate-slide-up">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="w-14 h-14 bg-koya-green/15 rounded-full flex items-center justify-center">
            <span className="text-koya-green text-2xl font-bold">✓</span>
          </div>
        </div>
        <h3 className="text-koya-text font-bold text-lg">Transfer secured!</h3>
        <p className="text-koya-muted text-sm">
          <span className="text-koya-text font-semibold">${formatUsdc(order.amount)} USDC</span>
          {' '}locked on Solana · {country?.flag} {country?.name}
        </p>
        <div className="inline-flex items-center gap-1.5 bg-amber-900/20 border border-amber-500/20 rounded-full px-3 py-1">
          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
          <span className="text-amber-400 text-xs font-medium">Pending pickup</span>
        </div>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center gap-2">
        <div className="bg-white p-4 rounded-2xl shadow-md">
          <QRCodeSVG value={webUrl} size={176} bgColor="#FFFFFF" fgColor="#0a0c0f" level="H" />
        </div>
        <p className="text-koya-muted text-xs">Beneficiary scans to confirm receipt</p>
      </div>

      {/* 6-digit code */}
      <div className="text-center space-y-2">
        <p className="text-koya-muted text-xs uppercase tracking-wider">6-digit pickup code</p>
        <div className="flex justify-center gap-1.5">
          {order.withdrawCode.split('').map((digit, i) => (
            <div
              key={i}
              className="w-10 h-12 bg-koya-bg border border-koya-green/40 rounded-xl flex items-center justify-center text-koya-green text-xl font-black"
            >
              {digit}
            </div>
          ))}
        </div>
        <p className="text-koya-muted text-xs">Share this code with the beneficiary</p>
      </div>

      {/* Payout + Agent */}
      <div className="space-y-2">
        <div className="bg-koya-bg rounded-xl p-3 flex items-center gap-3">
          <span className="text-2xl">{order.payoutMethod === 'TMoney' ? '📱' : '💵'}</span>
          <div>
            <p className="text-koya-text text-sm font-medium">
              {order.payoutMethod === 'TMoney' ? 'T-Money payout' : 'Cash pickup'}
            </p>
            <p className="text-koya-muted text-xs">Payout method</p>
          </div>
        </div>
        {agent && (
          <div className="bg-koya-bg rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-koya-green/10 flex items-center justify-center text-xl shrink-0">🏪</div>
            <div>
              <p className="text-koya-text text-sm font-medium">{agent.name}</p>
              <p className="text-koya-muted text-xs">{agent.location}</p>
            </div>
          </div>
        )}
      </div>

      {/* WhatsApp share */}
      <a
        href={`https://wa.me/?text=${whatsappMsg}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] font-semibold rounded-2xl h-12 text-sm hover:bg-[#25D366]/20 transition-all active:scale-[0.98]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        Share via WhatsApp
      </a>

      {/* Solana tx link */}
      {!isDevnetSim && order.txSignature && (
        <div className="bg-koya-bg rounded-xl px-3 py-2">
          <p className="text-koya-muted text-xs mb-0.5">Solana transaction</p>
          <a
            href={`https://explorer.solana.com/tx/${order.txSignature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-koya-green text-xs font-mono break-all hover:underline"
          >
            {order.txSignature.slice(0, 28)}...
          </a>
        </div>
      )}
    </div>
  );
}


interface QRDisplayProps {
  order: EscrowOrder;
}

