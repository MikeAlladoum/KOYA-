'use client';

import Link from 'next/link';
import { WalletButton } from '@/composantes/WalletButton';
import { APP_NAME, APP_TAGLINE, KOYA_MEANING } from '@/lib/constants';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-koya-bg animate-fade-in">
      {/* Header */}
      <header className="flex justify-between items-center px-5 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-koya-green flex items-center justify-center text-black font-black text-lg select-none">
            K
          </div>
          <span className="text-koya-text font-bold text-xl">{APP_NAME}</span>
        </div>
        <WalletButton />
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col justify-center px-5 py-10 space-y-8 animate-slide-up">
        {/* Badge */}
        <div className="flex">
          <div className="inline-flex items-center gap-2 bg-koya-surface border border-koya-green/20 rounded-full px-3 py-1.5">
            <div className="w-1.5 h-1.5 bg-koya-green rounded-full animate-pulse" />
            <span className="text-koya-green text-xs font-medium">Live on Solana Devnet</span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-[42px] font-black text-koya-text leading-[1.1] tracking-tight">
            {APP_TAGLINE}
          </h1>
          <p className="text-koya-muted text-base leading-relaxed">
            Send USDC to family in West Africa in seconds.
            Local agents handle the cash — fees capped at <span className="text-koya-text font-semibold">2% max</span>.
          </p>

        </div>


        {/* CTAs */}
        <div className="space-y-3">
          <Link
            href="/send"
            className="flex items-center justify-center gap-2 w-full bg-koya-green text-black font-bold rounded-2xl h-14 text-base transition-all active:scale-[0.98] hover:brightness-110"
          >
            💸 Send money
          </Link>
          <Link
            href="/agent"
            className="flex items-center justify-center gap-2 w-full bg-koya-surface border border-koya-border text-koya-text font-semibold rounded-2xl h-14 text-base transition-all active:scale-[0.98] hover:border-koya-green/40"
          >
            🏪 I'm an agent
          </Link>
          <Link
            href="/receive"
            className="flex items-center justify-center w-full text-koya-muted text-sm h-10 hover:text-koya-text transition-colors"
          >
            Pick up cash →
          </Link>
        </div>

        {/* Trust signals */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { v: '<1s', l: 'Settlement' },
            { v: '≤2%', l: 'Max fees' },
            { v: '6', l: 'Countries' },
          ].map((s) => (
            <div key={s.l} className="bg-koya-surface border border-koya-border rounded-2xl p-4 text-center">
              <p className="text-koya-green text-2xl font-black">{s.v}</p>
              <p className="text-koya-muted text-xs mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-5 pb-8 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 bg-koya-surface border border-koya-border rounded-full px-4 py-2">
          <img src="/solana-logo.svg" alt="Solana" className="w-4 h-4" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
          <span className="text-koya-muted text-xs">Built on Solana</span>
        </div>
        <p className="text-koya-muted/50 text-xs">🇹🇬 Made in Lomé, Togo</p>
      </footer>
    </main>
  );
}

function FeeRow({
  provider,
  feeLabel,
  received,
  bad,
  good,
}: {
  provider: string;
  feeLabel: string;
  received: string;
  bad?: boolean;
  good?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${good ? 'bg-koya-green' : 'bg-koya-danger'}`} />
        <span className={`text-sm font-medium ${good ? 'text-koya-text' : 'text-koya-muted'}`}>{provider}</span>
      </div>
      <div className="text-right">
        <span className={`text-sm font-semibold ${good ? 'text-koya-green' : 'text-koya-danger'}`}>{feeLabel}</span>
        <span className="text-koya-muted text-xs ml-2">→ {received}</span>
      </div>
    </div>
  );
}
