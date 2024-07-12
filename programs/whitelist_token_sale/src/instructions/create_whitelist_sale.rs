use crate::{constants::PDA_SEED_SALE, state::WhitelistSale};
use anchor_lang::prelude::*;
use anchor_safe_math::SafeMath;
use anchor_spl::{
    associated_token::{AssociatedToken, ID as ASSOCIATED_TOKEN_PROGRAM_ID},
    token::{transfer_checked, Mint, Token, TokenAccount, TransferChecked, ID as TOKEN_PROGRAM_ID},
};
use std::mem::size_of;

#[derive(Accounts)]
#[instruction(sale_name: String)]
pub struct CreateWhitelistSale<'info> {
    #[account(
        init,
        payer=signer,
        space=size_of::<WhitelistSale>() + 8,
        seeds=[PDA_SEED_SALE.as_ref(), sale_name.as_bytes()],
        bump
    )]
    pub sale: Account<'info, WhitelistSale>,

    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(address=TOKEN_PROGRAM_ID)]
    pub token_program: Program<'info, Token>,

    #[account(address=ASSOCIATED_TOKEN_PROGRAM_ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,

    #[account()]
    pub token_mint: Account<'info, Mint>,

    #[account(
        init,
        payer=signer,
        associated_token::mint=token_mint,
        associated_token::authority=sale
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint=token_mint,
        associated_token::authority=signer
    )]
    pub signer_ata: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
}

pub fn handle_create_whitelist_sale(
    ctx: Context<CreateWhitelistSale>,
    _sale_name: String,
    lamports_per_token: u64,
    max_tokens_per_buyer: u64,
    max_buyers: u64,
) -> Result<()> {
    let sale_total_amount: u64 = max_buyers.safe_mul(max_tokens_per_buyer)?;

    // Set sale account fields
    let sale = &mut ctx.accounts.sale;

    sale.owner = ctx.accounts.signer.key.key();
    sale.lamports_per_token = lamports_per_token;
    sale.max_tokens_per_buyer = max_tokens_per_buyer;
    sale.max_buyers = max_buyers;
    sale.is_registration_open = true;
    sale.is_sale_open = false;

    // Transfer funds into vault
    let transfer_from_buyer = TransferChecked {
        from: ctx.accounts.signer_ata.to_account_info(),
        to: ctx.accounts.vault_ata.to_account_info(),
        authority: ctx.accounts.signer.to_account_info(),
        mint: ctx.accounts.token_mint.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();

    let cpi_ctx = CpiContext::new(cpi_program, transfer_from_buyer);

    // We treat token amounts as integers, therefore we have to multiply by 10^mint.decimals
    let amount: u64 =
        sale_total_amount.safe_mul(10_u64.safe_pow(ctx.accounts.token_mint.decimals.into())?)?;

    match transfer_checked(cpi_ctx, amount, ctx.accounts.token_mint.decimals) {
        Ok(_) => Ok(()),
        Err(e) => Err(e),
    }
}
