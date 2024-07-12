pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use instructions::*;

declare_id!("EfRJk5TyimgnGU6PPikpfSByVXTj7MkdKMtezreYfwCZ");

#[program]
pub mod whitelist_token_sale {
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

    pub fn register_for_whitelist(ctx: Context<AddToWhitelist>) -> Result<()> {
        register_for_whitelist::handle_register_for_whitelist(ctx)
    }
}
