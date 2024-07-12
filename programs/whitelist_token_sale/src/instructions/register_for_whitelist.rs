use crate::{
    constants::{PDA_SEED_WHITELIST_ALLOWANCE, PDA_SEED_WHITELIST_SALE},
    error::WhitelistError,
    state::{WhitelistAllowance, WhitelistSale},
};
use anchor_lang::prelude::*;
use std::mem::size_of;

#[derive(Accounts)]
#[instruction(sale_name: String)]
pub struct RegisterForWhitelist<'info> {
    #[account(
        seeds=[PDA_SEED_WHITELIST_SALE.as_ref(), sale_name.as_bytes()],
        bump
    )]
    pub sale: Account<'info, WhitelistSale>,

    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer=signer,
        space=size_of::<WhitelistAllowance>() + 8,
        seeds=[PDA_SEED_WHITELIST_ALLOWANCE.as_ref(), sale_name.as_bytes(), signer.key().as_ref()],
        bump
    )]
    pub allowance: Account<'info, WhitelistAllowance>,

    pub system_program: Program<'info, System>,
}

pub fn handle_register_for_whitelist(
    ctx: Context<RegisterForWhitelist>,
    _sale_name: String,
) -> Result<()> {
    let sale = &ctx.accounts.sale;

    require!(
        sale.is_registration_open,
        WhitelistError::WhitelistRegistrationClosed
    );

    let allowance = &mut ctx.accounts.allowance;

    allowance.tokens_bought = 0;

    Ok(())
}
