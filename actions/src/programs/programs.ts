import { WhitelistTokenSaleMint } from "./types/whitelist_token_sale_mint";
import { WhitelistTokenSaleVault } from "./types/whitelist_token_sale_vault";
import mintIdl from "./idl/whitelist_token_sale_mint.json";
import vaultIdl from "./idl/whitelist_token_sale_vault.json";
import { Program, web3 } from "@coral-xyz/anchor";
import { Cluster } from "@solana/web3.js";

export function getMintSaleProgram() {
  const connection = new web3.Connection(web3.clusterApiUrl(process.env.NEXT_PUBLIC_CLUSTER as Cluster));

  const program = new Program<WhitelistTokenSaleMint>(
    mintIdl as WhitelistTokenSaleMint,
    {
      connection,
    }
  );

  return { program, connection };
}

export function getVaultSaleProgram() {
  const connection = new web3.Connection(web3.clusterApiUrl(process.env.NEXT_PUBLIC_CLUSTER as Cluster));

  const program = new Program<WhitelistTokenSaleVault>(
    vaultIdl as WhitelistTokenSaleVault,
    {
      connection,
    }
  );

  return { program, connection };
}