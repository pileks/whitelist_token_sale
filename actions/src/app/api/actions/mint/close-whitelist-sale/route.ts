import { getMintSaleStateAddress } from "@/programs/accounts";
import { getMintSaleProgram } from "@/programs/programs";
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

const closeMintActionParamsDefinition = {
  saleName: { label: "Sale name", required: true },
};

const params = getActionParametersFromDefinition(
  closeMintActionParamsDefinition
);

export const GET = (req: Request) => {
  const payload: ActionGetResponse = {
    icon: getActionImageUrl(req),
    label: "Close whitelist sale (mint)",
    description:
      "Use this action to close the whitelist token sale you created. You will then receive mint authority back from the program.",
    title: "Close whitelist sale (mint version)",
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
      closeMintActionParamsDefinition
    );

    if (!paramsResult.ok) {
      return jsonBadResult(`Missing parameter: ${paramsResult.error.paramName}`);
    }

    const { saleName } =
      paramsResult.value;

    const body: ActionPostRequest = await req.json();
    const signer = new PublicKey(body.account);

    const { program, connection } = getMintSaleProgram();

    const salePdaAddress = getMintSaleStateAddress(saleName, program);
    const salePda = await program.account.whitelistSale.fetch(salePdaAddress);

    const mint = salePda.tokenMint;
    
    const instruction = await program.methods
      .closeWhitelistSale(
        saleName
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
        message: `Close the whitelist token sale named ${saleName} you created and receive mint authority back from the program.`,
      },
    });

    return jsonResponseWithHeaders(payload);
  } catch (e) {
    return Response.json("An unknown error occured", { status: 400 });
  }
};
