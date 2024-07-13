use crate::{
    constants::{PDA_SEED_ALLOWANCE, PDA_SEED_SALE},
    error::WhitelistError,
    state::{Allowance, WhitelistSale},
};
use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use anchor_safe_math::SafeMath;
use anchor_spl::{
    associated_token::{AssociatedToken, ID as ASSOCIATED_TOKEN_PROGRAM_ID},
    token::{transfer_checked, Mint, Token, TokenAccount, TransferChecked, ID as TOKEN_PROGRAM_ID},
};

#[derive(Accounts)]
#[instruction(sale_name: String)]
pub struct BuyTokens<'info> {
    #[account(
        mut,
        seeds=[PDA_SEED_SALE.as_ref(), sale_name.as_bytes()],
        bump
    )]
    pub sale: Account<'info, WhitelistSale>,

    #[account(
        mut,
        seeds=[PDA_SEED_ALLOWANCE.as_ref(), sale_name.as_bytes(), signer.key().as_ref()],
        bump
    )]
    pub allowance: Account<'info, Allowance>,

    #[account(
        mut,
        associated_token::mint=token_mint,
        associated_token::authority=sale
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint=token_mint,
        associated_token::authority=signer,
    )]
    pub signer_ata: Account<'info, TokenAccount>,

    #[account()]
    pub token_mint: Account<'info, Mint>,

    #[account(address=TOKEN_PROGRAM_ID)]
    pub token_program: Program<'info, Token>,

    #[account(address=ASSOCIATED_TOKEN_PROGRAM_ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
}

pub fn handle_buy_tokens(ctx: Context<BuyTokens>, sale_name: String, amount: u64) -> Result<()> {
    let sale = &ctx.accounts.sale;

    require!(sale.is_sale_open, WhitelistError::SaleClosed);

    let allowance = &mut ctx.accounts.allowance;

    // Ensure buyer hasn't gone over their allowance
    allowance.tokens_bought = allowance.tokens_bought.safe_add(amount)?;
    require!(
        allowance.tokens_bought <= sale.max_tokens_per_buyer,
        WhitelistError::AllowanceExceeded
    );

    // First transfer SOL to vault
    let transfer_to_vault_amount = sale.lamports_per_token.safe_mul(amount)?;

    let transfer_to_vault_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        Transfer {
            from: ctx.accounts.signer.to_account_info(),
            to: sale.to_account_info(),
        },
    );

    transfer(transfer_to_vault_context, transfer_to_vault_amount)?;

    // Then transfer tokens to signer's ATA
    let transfer_to_buyer = TransferChecked {
        from: ctx.accounts.vault_ata.to_account_info(),
        to: ctx.accounts.signer_ata.to_account_info(),
        authority: ctx.accounts.sale.to_account_info(),
        mint: ctx.accounts.token_mint.to_account_info(),
    };

    let seeds = [PDA_SEED_SALE.as_ref(), sale_name.as_bytes(), &[ctx.bumps.sale]];
    let signer_seeds = &[&seeds[..]];

    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        transfer_to_buyer,
    ).with_signer(signer_seeds);

    let amount_with_decimals: u64 =
        amount.safe_mul(10_u64.safe_pow(ctx.accounts.token_mint.decimals.into())?)?;

    match transfer_checked(
        cpi_ctx,
        amount_with_decimals,
        ctx.accounts.token_mint.decimals,
    ) {
        Ok(_) => Ok(()),
        Err(e) => Err(e),
    }
}
