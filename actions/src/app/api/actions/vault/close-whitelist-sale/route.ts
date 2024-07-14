import { getVaultSaleStateAddress } from "@/programs/accounts";
import { getVaultSaleProgram } from "@/programs/programs";
import {
  getActionParametersFromDefinition,
  getActionParametersFromRequest,
} from "@/shared/action-parameters";
import { actionUrls } from "@/shared/actionUrls";
import {
  getActionImageUrl,
  getActionQuery,
  getUrlWithRequestOrigin,
  jsonBadResult,
  jsonResponseWithHeaders,
} from "@/shared/utils";
import {
  ActionGetResponse,
  ActionPostRequest,
  createPostResponse,
} from "@solana/actions";
import { PublicKey, Transaction } from "@solana/web3.js";

const actionParamsDefinition = {
  saleName: { label: "Sale name", required: true },
};

const params = getActionParametersFromDefinition(
  actionParamsDefinition
);

export const GET = (req: Request) => {
  const payload: ActionGetResponse = {
    icon: getActionImageUrl(req),
    label: "Close whitelist sale",
    description:
      "Use this action to close the whitelist token sale you created. You will then receive the remaining tokens from the vault, alognside the vault's earned SOL.",
    title: "Close whitelist sale (vault version)",
    links: {
      actions: [
        {
          label: "Close whitelist sale",
          href: getUrlWithRequestOrigin(
            getActionQuery(actionUrls.vault.closeWhitelistSale, params),
            req
          ),
          parameters: params,
        },
      ],
    },
  };

  return jsonResponseWithHeaders(payload);
};

export const OPTIONS = GET;

export const POST = async (req: Request) => {
  try {
    const paramsResult = getActionParametersFromRequest(
      req,
      actionParamsDefinition
    );

    if (!paramsResult.ok) {
      return jsonBadResult(`Missing parameter: ${paramsResult.error.paramName}`);
    }

    const { saleName } =
      paramsResult.value;

    const body: ActionPostRequest = await req.json();
    const signer = new PublicKey(body.account);

    const { program, connection } = getVaultSaleProgram();

    const salePdaAddress = getVaultSaleStateAddress(saleName, program);
    const salePda = await program.account.whitelistSale.fetch(salePdaAddress);

    const mint = salePda.tokenMint;
    
    const instruction = await program.methods
      .closeWhitelistSale(
        saleName,
      )
      .accounts({ signer, tokenMint: mint })
      .instruction();

    const transaction = new Transaction();

    transaction.add(instruction);
    transaction.feePayer = signer;
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

    const payload = await createPostResponse({
      fields: {
        transaction,
        message: `Whitelist token sale named ${saleName} successfully closed! You have received the remainig vaulted tokens and all earned SOL.`,
      },
    });

    return jsonResponseWithHeaders(payload);
  } catch (e) {
    return Response.json("An unknown error occured", { status: 400 });
  }
};
