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
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-xl bg-koya-surface border border-koya-border text-koya-muted hover:text-koya-text transition-colors">
            â†
          </Link>
          <h1 className="text-koya-text font-bold text-lg">
            {completedOrder ? 'Transfer secured!' : 'Send money'}
          </h1>
        </div>
        {!completedOrder && <WalletButton />}
      </header>

      <div className="flex-1 px-5 pb-8 space-y-4 animate-slide-up">
        {!connected && !completedOrder && (
          <div className="bg-koya-surface border border-koya-border rounded-2xl p-6 text-center space-y-5">
            <p className="text-5xl">ðŸ‘›</p>
            <div className="space-y-1">
              <p className="text-koya-text font-bold text-lg">Connect your wallet</p>
              <p className="text-koya-muted text-sm">
                Use any Solana wallet â€” Phantom, Backpack, Solflare...
              </p>
            </div>
            <div className="flex justify-center">
              <WalletButton />
            </div>
            <div className="grid grid-cols-3 gap-3 pt-1">
              {[
                { v: '<1s', l: 'Settlement' },
                { v: 'â‰¤2%', l: 'Max fees' },
                { v: '6', l: 'Countries' },
              ].map((s) => (
                <div key={s.l} className="bg-koya-bg rounded-xl p-3 text-center">
                  <p className="text-koya-green text-lg font-black">{s.v}</p>
                  <p className="text-koya-muted text-xs">{s.l}</p>
                </div>
              ))}
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
              â† Back home
            </Link>
          </>
        ) : connected ? (
          <SendForm onSuccess={handleSuccess} />
        ) : null}
      </div>
    </main>
  );
}


