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
    label: "Close sale",
    description:
      "Use this action to disallow whitelisted users to buy your sale's tokens. Only usable by the sale creator.",
    title: "Close sale (vault version)",
    links: {
      actions: [
        {
          label: "Close sale",
          href: getUrlWithRequestOrigin(
            getActionQuery(actionUrls.vault.closeSale, params),
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
        salePda.isSaleOpen,
        false
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
        message: `You have closed the sale named "${saleName}" to whitelisted users.`,
      },
    });

    return jsonResponseWithHeaders(payload);
  } catch (e) {
    return jsonBadResult("An unknown error occured");
  }
};