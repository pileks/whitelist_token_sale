import { actionUrls } from "@/shared/actionUrls";
import { getDialToUrlForAction } from "@/shared/utils";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center py-24">
      <Image
        src="/solana-olympics.svg"
        alt="Vercel Logo"
        className="w-40"
        width={160}
        height={160}
        priority
      />
      <div className="flex flex-col gap-4">
        <a className="text-white" href={getDialToUrlForAction(process.env.NEXT_PUBLIC_WEBSITE_URL + actionUrls.mint.createWhitelist)}>Create whitelist sale</a>
        <a className="text-white" href={getDialToUrlForAction(process.env.NEXT_PUBLIC_WEBSITE_URL + actionUrls.mint.openWhitelist)}>Open whitelist registration</a>
        <a className="text-white" href={getDialToUrlForAction(process.env.NEXT_PUBLIC_WEBSITE_URL + actionUrls.mint.closeWhitelist)}>Close whitelist registration</a>
        <a className="text-white" href={getDialToUrlForAction(process.env.NEXT_PUBLIC_WEBSITE_URL + actionUrls.mint.openSale)}>Open purchasing for sale</a>
        <a className="text-white" href={getDialToUrlForAction(process.env.NEXT_PUBLIC_WEBSITE_URL + actionUrls.mint.closeSale)}>Close purchasing for sale</a>
        <a className="text-white" href={getDialToUrlForAction(process.env.NEXT_PUBLIC_WEBSITE_URL + actionUrls.mint.registerForWhitelist)}>Register for whitelist</a>
        <a className="text-white" href={getDialToUrlForAction(process.env.NEXT_PUBLIC_WEBSITE_URL + actionUrls.mint.buyTokens)}>Buy tokens</a>
        <a className="text-white" href={getDialToUrlForAction(process.env.NEXT_PUBLIC_WEBSITE_URL + actionUrls.mint.closeWhitelistSale)}>Close whitelist sale</a>
      </div>
    </main>
  );
}
