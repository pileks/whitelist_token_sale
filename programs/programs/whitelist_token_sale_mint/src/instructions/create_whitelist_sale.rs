use crate::{constants::PDA_SEED_SALE, state::WhitelistSale};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::{AssociatedToken, ID as ASSOCIATED_TOKEN_PROGRAM_ID},
    token::{set_authority, Mint, SetAuthority, Token, ID as TOKEN_PROGRAM_ID},
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

    #[account(mut)]
    pub token_mint: Account<'info, Mint>,

    #[account(address=TOKEN_PROGRAM_ID)]
    pub token_program: Program<'info, Token>,

    #[account(address=ASSOCIATED_TOKEN_PROGRAM_ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
}

pub fn handle_create_whitelist_sale(
    ctx: Context<CreateWhitelistSale>,
    _sale_name: String,
    lamports_per_token: u64,
    max_tokens_per_buyer: u64,
    max_buyers: u64,
) -> Result<()> {
    // Set sale account fields
    let sale = &mut ctx.accounts.sale;

    sale.token_mint = ctx.accounts.token_mint.key();
    sale.owner = ctx.accounts.signer.key.key();
    sale.lamports_per_token = lamports_per_token;
    sale.max_tokens_per_buyer = max_tokens_per_buyer;
    sale.max_buyers = max_buyers;
    sale.is_registration_open = true;
    sale.is_sale_open = false;
    sale.num_buyers = 0;

    // Set sale PDA as mint authority
    let set_mint_authority = SetAuthority {
        account_or_mint: ctx.accounts.token_mint.to_account_info(),
        current_authority: ctx.accounts.signer.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        set_mint_authority,
    );

    match set_authority(
        cpi_ctx,
        anchor_spl::token::spl_token::instruction::AuthorityType::MintTokens,
        Some(ctx.accounts.sale.key()),
    ) {
        Ok(_) => Ok(()),
        Err(e) => Err(e),
    }
}
