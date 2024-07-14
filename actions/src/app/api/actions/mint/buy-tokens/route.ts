import { getMintSaleStateAddress } from "@/programs/accounts";
import { getMintProgram } from "@/programs/programs";
import {
  getActionParametersFromDefinition,
  getActionParametersFromRequest,
} from "@/shared/action-parameters";
import { actionUrls } from "@/shared/actionUrls";
import {
  getActionQuery,
  getUrlWithRequestOrigin,
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

const buyTokensMintActionParamsDefinition = {
  saleName: { label: "Sale name", required: true },
  amount: { label: "Amount of tokens to buy", required: true },
};

const params = getActionParametersFromDefinition(
  buyTokensMintActionParamsDefinition
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
      buyTokensMintActionParamsDefinition
    );

    if (!paramsResult.ok) {
      return Response.json(
        {
          message: `Missing parameter: ${paramsResult.error.paramName}`,
        },
        {
          status: 400,
          headers: ACTIONS_CORS_HEADERS,
        }
      );
    }

    const { amount, saleName } = paramsResult.value;

    const body: ActionPostRequest = await req.json();
    const signer = new PublicKey(body.account);

    const { program, connection } = getMintProgram();

    const salePdaAddress = getMintSaleStateAddress(saleName, program);
    const salePda = await program.account.whitelistSale.fetch(salePdaAddress);

    const mint = salePda.tokenMint;

    const instruction = await program.methods
      .buyTokens(saleName, new BN(amount))
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
        message: `Create a whitelist sale with token mint ${mint}. This will transfer mint authority to the program until the sale is closed.`,
      },
    });

    return jsonResponseWithHeaders(payload);
  } catch (e) {
    return Response.json("An unknown error occured", { status: 400 });
  }
};
