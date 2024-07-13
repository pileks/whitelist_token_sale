pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use instructions::*;

declare_id!("EfRJk5TyimgnGU6PPikpfSByVXTj7MkdKMtezreYfwCZ");

#[program]
pub mod whitelist_token_sale_vault {
    use create_whitelist_sale::CreateWhitelistSale;

    use super::*;

    pub fn create_whitelist_sale(
        ctx: Context<CreateWhitelistSale>,
        sale_name: String,
        lamports_per_token: u64,
        max_tokens_per_buyer: u64,
        max_buyers: u64,
    ) -> Result<()> {
        create_whitelist_sale::handle_create_whitelist_sale(
            ctx,
            sale_name,
            lamports_per_token,
            max_tokens_per_buyer,
            max_buyers,
        )
    }

    pub fn update_sale_state(
        ctx: Context<UpdateSaleState>,
        sale_name: String,
        is_registration_open: bool,
        is_sale_open: bool,
    ) -> Result<()> {
        update_sale_state::handle_update_sale_state(
            ctx,
            sale_name,
            is_registration_open,
            is_sale_open,
        )
    }

    pub fn register_for_whitelist(
        ctx: Context<RegisterForWhitelist>,
        sale_name: String,
    ) -> Result<()> {
        register_for_whitelist::handle_register_for_whitelist(ctx, sale_name)
    }

    pub fn buy_tokens(ctx: Context<BuyTokens>, sale_name: String, amount: u64) -> Result<()> {
        buy_tokens::handle_buy_tokens(ctx, sale_name, amount)
    }

    pub fn close_whitelist_sale(ctx: Context<CloseWhitelistSale>, sale_name: String) -> Result<()> {
        close_whitelist_sale::handle_close_whitelist_sale(ctx, sale_name)
    }
}
