import { actionUrls } from "@/shared/actionUrls";
import { getDialToUrlForAction } from "@/shared/utils";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between py-24">
      <Image
        src="/solana-olympics.svg"
        alt="Vercel Logo"
        className="w-40"
        width={160}
        height={160}
        priority
      />
      <div>
        <a className="text-white" href={getDialToUrlForAction(process.env.NEXT_PUBLIC_WEBSITE_URL + actionUrls.mint.createWhitelist)}>TEST</a>
      </div>
    </main>
  );
}
