use anchor_lang::prelude::*;

#[error_code]
pub enum WhitelistError {
    #[msg("Only the sale owner can perform this action")]
    OnlyOwner,
    #[msg("Whitelist registration is closed")]
    WhitelistRegistrationClosed,
    #[msg("Whiteliste sale is closed")]
    SaleClosed,
    #[msg("Token purchase is larger than remaining allowance")]
    AllowanceExceeded,
    #[msg("Mismatch in mints of provided accounts")]
    MintMismatch,
    #[msg("The maximum number of registered buyers has been reached")]
    BuyerLimitReached,
}
