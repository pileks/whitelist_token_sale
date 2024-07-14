import { getMintSaleStateAddress } from "@/programs/accounts";
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
import {
  ActionGetResponse,
  ActionPostRequest,
  createPostResponse,
} from "@solana/actions";
import { PublicKey, Transaction } from "@solana/web3.js";

const closeSaleMintActionParamsDefinition = {
  saleName: { label: "Sale name", required: true },
};

const params = getActionParametersFromDefinition(
  closeSaleMintActionParamsDefinition
);

export const GET = (req: Request) => {
  const payload: ActionGetResponse = {
    icon: getUrlWithRequestOrigin("/action-icon.svg", req),
    label: "Close sale (mint)",
    description:
      "Use this action to disallow whitelisted users to buy your sale's tokens. Only usable by the sale creator.",
    title: "Close sale (mint version)",
    links: {
      actions: [
        {
          label: "Close sale (mint)",
          href: getUrlWithRequestOrigin(
            getActionQuery(actionUrls.mint.closeSale, params),
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
      closeSaleMintActionParamsDefinition
    );

    if (!paramsResult.ok) {
      return jsonBadResult(
        `Missing parameter: ${paramsResult.error.paramName}`
      );
    }

    const { saleName } = paramsResult.value;

    const body: ActionPostRequest = await req.json();
    const signer = new PublicKey(body.account);

    const { program, connection } = getMintSaleProgram();

    const salePdaAddress = getMintSaleStateAddress(saleName, program);
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
        message: `Close sale named "${saleName}" to whitelisted users.`,
      },
    });

    return jsonResponseWithHeaders(payload);
  } catch (e) {
    return jsonBadResult("An unknown error occured");
  }
};
