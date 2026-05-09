'use client';

import Link from 'next/link';
import { WalletButton } from '@/composantes/WalletButton';
import AgentPanel from '@/composantes/AgentPanel';

export default function AgentPage() {
  return (
    <main className="min-h-screen flex flex-col bg-koya-bg animate-fade-in">
      <header className="flex justify-between items-center px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-xl bg-koya-surface border border-koya-border text-koya-muted hover:text-koya-text transition-colors">
            â†
          </Link>
          <div>
            <h1 className="text-koya-text font-bold text-lg">Pickup desk</h1>
            <p className="text-koya-muted text-xs">Agent Â· LomÃ©, Togo ðŸ‡¹ðŸ‡¬</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-koya-green/10 border border-koya-green/20 rounded-full px-2.5 py-1">
            <span className="text-koya-green text-xs font-medium">â— Online</span>
          </div>
          <WalletButton />
        </div>
      </header>

      {/* How it works */}
      <div className="px-5 mb-4">
        <div className="bg-koya-surface border border-koya-border rounded-2xl p-4 space-y-2">
          <p className="text-koya-text text-sm font-semibold">How to deliver a transfer</p>
          <ol className="space-y-1.5">
            {[
              'Beneficiary shows QR code or 6-digit code',
              'Enter the code in the order card below',
              'Click â€œConfirm deliveryâ€ â†’ status changes to Processing',
              'Hand over cash or trigger T-Money payout â†’ Claimed',
            ].map((s, i) => (
              <li key={i} className="flex gap-2 text-koya-muted text-xs">
                <span className="text-koya-green font-bold shrink-0">{i + 1}.</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="flex-1 px-5 pb-8 animate-slide-up">
        <AgentPanel />
      </div>
    </main>
  );
}

