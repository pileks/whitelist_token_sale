use crate::{constants::PDA_SEED_SALE, error::WhitelistError, state::WhitelistSale};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::{AssociatedToken, ID as ASSOCIATED_TOKEN_PROGRAM_ID},
    token::{set_authority, Mint, SetAuthority, Token, ID as TOKEN_PROGRAM_ID},
};

#[derive(Accounts)]
#[instruction(sale_name: String)]
pub struct CloseWhitelistSale<'info> {
    #[account(
        mut,
        close=signer,
        seeds=[PDA_SEED_SALE.as_ref(), sale_name.as_bytes()],
        bump
    )]
    pub sale: Account<'info, WhitelistSale>,

    #[account(mut)]
    pub token_mint: Account<'info, Mint>,

    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(address=TOKEN_PROGRAM_ID)]
    pub token_program: Program<'info, Token>,

    #[account(address=ASSOCIATED_TOKEN_PROGRAM_ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
}

pub fn handle_close_whitelist_sale(
    ctx: Context<CloseWhitelistSale>,
    _sale_name: String,
) -> Result<()> {
    require!(
        ctx.accounts.signer.key().eq(&ctx.accounts.sale.owner.key()),
        WhitelistError::OnlyOwner
    );

    // Set sale owner's account as mint authority
    let set_mint_authority = SetAuthority {
        account_or_mint: ctx.accounts.token_mint.to_account_info(),
        current_authority: ctx.accounts.sale.to_account_info(),
    };

    let seeds = [
        PDA_SEED_SALE.as_ref(),
        _sale_name.as_bytes(),
        &[ctx.bumps.sale],
    ];
    let signer_seeds = &[&seeds[..]];

    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        set_mint_authority,
    )
    .with_signer(signer_seeds);

    match set_authority(
        cpi_ctx,
        anchor_spl::token::spl_token::instruction::AuthorityType::MintTokens,
        Some(ctx.accounts.signer.key()),
    ) {
        Ok(_) => Ok(()),
        Err(e) => Err(e),
    }
}
