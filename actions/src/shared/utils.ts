import { ActionParameter, ACTIONS_CORS_HEADERS } from "@solana/actions";
import { Result, resultErr, resultOk } from "./result";

export function getUrlWithRequestOrigin(url: string, req: Request) {
  return new URL(url, new URL(req.url).origin).toString();
}

export function getActionQuery(route: string, params: ActionParameter[]) {
  if (!params.length) {
    return route;
  }

  return route + "?" + params.map((p) => `${p.name}={${p.name}}`).join("&");
}

// export async function unknownExceptionHandler(
//   fn: () => Promise<Response | undefined>
// ) {
//   try {
//     return await fn();
//   } catch (e) {
//     return Response.json("An unknown error occured", { status: 400 });
//   }
// }

export function jsonResponseWithHeaders(data: any) {
  return Response.json(data, { headers: ACTIONS_CORS_HEADERS });
}

export function getDialToUrlForAction(url: string) {
  let cluster = "";

  if(process.env.NEXT_PUBLIC_CLUSTER != "mainnet-beta") {
    cluster = process.env.NEXT_PUBLIC_CLUSTER;
  }

  return `https://dial.to/${cluster}?action=solana-action:${url}`
}

export function parseTextBoolean(input: string): Result<boolean, string> {
  const yesValues = ["yes", "y", "true", "1"];
  const noValues = ["no", "n", "false", "0"];

  if(yesValues.some(v => input.toLowerCase() === v.toLowerCase())) {
    return resultOk(true);
  } else if(noValues.some(v => input.toLowerCase() === v.toLowerCase())) {
    return resultOk(false);
  }

  return resultErr("Could not parse yes/no value from input.");
}

export function jsonBadResult(message: string) {
  return Response.json(
    {
      message: message,
    },
    {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    }
  );
}