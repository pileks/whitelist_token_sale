use crate::{constants::PDA_SEED_SALE, error::WhitelistError, state::WhitelistSale};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::{AssociatedToken, ID as ASSOCIATED_TOKEN_PROGRAM_ID},
    token::{transfer_checked, Mint, Token, TokenAccount, TransferChecked, ID as TOKEN_PROGRAM_ID},
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

    #[account(
        mut,
        associated_token::mint=token_mint,
        associated_token::authority=sale
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(address=TOKEN_PROGRAM_ID)]
    pub token_program: Program<'info, Token>,

    #[account(address=ASSOCIATED_TOKEN_PROGRAM_ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,

    #[account()]
    pub token_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint=token_mint,
        associated_token::authority=signer
    )]
    pub signer_ata: Account<'info, TokenAccount>,

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

    let transfer_to_buyer = TransferChecked {
        from: ctx.accounts.vault_ata.to_account_info(),
        to: ctx.accounts.signer_ata.to_account_info(),
        authority: ctx.accounts.sale.to_account_info(),
        mint: ctx.accounts.token_mint.to_account_info(),
    };

    let seeds = [
        PDA_SEED_SALE.as_ref(),
        _sale_name.as_bytes(),
        &[ctx.bumps.sale],
    ];
    let signer_seeds = &[&seeds[..]];

    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        transfer_to_buyer,
    )
    .with_signer(signer_seeds);

    match transfer_checked(
        cpi_ctx,
        ctx.accounts.vault_ata.amount,
        ctx.accounts.token_mint.decimals,
    ) {
        Ok(_) => Ok(()),
        Err(e) => Err(e),
    }
}
