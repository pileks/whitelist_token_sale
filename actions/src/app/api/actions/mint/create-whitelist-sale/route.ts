import { getMintSaleProgram } from "@/programs/programs";
import {
  getActionParametersFromDefinition,
  getActionParametersFromRequest,
} from "@/shared/action-parameters";
import { actionUrls } from "@/shared/actionUrls";
import {
  getActionQuery,
  getUrlWithRequestOrigin,
  jsonBadResult,
  jsonResponseWithHeaders,
} from "@/shared/utils";
import { BN } from "@coral-xyz/anchor";
import {
  ActionGetResponse,
  ActionPostRequest,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
} from "@solana/actions";
import { PublicKey, Transaction } from "@solana/web3.js";

const createMintActionParamsDefinition = {
  mint: { label: "Token mint", required: true },
  saleName: { label: "Sale name", required: true },
  lamportsPerToken: { label: "Price of 1 token in lamports", required: true },
  maxTokensPerBuyer: { label: "Maximum tokens per buyer", required: true },
  maxBuyers: { label: "Maximum number of buyers", required: true },
};

const params = getActionParametersFromDefinition(
  createMintActionParamsDefinition
);

export const GET = (req: Request) => {
  const payload: ActionGetResponse = {
    icon: getUrlWithRequestOrigin("/action-icon.svg", req),
    label: "Create whitelist sale (mint)",
    description:
      "Use this action to create a whitelist token sale in which the program will have mint authority until the sale is closed.",
    title: "Create whitelist sale (mint version)",
    links: {
      actions: [
        {
          label: "Create whitelist sale (mint)",
          href: getUrlWithRequestOrigin(
            getActionQuery(actionUrls.mint.createWhitelist, params),
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
      createMintActionParamsDefinition
    );

    if (!paramsResult.ok) {
      return jsonBadResult(`Missing parameter: ${paramsResult.error.paramName}`);
    }

    const { mint, lamportsPerToken, maxBuyers, maxTokensPerBuyer, saleName } =
      paramsResult.value;

    const body: ActionPostRequest = await req.json();
    const signer = new PublicKey(body.account);
    const mintAddr = new PublicKey(mint);

    const { program, connection } = getMintSaleProgram();

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
        message: `Create a whitelist sale with token mint ${mint}. This will transfer mint authority to the program until the sale is closed.`,
      },
    });

    return jsonResponseWithHeaders(payload);
  } catch (e) {
    return Response.json("An unknown error occured", { status: 400 });
  }
};
