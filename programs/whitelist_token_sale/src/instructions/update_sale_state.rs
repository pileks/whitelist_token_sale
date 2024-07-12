use crate::{constants::PDA_SEED_WHITELIST_SALE, error::WhitelistError, state::WhitelistSale};
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(sale_name: String)]
pub struct UpdateSaleState<'info> {
    #[account(
        mut,
        seeds=[PDA_SEED_WHITELIST_SALE.as_ref(), sale_name.as_bytes()],
        bump
    )]
    pub sale: Account<'info, WhitelistSale>,

    #[account(mut)]
    pub signer: Signer<'info>,
}

pub fn handle_update_sale_state(
    ctx: Context<UpdateSaleState>,
    is_registration_open: bool,
    is_sale_open: bool,
) -> Result<()> {
    let sale = &mut ctx.accounts.sale;
    let signer = &ctx.accounts.signer;

    require!(
        sale.owner.eq(signer.key),
        WhitelistError::OnlyOwner
    );

    sale.is_registration_open = is_registration_open;
    sale.is_sale_open = is_sale_open;

    Ok(())
}
