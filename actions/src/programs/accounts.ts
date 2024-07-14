import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { WhitelistTokenSaleMint } from "./types/whitelist_token_sale_mint";
import { WhitelistTokenSaleVault } from "./types/whitelist_token_sale_vault";

export function getMintSaleStateAddress(name: string, program: Program<WhitelistTokenSaleMint>) {
  const [address, _bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("sale"), Buffer.from(name)],
    program.programId
  );

  return address;
}

export function getVaultSaleStateAddress(name: string, program: Program<WhitelistTokenSaleVault>) {
  const [address, _bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("sale"), Buffer.from(name)],
    program.programId
  );

  return address;
}

export function getMintAllowanceAddress(
  name: string,
  pubkey: PublicKey,
  program: Program<WhitelistTokenSaleMint>
) {
  const [address, _bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("allowance"), Buffer.from(name), pubkey.toBytes()],
    program.programId
  );

  return address;
}
