use anchor_lang::prelude::*;

#[account]
pub struct WhitelistSale {
    pub token_mint: Pubkey,
    pub owner: Pubkey,
    pub lamports_per_token: u64,
    pub max_tokens_per_buyer: u64,
    pub max_buyers: u64,
    pub num_buyers: u64,
    pub is_registration_open: bool,
    pub is_sale_open: bool,
}

#[account]
pub struct Allowance {
    pub tokens_bought: u64,
}
