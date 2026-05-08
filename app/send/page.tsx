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
  const [demoMode, setDemoMode] = useState(false);

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
        {!connected && !completedOrder && !demoMode && (
          <div className="bg-koya-surface border border-koya-border rounded-2xl p-6 text-center space-y-4">
            <p className="text-4xl">👛</p>
            <div>
              <p className="text-koya-text font-semibold">Connect your wallet to send</p>
              <p className="text-koya-muted text-sm mt-1">
                Connect any Solana wallet — Phantom, Backpack, Solflare...
              </p>
            </div>
            <div className="flex justify-center">
              <WalletButton />
            </div>
            <div className="border-t border-koya-border pt-4">
              <p className="text-koya-muted text-xs mb-3">No wallet? Try the demo:</p>
              <button
                onClick={() => setDemoMode(true)}
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
        ) : (connected || demoMode) ? (
          <>
            <SendForm onSuccess={handleSuccess} demoMode={demoMode} />
            {!demoMode && (
              <div className="border-t border-koya-border pt-4 text-center">
                <p className="text-koya-muted text-xs mb-2">No USDC devnet? Try the demo:</p>
                <button
                  onClick={() => setDemoMode(true)}
                  className="text-koya-green text-sm font-medium underline"
                >
                  Try demo →
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}
