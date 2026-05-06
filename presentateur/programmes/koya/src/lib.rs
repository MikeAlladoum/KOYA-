use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("KoyaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

/// Hard cap: 2% — no agent can charge more
pub const MAX_FEE_BPS: u16 = 200;

#[program]
pub mod koya {
    use super::*;

    // ─── 1. initialize_escrow ────────────────────────────────────────────────
    /// Sender locks USDC into escrow PDA.
    /// Stores: sender, agent, amount, max_fee_bps (≤ 200), status = Pending
    pub fn initialize_escrow(
        ctx: Context<InitializeEscrow>,
        amount: u64,
        max_fee_bps: u16,
        recipient_phone_hash: [u8; 32],
    ) -> Result<()> {
        require!(amount > 0, KoyaError::InvalidAmount);
        require!(max_fee_bps <= MAX_FEE_BPS, KoyaError::FeeTooHigh);

        let escrow = &mut ctx.accounts.escrow;
        escrow.sender = ctx.accounts.sender.key();
        escrow.agent = ctx.accounts.agent.key();
        escrow.amount = amount;
        escrow.max_fee_bps = max_fee_bps;
        escrow.recipient_phone_hash = recipient_phone_hash;
        escrow.status = EscrowStatus::Pending;
        escrow.created_at = Clock::get()?.unix_timestamp;
        escrow.bump = ctx.bumps.escrow;

        // Lock USDC into the vault PDA
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.sender_token_account.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.sender.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, amount)?;

        emit!(EscrowCreated {
            escrow: escrow.key(),
            sender: escrow.sender,
            agent: escrow.agent,
            amount,
        });

        Ok(())
    }

    // ─── 2. register_agent ───────────────────────────────────────────────────
    /// Agent registers with their fee (must be ≤ MAX_FEE_BPS = 200).
    /// Stores: agent pubkey, fee_bps, is_active
    pub fn register_agent(ctx: Context<RegisterAgent>, fee_bps: u16) -> Result<()> {
        require!(fee_bps <= MAX_FEE_BPS, KoyaError::FeeTooHigh);

        let agent_account = &mut ctx.accounts.agent_account;
        agent_account.pubkey = ctx.accounts.agent.key();
        agent_account.fee_bps = fee_bps;
        agent_account.total_delivered = 0;
        agent_account.is_active = true;
        agent_account.bump = ctx.bumps.agent_account;

        Ok(())
    }

    // ─── 3. confirm_delivery ─────────────────────────────────────────────────
    /// Called by agent with recipient confirmation code.
    /// Releases: agent_amount = escrow.amount * agent.fee_bps / 10000
    /// Releases: recipient_amount = escrow.amount - agent_amount
    /// Status → Completed
    pub fn confirm_delivery(ctx: Context<ConfirmDelivery>) -> Result<()> {
        let escrow = &ctx.accounts.escrow;
        require!(escrow.status == EscrowStatus::Pending, KoyaError::AlreadyDelivered);
        require!(
            ctx.accounts.agent.key() == escrow.agent,
            KoyaError::NotAuthorized
        );

        let agent_account = &ctx.accounts.agent_account;
        let effective_fee_bps = agent_account.fee_bps.min(escrow.max_fee_bps);

        let agent_amount = (escrow.amount as u128)
            .checked_mul(effective_fee_bps as u128)
            .unwrap()
            .checked_div(10_000)
            .unwrap() as u64;
        let recipient_amount = escrow.amount.checked_sub(agent_amount).unwrap();

        // PDA signer seeds
        let seeds: &[&[u8]] = &[
            b"escrow",
            escrow.sender.as_ref(),
            escrow.agent.as_ref(),
            &[escrow.bump],
        ];
        let signer = &[seeds];

        // Transfer to agent
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.agent_token_account.to_account_info(),
                    authority: ctx.accounts.escrow.to_account_info(),
                },
                signer,
            ),
            agent_amount,
        )?;

        // Transfer to recipient
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.recipient_token_account.to_account_info(),
                    authority: ctx.accounts.escrow.to_account_info(),
                },
                signer,
            ),
            recipient_amount,
        )?;

        let escrow = &mut ctx.accounts.escrow;
        escrow.status = EscrowStatus::Completed;

        let agent_acc = &mut ctx.accounts.agent_account;
        agent_acc.total_delivered = agent_acc.total_delivered.checked_add(escrow.amount).unwrap_or(u64::MAX);

        emit!(DeliveryConfirmed {
            escrow: escrow.key(),
            agent: ctx.accounts.agent.key(),
            agent_amount,
            recipient_amount,
        });

        Ok(())
    }

    // ─── 4. cancel_escrow ────────────────────────────────────────────────────
    /// Only callable by sender after 24h timeout.
    /// Returns full amount to sender.
    pub fn cancel_escrow(ctx: Context<CancelEscrow>) -> Result<()> {
        let escrow = &ctx.accounts.escrow;
        require!(escrow.status == EscrowStatus::Pending, KoyaError::AlreadyDelivered);

        let now = Clock::get()?.unix_timestamp;
        let timeout_secs = 24i64 * 3600;
        require!(
            now.saturating_sub(escrow.created_at) >= timeout_secs,
            KoyaError::EscrowExpired
        );

        let seeds: &[&[u8]] = &[
            b"escrow",
            escrow.sender.as_ref(),
            escrow.agent.as_ref(),
            &[escrow.bump],
        ];
        let signer = &[seeds];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.sender_token_account.to_account_info(),
                    authority: ctx.accounts.escrow.to_account_info(),
                },
                signer,
            ),
            escrow.amount,
        )?;

        let escrow = &mut ctx.accounts.escrow;
        escrow.status = EscrowStatus::Cancelled;

        Ok(())
    }
}

// ─── Account Contexts ────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeEscrow<'info> {
    #[account(
        init,
        payer = sender,
        space = 8 + EscrowAccount::INIT_SPACE,
        seeds = [b"escrow", sender.key().as_ref(), agent.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, EscrowAccount>,

    #[account(mut)]
    pub sender: Signer<'info>,

    /// CHECK: Agent pubkey, will be validated in confirm_delivery
    pub agent: UncheckedAccount<'info>,

    #[account(mut, constraint = sender_token_account.owner == sender.key())]
    pub sender_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterAgent<'info> {
    #[account(
        init_if_needed,
        payer = agent,
        space = 8 + AgentAccount::INIT_SPACE,
        seeds = [b"agent", agent.key().as_ref()],
        bump
    )]
    pub agent_account: Account<'info, AgentAccount>,

    #[account(mut)]
    pub agent: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ConfirmDelivery<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.sender.as_ref(), agent.key().as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, EscrowAccount>,

    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,

    pub agent: Signer<'info>,

    #[account(seeds = [b"agent", agent.key().as_ref()], bump = agent_account.bump)]
    pub agent_account: Account<'info, AgentAccount>,

    #[account(mut, constraint = agent_token_account.owner == agent.key())]
    pub agent_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelEscrow<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.sender.as_ref(), escrow.agent.as_ref()],
        bump = escrow.bump,
        has_one = sender
    )]
    pub escrow: Account<'info, EscrowAccount>,

    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,

    pub sender: Signer<'info>,

    #[account(mut, constraint = sender_token_account.owner == sender.key())]
    pub sender_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ─── State Accounts ──────────────────────────────────────────────────────────

/// EscrowAccount stores: sender, agent, amount, max_fee_bps, status, created_at, recipient_phone_hash
#[account]
#[derive(InitSpace)]
pub struct EscrowAccount {
    pub sender: Pubkey,
    pub agent: Pubkey,
    pub amount: u64,
    pub max_fee_bps: u16,
    pub status: EscrowStatus,
    pub created_at: i64,
    pub recipient_phone_hash: [u8; 32],
    pub bump: u8,
}

/// AgentAccount stores: pubkey, fee_bps, total_delivered, is_active
#[account]
#[derive(InitSpace)]
pub struct AgentAccount {
    pub pubkey: Pubkey,
    pub fee_bps: u16,
    pub total_delivered: u64,
    pub is_active: bool,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum EscrowStatus {
    Pending,
    Completed,
    Cancelled,
}

// ─── Events ──────────────────────────────────────────────────────────────────

#[event]
pub struct EscrowCreated {
    pub escrow: Pubkey,
    pub sender: Pubkey,
    pub agent: Pubkey,
    pub amount: u64,
}

#[event]
pub struct DeliveryConfirmed {
    pub escrow: Pubkey,
    pub agent: Pubkey,
    pub agent_amount: u64,
    pub recipient_amount: u64,
}

// ─── Errors ──────────────────────────────────────────────────────────────────

#[error_code]
pub enum KoyaError {
    #[msg("Fee exceeds the 2% maximum — protection for recipients")]
    FeeTooHigh,
    #[msg("Invalid amount — must be greater than 0")]
    InvalidAmount,
    #[msg("Escrow already delivered or cancelled")]
    AlreadyDelivered,
    #[msg("Not authorized to confirm this delivery")]
    NotAuthorized,
    #[msg("Too early to cancel — wait 24 hours after creation")]
    EscrowExpired,
}

/// Frais maximum en basis points (2%)
pub const MAX_FEE_BPS: u64 = 200;

#[program]
pub mod koya {
    use super::*;

    /// Verrouille les USDC dans l'escrow et crée un ordre de retrait
    pub fn lock_funds(
        ctx: Context<LockFunds>,
        amount: u64,
        fee_bps: u64,
        recipient_phone_hash: [u8; 32],
        withdraw_code_hash: [u8; 32],
    ) -> Result<()> {
        require!(fee_bps <= MAX_FEE_BPS, KoyaError::FeeTooHigh);
        require!(amount > 0, KoyaError::InvalidAmount);

        let order = &mut ctx.accounts.escrow_order;
        order.sender = ctx.accounts.sender.key();
        order.amount = amount;
        order.fee_bps = fee_bps;
        order.recipient_phone_hash = recipient_phone_hash;
        order.withdraw_code_hash = withdraw_code_hash;
        order.status = OrderStatus::Locked;
        order.created_at = Clock::get()?.unix_timestamp;
        order.bump = ctx.bumps.escrow_order;

        // Transférer USDC vers l'escrow vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.sender_token_account.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.sender.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        emit!(FundsLocked {
            order: order.key(),
            sender: order.sender,
            amount,
        });

        Ok(())
    }

    /// L'agent confirme avoir remis le cash et reçoit les USDC
    pub fn release_funds(
        ctx: Context<ReleaseFunds>,
        withdraw_code: String,
    ) -> Result<()> {
        let order = &mut ctx.accounts.escrow_order;
        require!(order.status == OrderStatus::Locked, KoyaError::InvalidStatus);

        // Vérifier le code de retrait (hash)
        let code_hash = anchor_lang::solana_program::hash::hash(withdraw_code.as_bytes()).to_bytes();
        require!(
            code_hash == order.withdraw_code_hash,
            KoyaError::InvalidWithdrawCode
        );

        let fee = order.amount * order.fee_bps / 10_000;
        let agent_amount = order.amount - fee;

        // Seeds pour signer depuis le PDA
        let seeds = &[
            b"escrow",
            order.sender.as_ref(),
            &[order.bump],
        ];
        let signer = &[&seeds[..]];

        // Transférer vers l'agent
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.agent_token_account.to_account_info(),
            authority: ctx.accounts.escrow_order.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, agent_amount)?;

        order.status = OrderStatus::Released;
        order.agent = Some(ctx.accounts.agent.key());
        order.released_at = Some(Clock::get()?.unix_timestamp);

        emit!(FundsReleased {
            order: order.key(),
            agent: ctx.accounts.agent.key(),
            amount: agent_amount,
            fee,
        });

        Ok(())
    }

    /// L'expéditeur peut annuler si pas encore traité (après 24h)
    pub fn cancel_order(ctx: Context<CancelOrder>) -> Result<()> {
        let order = &mut ctx.accounts.escrow_order;
        require!(order.status == OrderStatus::Locked, KoyaError::InvalidStatus);

        let now = Clock::get()?.unix_timestamp;
        require!(
            now - order.created_at > 86_400, // 24 heures
            KoyaError::TooEarlyToCancel
        );

        let seeds = &[b"escrow", order.sender.as_ref(), &[order.bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.sender_token_account.to_account_info(),
            authority: ctx.accounts.escrow_order.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, order.amount)?;

        order.status = OrderStatus::Cancelled;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct LockFunds<'info> {
    #[account(
        init,
        payer = sender,
        space = 8 + EscrowOrder::INIT_SPACE,
        seeds = [b"escrow", sender.key().as_ref()],
        bump
    )]
    pub escrow_order: Account<'info, EscrowOrder>,

    #[account(mut)]
    pub sender: Signer<'info>,

    #[account(mut, constraint = sender_token_account.owner == sender.key())]
    pub sender_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReleaseFunds<'info> {
    #[account(mut, seeds = [b"escrow", escrow_order.sender.as_ref()], bump = escrow_order.bump)]
    pub escrow_order: Account<'info, EscrowOrder>,

    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,

    pub agent: Signer<'info>,

    #[account(mut, constraint = agent_token_account.owner == agent.key())]
    pub agent_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelOrder<'info> {
    #[account(mut, seeds = [b"escrow", escrow_order.sender.as_ref()], bump = escrow_order.bump, has_one = sender)]
    pub escrow_order: Account<'info, EscrowOrder>,

    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,

    pub sender: Signer<'info>,

    #[account(mut, constraint = sender_token_account.owner == sender.key())]
    pub sender_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct EscrowOrder {
    pub sender: Pubkey,
    pub amount: u64,
    pub fee_bps: u64,
    pub recipient_phone_hash: [u8; 32],
    pub withdraw_code_hash: [u8; 32],
    pub status: OrderStatus,
    pub created_at: i64,
    pub released_at: Option<i64>,
    pub agent: Option<Pubkey>,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum OrderStatus {
    Locked,
    Released,
    Cancelled,
}

#[event]
pub struct FundsLocked {
    pub order: Pubkey,
    pub sender: Pubkey,
    pub amount: u64,
}

#[event]
pub struct FundsReleased {
    pub order: Pubkey,
    pub agent: Pubkey,
    pub amount: u64,
    pub fee: u64,
}

#[error_code]
pub enum KoyaError {
    #[msg("Les frais dépassent le maximum autorisé de 2%")]
    FeeTooHigh,
    #[msg("Montant invalide")]
    InvalidAmount,
    #[msg("Statut de l'ordre invalide")]
    InvalidStatus,
    #[msg("Code de retrait incorrect")]
    InvalidWithdrawCode,
    #[msg("Annulation trop tôt (attendre 24h)")]
    TooEarlyToCancel,
}
