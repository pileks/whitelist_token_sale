use crate::{
    constants::{PDA_SEED_ALLOWANCE, PDA_SEED_SALE},
    error::WhitelistError,
    state::{Allowance, WhitelistSale},
};
use anchor_lang::prelude::*;
use std::mem::size_of;

#[derive(Accounts)]
#[instruction(sale_name: String)]
pub struct RegisterForWhitelist<'info> {
    #[account(
        mut,
        seeds=[PDA_SEED_SALE.as_ref(), sale_name.as_bytes()],
        bump
    )]
    pub sale: Account<'info, WhitelistSale>,

    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer=signer,
        space=size_of::<Allowance>() + 8,
        seeds=[PDA_SEED_ALLOWANCE.as_ref(), sale_name.as_bytes(), signer.key().as_ref()],
        bump
    )]
    pub allowance: Account<'info, Allowance>,

    pub system_program: Program<'info, System>,
}

pub fn handle_register_for_whitelist(
    ctx: Context<RegisterForWhitelist>,
    _sale_name: String,
) -> Result<()> {
    let sale = &mut ctx.accounts.sale;

    require!(
        sale.is_registration_open,
        WhitelistError::WhitelistRegistrationClosed
    );

    require!(
        sale.num_buyers < sale.max_buyers,
        WhitelistError::BuyerLimitReached
    );

    let allowance = &mut ctx.accounts.allowance;

    allowance.tokens_bought = 0;

    sale.num_buyers += 1;

    Ok(())
}
