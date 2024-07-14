import { WhitelistTokenSaleMint } from "./types/whitelist_token_sale_mint";
import { WhitelistTokenSaleVault } from "./types/whitelist_token_sale_vault";
import mintIdl from "./idl/whitelist_token_sale_mint.json";
import vaultIdl from "./idl/whitelist_token_sale_vault.json";
import { Program, web3 } from "@coral-xyz/anchor";

export function getMintProgram() {
  const connection = new web3.Connection(web3.clusterApiUrl("devnet"));

  const program = new Program<WhitelistTokenSaleMint>(
    mintIdl as WhitelistTokenSaleMint,
    {
      connection,
    }
  );

  return { program, connection };
}

export function getVaultProgram() {
  const connection = new web3.Connection(web3.clusterApiUrl("devnet"));

  const program = new Program<WhitelistTokenSaleVault>(
    vaultIdl as WhitelistTokenSaleVault,
    {
      connection,
    }
  );

  return { program, connection };
}