import { ActionParameter, ACTIONS_CORS_HEADERS } from "@solana/actions";

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