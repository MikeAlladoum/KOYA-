'use client';

import { formatUsdc } from '@/lib/solana';
import { WESTERN_UNION_FEE_BPS } from '@/lib/constants';
import { calcFee, fmtBps } from '@/lib/mockData';

interface FeeComparisonProps {
  amount: number;
  agentFeeBps?: number;
}

export default function FeeComparison({ amount, agentFeeBps = 150 }: FeeComparisonProps) {
  if (amount <= 0) return null;

  const koyaFee = calcFee(amount, agentFeeBps);
  const wuFee = calcFee(amount, WESTERN_UNION_FEE_BPS);
  const savings = wuFee - koyaFee;
  const savingsPercent = Math.round((savings / wuFee) * 100);
  const koyaBarWidth = Math.max(4, Math.round((koyaFee / wuFee) * 100));

  return (
    <div className="bg-koya-surface border border-koya-border rounded-2xl p-4 space-y-3">
      <p className="text-koya-text text-sm font-semibold">Fee comparison · ${formatUsdc(amount)} sent</p>

      <div className="space-y-3">
        {/* WU */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-koya-muted text-sm">Western Union (~10%)</span>
            <span className="text-koya-danger text-sm font-semibold">-${formatUsdc(wuFee)}</span>
          </div>
          <div className="h-2 bg-koya-bg rounded-full overflow-hidden">
            <div className="h-full bg-koya-danger/60 rounded-full w-full" />
          </div>
        </div>
        {/* Koya */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-koya-text text-sm font-medium">Koya ({fmtBps(agentFeeBps)})</span>
            <span className="text-koya-green text-sm font-bold">-${formatUsdc(koyaFee)}</span>
          </div>
          <div className="h-2 bg-koya-bg rounded-full overflow-hidden">
            <div className="h-full bg-koya-green rounded-full transition-all" style={{ width: `${koyaBarWidth}%` }} />
          </div>
        </div>
      </div>

      <div className="bg-koya-green/10 border border-koya-green/20 rounded-xl p-3 flex items-center justify-between">
        <span className="text-koya-green text-sm">You save</span>
        <span className="text-koya-green font-bold text-sm">${formatUsdc(savings)} ({savingsPercent}%)</span>
      </div>
    </div>
  );
}
