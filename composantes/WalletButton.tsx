'use client';

import { ReactNode, useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { RPC_URL } from '@/lib/constants';

require('@solana/wallet-adapter-react-ui/styles.css');

export function WalletContextProvider({ children }: { children: ReactNode }) {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function WalletButton() {
  return (
    <WalletMultiButton className="!bg-koya-green !text-black !font-bold !rounded-xl !h-12 !text-sm" />
  );
}

export function useKoyaWallet() {
  return useWallet();
}
