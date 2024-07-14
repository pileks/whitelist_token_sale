import { Button } from "@/components/ui/button";
import { actionUrls } from "@/shared/actionUrls";
import { getDialToUrlForAction } from "@/shared/utils";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center py-24 bg-gray-50 gap-12 text-gray-900">
      <div className="flex flex-row items-center gap-8">
        <Image
          src="/solana-olympics-gray.svg"
          alt="Vercel Logo"
          className="w-40"
          width={160}
          height={160}
          priority
        />
        <div className="flex flex-col">
          <div className="text-lg font-semibold">
            Jure&apos;s submission
          </div>
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight">
            Whitelist token sale
          </h1>
        </div>
      </div>
      <div className="flex flex-row gap-4">
        <div className="flex flex-col gap-6">
          <h2 className="text-center scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            Mint version
          </h2>

          <div className="flex flex-col gap-4">
            <h3 className="text-center scroll-m-20 text-2xl font-semibold tracking-tight">
              Owner controls
            </h3>
            <Button asChild>
              <Link
                href={getDialToUrlForAction(
                  process.env.NEXT_PUBLIC_WEBSITE_URL +
                    actionUrls.mint.createWhitelist
                )}
              >
                Create whitelist sale
              </Link>
            </Button>
            <Button asChild>
              <Link
                href={getDialToUrlForAction(
                  process.env.NEXT_PUBLIC_WEBSITE_URL +
                    actionUrls.mint.closeWhitelistSale
                )}
              >
                Close whitelist sale
              </Link>
            </Button>
            <Button asChild>
              <Link
                href={getDialToUrlForAction(
                  process.env.NEXT_PUBLIC_WEBSITE_URL +
                    actionUrls.mint.openWhitelist
                )}
              >
                Open whitelist registration
              </Link>
            </Button>
            <Button asChild>
              <Link
                href={getDialToUrlForAction(
                  process.env.NEXT_PUBLIC_WEBSITE_URL +
                    actionUrls.mint.closeWhitelist
                )}
              >
                Close whitelist registration
              </Link>
            </Button>
            <Button asChild>
              <Link
                href={getDialToUrlForAction(
                  process.env.NEXT_PUBLIC_WEBSITE_URL + actionUrls.mint.openSale
                )}
              >
                Open purchasing
              </Link>
            </Button>
            <Button asChild>
              <Link
                href={getDialToUrlForAction(
                  process.env.NEXT_PUBLIC_WEBSITE_URL + actionUrls.mint.closeSale
                )}
              >
                Close purchasing
              </Link>
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-center scroll-m-20 text-2xl font-semibold tracking-tight">
              User controls
            </h3>
            <Button asChild>
              <Link
                href={getDialToUrlForAction(
                  process.env.NEXT_PUBLIC_WEBSITE_URL +
                    actionUrls.mint.registerForWhitelist
                )}
              >
                Register for whitelist
              </Link>
            </Button>
            <Button asChild>
              <Link
                href={getDialToUrlForAction(
                  process.env.NEXT_PUBLIC_WEBSITE_URL + actionUrls.mint.buyTokens
                )}
              >
                Buy tokens
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
