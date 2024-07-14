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
    label: "Close whitelist",
    description:
      "Use this action to disallow users to register for your whitelist. Only usable by the sale creator.",
    title: "Close whitelist registration (vault version)",
    links: {
      actions: [
        {
          label: "Close whitelist",
          href: getUrlWithRequestOrigin(
            getActionQuery(actionUrls.vault.closeWhitelist, params),
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
      return jsonBadResult(
        `Missing parameter: ${paramsResult.error.paramName}`
      );
    }

    const { saleName } = paramsResult.value;

    const body: ActionPostRequest = await req.json();
    const signer = new PublicKey(body.account);

    const { program, connection } = getVaultSaleProgram();

    const salePdaAddress = getVaultSaleStateAddress(saleName, program);
    const salePda = await program.account.whitelistSale.fetch(salePdaAddress);

    const instruction = await program.methods
      .updateSaleState(
        saleName,
        false,
        salePda.isSaleOpen
      )
      .accounts({ signer })
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
        message: `You have closed whitelist registration for sale named "${saleName}".`,
      },
    });

    return jsonResponseWithHeaders(payload);
  } catch (e) {
    return jsonBadResult("An unknown error occured");
  }
};
