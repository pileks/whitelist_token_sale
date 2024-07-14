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
import { BN } from "@coral-xyz/anchor";
import {
  ActionGetResponse,
  ActionPostRequest,
  createPostResponse,
} from "@solana/actions";
import { PublicKey, Transaction } from "@solana/web3.js";

const actionParamsDefinition = {
  mint: { label: "Token mint", required: true },
  saleName: { label: "Sale name", required: true },
  lamportsPerToken: { label: "Price of 1 token in lamports", required: true },
  maxTokensPerBuyer: { label: "Maximum tokens per buyer", required: true },
  maxBuyers: { label: "Maximum number of buyers", required: true },
};

const params = getActionParametersFromDefinition(
  actionParamsDefinition
);

export const GET = (req: Request) => {
  const payload: ActionGetResponse = {
    icon: getActionImageUrl(req),
    label: "Create whitelist sale",
    description:
      "Use this action to create a whitelist token sale in which the program will keep the tokens you're selling inside a vault until the sale is closed.",
    title: "Create whitelist sale (vault version)",
    links: {
      actions: [
        {
          label: "Create whitelist sale",
          href: getUrlWithRequestOrigin(
            getActionQuery(actionUrls.vault.createWhitelist, params),
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

    const { mint, lamportsPerToken, maxBuyers, maxTokensPerBuyer, saleName } =
      paramsResult.value;

    const body: ActionPostRequest = await req.json();
    const signer = new PublicKey(body.account);
    const mintAddr = new PublicKey(mint);

    const { program, connection } = getVaultSaleProgram();

    const instruction = await program.methods
      .createWhitelistSale(
        saleName,
        new BN(lamportsPerToken),
        new BN(maxTokensPerBuyer),
        new BN(maxBuyers)
      )
      .accounts({ signer, tokenMint: mintAddr })
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
        message: `Created a whitelist sale named "${saleName}" with token mint ${mint}. Tokens for sale are kept inside the program's vault until the sale is closed.`,
      },
    });

    return jsonResponseWithHeaders(payload);
  } catch (e) {
    return Response.json("An unknown error occured", { status: 400 });
  }
};
