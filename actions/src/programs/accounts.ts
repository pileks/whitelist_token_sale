import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export function getSaleStateAddress(name: string, program: Program) {
  const [address, _bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("sale"), Buffer.from(name)],
    program.programId
  );

  return address;
}

export function getAllowanceAddress(
  name: string,
  pubkey: PublicKey,
  program: Program
) {
  const [address, _bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("allowance"), Buffer.from(name), pubkey.toBytes()],
    program.programId
  );

  return address;
}
