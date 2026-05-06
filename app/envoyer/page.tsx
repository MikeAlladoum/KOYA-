'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from '@/composantes/WalletButton';
import SendForm from '@/composantes/SendForm';
import QRDisplay from '@/composantes/QRDisplay';
import { getOrder, EscrowOrder } from '@/lib/escrow';

export default function EnvoyerPage() {
  const { connected } = useWallet();
  const [completedOrder, setCompletedOrder] = useState<EscrowOrder | null>(null);

  const handleSuccess = (orderId: string) => {
    const order = getOrder(orderId);
    if (order) setCompletedOrder(order);
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-koya-muted text-xl">←</Link>
          <h1 className="text-white font-bold text-lg">
            {completedOrder ? 'Envoi réussi' : 'Envoyer USDC'}
          </h1>
        </div>
        <WalletButton />
      </header>

      <div className="flex-1 px-5 pb-8 space-y-4">
        {!connected && !completedOrder && (
          <div className="bg-koya-card border border-koya-border rounded-2xl p-5 text-center space-y-3">
            <p className="text-3xl">👛</p>
            <p className="text-white font-semibold">Connectez votre wallet</p>
            <p className="text-koya-muted text-sm">
              Utilisez Phantom ou Backpack pour envoyer de l'USDC
            </p>
            <div className="flex justify-center">
              <WalletButton />
            </div>
          </div>
        )}

        {completedOrder ? (
          <>
            <QRDisplay order={completedOrder} />
            <Link
              href="/"
              className="flex items-center justify-center w-full bg-koya-card border border-koya-border text-white font-medium rounded-xl h-12 text-sm"
            >
              ← Retour à l'accueil
            </Link>
          </>
        ) : (
          <SendForm onSuccess={handleSuccess} />
        )}
      </div>
    </main>
  );
}
