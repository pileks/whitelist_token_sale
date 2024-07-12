use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct AddToWhitelist {}

pub fn handle_register_for_whitelist(_ctx: Context<AddToWhitelist>) -> Result<()> {
    Ok(())
}