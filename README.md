# Koya — Send money home. Not fees.

> *"Koya" means "to send" in Ewe, the language of Lomé, Togo.*

Koya is a Solana-based remittance platform that lets the African diaspora send USDC to family members in West Africa **instantly** — at a fraction of what Western Union charges. Instead of routing money through slow, expensive bank rails, Koya settles on Solana in under a second, then uses a **local agent P2P system** for last-mile cash delivery. Agents are registered on-chain with fees capped at 2% by the smart contract — no agent can ever charge more, even if they wanted to.

Built at a Solana hackathon by a developer from Lomé, Togo — this is a real problem experienced first-hand.

---

## Run locally

```bash
cd koya
npm install
npm run dev
# → http://localhost:3000
```

> The app works without a wallet — mock data is shown automatically for demo.

---

## Screens

| Route | Description |
|-------|-------------|
| `/` | Landing page with fee comparison |
| `/send` | Send USDC flow (wallet required for live tx) |
| `/receive` | Recipient picks up cash with 6-digit code |
| `/agent` | Agent dashboard — confirm deliveries, earn USDC |

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

One command. No configuration needed.

---

## Deploy smart contract to Devnet

> Requires Rust + Anchor CLI installed

```bash
cd presentateur
anchor build
anchor deploy --provider.cluster devnet
# Copy program ID → update declare_id!() in lib.rs + PROGRAM_ID in lib/constants.ts
```

---

## The last-mile agent system

**The problem**: Recipients in Lomé, Togo don't have USDC wallets. They need cash.

**How Koya solves it**:

1. **Diaspora** (Paris, New York, London) sends USDC via Solana → funds locked in escrow smart contract
2. **Recipient** receives a QR code + 6-digit pickup code via WhatsApp/SMS
3. **Local agent** (e.g. Kodjo at Akodessewa Market) scans the QR, hands over cash
4. **Agent** enters the code → smart contract verifies → releases USDC to agent wallet
5. **Fee cap**: `MAX_FEE_BPS = 200` (2%) is enforced in the Anchor program — agents register their fee on-chain and cannot exceed this limit

**Why it works**: Agents are incentivized — they earn USDC for providing the cash service. Recipients are protected — no agent can abuse fees. The blockchain enforces the rules.

---

## Tech stack

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Solana Devnet** — USDC devnet mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
- **@solana/wallet-adapter-react** — Phantom, Backpack support
- **Anchor** (Rust) — smart contract with 4 instructions
- **Mock escrow** in TypeScript for hackathon demo (localStorage-based)

---

## Smart contract (Anchor)

Located at `presentateur/programmes/koya/src/lib.rs`

| Instruction | Description |
|-------------|-------------|
| `initialize_escrow` | Sender locks USDC into PDA, stores sender/agent/amount/max_fee_bps |
| `register_agent` | Agent registers with fee ≤ 2%, stored on-chain |
| `confirm_delivery` | Agent confirms cash handed over → releases USDC proportionally |
| `cancel_escrow` | Sender cancels after 24h timeout → full refund |

---

*🇹🇬 Made in Lomé, Togo · Built on Solana · Hackathon 2026*
