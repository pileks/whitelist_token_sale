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
  parseTextBoolean,
} from "@/shared/utils";
import {
  ActionGetResponse,
  ActionPostRequest,
  createPostResponse,
} from "@solana/actions";
import { PublicKey, Transaction } from "@solana/web3.js";

const createMintActionParamsDefinition = {
  saleName: { label: "Sale name", required: true },
  isRegistrationOpen: { label: "Registration open? (yes/no)", required: true },
  isSaleOpen: { label: "Sale open? (yes/no)", required: true },
};

const params = getActionParametersFromDefinition(
  createMintActionParamsDefinition
);

export const GET = (req: Request) => {
  const payload: ActionGetResponse = {
    icon: getActionImageUrl(req),
    label: "Update sale state",
    description:
      "Use this action to set the status of a whitelist token sale. You can set both whether users can register for the whitelist, and whether they can start buying the tokens. Only usable by the sale creator.",
    title: "Create whitelist sale (mint version)",
    links: {
      actions: [
        {
          label: "Create whitelist sale",
          href: getUrlWithRequestOrigin(
            getActionQuery(actionUrls.mint.updateSaleState, params),
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
      return jsonBadResult(
        `Missing parameter: ${paramsResult.error.paramName}`
      );
    }

    const { saleName, isRegistrationOpen, isSaleOpen } = paramsResult.value;

    const registrationOpenResult = parseTextBoolean(isRegistrationOpen);

    if (!registrationOpenResult.ok) {
      return jsonBadResult(
        `"Registration open?" could not be parsed. Use "yes" or "no.`
      );
    }

    const saleOpenResult = parseTextBoolean(isSaleOpen);

    if (!saleOpenResult.ok) {
      return jsonBadResult(
        `"Sale open?" could not be parsed. Use "yes" or "no.`
      );
    }

    const body: ActionPostRequest = await req.json();
    const signer = new PublicKey(body.account);

    const { program, connection } = getMintSaleProgram();

    const instruction = await program.methods
      .updateSaleState(
        saleName,
        registrationOpenResult.value,
        saleOpenResult.value
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
        message: `Set the status of whitelist sale named "${saleName}". Its whitelist is ${
          registrationOpenResult.value ? "open" : "closed"
        } and its sale is ${saleOpenResult.value ? "open" : "closed"}.`,
      },
    });

    return jsonResponseWithHeaders(payload);
  } catch (e) {
    return jsonBadResult("An unknown error occured");
  }
};
