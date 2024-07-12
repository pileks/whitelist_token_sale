use anchor_lang::prelude::*;

#[error_code]
pub enum WhitelistError {
    #[msg("Only the sale owner can perform this action")]
    OnlyOwner
}
