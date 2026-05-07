import './globals.css';
import { ReactNode } from 'react';
import { WalletContextProvider } from '@/composantes/WalletButton';

export const metadata = {
  title: 'Koya — Envoie de l\'argent sans frontières',
  description: 'Plateforme de transfert USDC sur Solana pour la diaspora africaine',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className="min-h-screen bg-koya-dark text-white">
        <WalletContextProvider>
          <div className="max-w-md mx-auto min-h-screen relative">
            {children}
          </div>
        </WalletContextProvider>
      </body>
    </html>
  );
}
