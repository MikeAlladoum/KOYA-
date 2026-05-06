'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from '@/composantes/WalletButton';
import SendForm from '@/composantes/SendForm';
import QRDisplay from '@/composantes/QRDisplay';
import { getOrder, EscrowOrder } from '@/lib/escrow';

export default function SendPage() {
  const { connected } = useWallet();
  const [completedOrder, setCompletedOrder] = useState<EscrowOrder | null>(null);

  const handleSuccess = (orderId: string) => {
    const order = getOrder(orderId);
    if (order) setCompletedOrder(order);
  };

  return (
    <main className="min-h-screen flex flex-col bg-koya-bg animate-fade-in">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-xl bg-koya-surface border border-koya-border text-koya-muted hover:text-koya-text transition-colors">
            ←
          </Link>
          <h1 className="text-koya-text font-bold text-lg">
            {completedOrder ? 'Payment sent!' : 'Send money'}
          </h1>
        </div>
        {!completedOrder && <WalletButton />}
      </header>

      <div className="flex-1 px-5 pb-8 space-y-4 animate-slide-up">
        {!connected && !completedOrder && (
          <div className="bg-koya-surface border border-koya-border rounded-2xl p-6 text-center space-y-4">
            <p className="text-4xl">👛</p>
            <div>
              <p className="text-koya-text font-semibold">Connect your wallet to send</p>
              <p className="text-koya-muted text-sm mt-1">
                Use Phantom or Backpack — works on mobile too
              </p>
            </div>
            <div className="flex justify-center">
              <WalletButton />
            </div>
            <div className="border-t border-koya-border pt-4">
              <p className="text-koya-muted text-xs mb-3">No wallet? Preview the demo:</p>
              <button
                onClick={() => {
                  const { createEscrowOrder } = require('@/lib/escrow');
                  const order = createEscrowOrder({
                    txSignature: 'demo_' + Date.now(),
                    sender: 'DemoWalletXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                    recipientPhone: '+228 90 12 34 56',
                    recipientCountry: 'TG',
                    amount: 200,
                    fee: 3,
                    agentId: 'agent_1',
                  });
                  setCompletedOrder(order);
                }}
                className="text-koya-green text-sm font-medium underline"
              >
                Try demo →
              </button>
            </div>
          </div>
        )}

        {completedOrder ? (
          <>
            <QRDisplay order={completedOrder} />
            <Link
              href="/"
              className="flex items-center justify-center w-full bg-koya-surface border border-koya-border text-koya-text font-medium rounded-xl h-12 text-sm"
            >
              ← Back home
            </Link>
          </>
        ) : connected ? (
          <SendForm onSuccess={handleSuccess} />
        ) : null}
      </div>
    </main>
  );
}
