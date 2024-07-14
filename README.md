# Whitelist Token Sale

Jure's (Pileks) submission for the [Solana Talent Olympics - Whitelist-gated Token Sale](https://earn.superteam.fun/listings/hackathon/whitelist-gated-token-sale-st-talent-olympics/) task.

Blinks demo (devnet): [https://whitelist-sale.pileks.me/](https://whitelist-sale.pileks.me/)

## Prelude

This submission contains two programs with associated Actions and Blinks, which explain two approaches to creating a whitelist-gated token sale.

The reason for creating two programs instead of one is due to the following wording inside the scope of work:

> Develop a program using Native Rust or Anchor to allow users to participate in a whitelist-gated sale for a **new** token.

The word "**new**" stood out to me, as it could imply that maybe the token's supply isn't yet fully minted. Thus, we could, instead of creating a token vault, transfer mint authority to the program. This way we would mint tokens directly to a buyer instead of placing the tokens for sale inside of a vault.

As I have started with a vault version, I have decided to finish it, and then develop a **mint** version as well.

## Running the test suites locally

The programs are developed using Anchor `0.30.1`. Solana CLI version during development was `1.18.17`.

There are two test suites:
* `programs/tests/whitelist_token_sale_mint.ts` - Mint version
* `programs/tests/whitelist_token_sale_vault.ts` - Vault version

To run all test cases, run the following commands:
```sh
cd programs
yarn # Install dependencies to run Anchor tests
anchor build # Build the programs
anchor test # Run the test suites
```

## Running the front-end for the Actions and Blinks locally

The front-end (and back-end API calls) are written in Next.js. It can be found inside the `actions` directory.

To start the front-end, run the following commands:
```sh
cd actions
cp .env.template .env.local # Set up local environment variables
yarn # Install project dependencies
yarn dev # Start the Next.js dev server
```

## Programs

You can find both progams inside the `programs` directory.

Both programs are deployed to Solana devnet. They have the same interface, but are different in the way they handle the token sale.

### Mint version

Devnet program ID: `BiHgbT5QViTwpY658qAcgcTNuPYo2UZr2sjTwTF9JdbX` [(view on Solscan)](https://solscan.io/account/BiHgbT5QViTwpY658qAcgcTNuPYo2UZr2sjTwTF9JdbX?cluster=devnet)

The mint version works by creating a sale PDA which becomes the mint authority for the token being sold. This requires the creator of the sale to have mint authority for that token mint.

Once the sale is over, the creator can close the sale, which closes the sale PDA and transfers mint authority back to the creator.

### Vault version

Devnet program ID: `4KSUrirLpTrGMmgKNCcXtv7wsJ2kdfPTZJdtU4k4ABHs` [(view on Solscan)](https://solscan.io/account/4KSUrirLpTrGMmgKNCcXtv7wsJ2kdfPTZJdtU4k4ABHs?cluster=devnet)

The vault version works by creating a sale PDA which acts as a vault into which all tokens for the sale are transferred. This requires the owner to have `max_tokens_per_user * price`

### Program flow and state

The simplest flow for both programs is the following:

* Owner creates a token sale (`create_whitelist_sale`)
  * This automatically opens whitelist registrations. Buying is disabled.
* Users register for the whitelist (`register_for_whitelist`)
* Owner closes whitelist registration and open token sale (`update_sale_state`)
  * Owner can open/close the whitelist registration and sale as they please
* Users buy tokens (`buy_tokens`)
* Owner closes the token sale and receives all the earned SOL (`close_whitelist_sale`)

#### Sale PDA
Each sale has a `name`, which is used as the seed for creating a program-owned **Sale PDA**, which contains all important information about a sale. The Sale PDA is also used as a vault to store all SOL earned from the sale. When the owner of the sale closes it, the PDA is deleted and all SOL is transferred to the owner.

#### Allownace PDA
When a user registers for a sale, the program creates an **Allowance PDA**, for which the user's public key is used as a seed. This ensures that a single user can only have one registration for a sale. The Allowance PDA tracks how many tokens the user has bought so far. This way, each user can only buy up to a maximum number of tokens, as defined at the creation of the sale.

## Actions and Blinks

Eight total Actions are available on [https://whitelist-sale.pileks.me/](https://whitelist-sale.pileks.me/).

**All actions currently point to devnet, as the programs are deployed there.**

They are also split into **Mint** and **Vault** versions. Their surface is the same, but their mechanics are slightly different.

### Using the Mint version actions

In order to create a **Mint** sale, the caller must have mint authority over a given token mint, so that they may transfer the authority to the Sale PDA.

[Use a tool like Coin Factory to create a devnet mint](https://coinfactory.app/en/generator/solana/spl-token)
* Select "Solana devnet" in the top-right corner
* Ensure your wallet is connected to devnet
* Create a token mint and use the mint address in the **Create whitelist sale** action

### Using the Vault version actions

In order to create a **Vault** sale, the caller must have enough tokens of the specified mint, so that they may transfer the tokens to the Sale PDA.

[Use a tool like spl-token-faucet to airdrop some devnet SPL tokens into your wallet](https://spl-token-faucet.com/?token-name=USDC-Dev)
* Connect your wallet
* Select "DEVNET" in the form
* Enter an amount and lcick "GET USDC-DEV" to get your devnet SPL tokens

#### Sale owner (admin) actions

Except for `create`, all of these actions will fail unless called by the sale owner.

* **Create whitelist sale**
  * Creates a Sale PDA
  * The creator becomes the "owner" of that sale
  * **(Mint version)** Transfers mint authority to the Sale PDA from the creator
  * **(Vault version)** Transfers SPL tokens from the creator to the Sale PDA
* **Close whitelist sale**
  * Closes the Sale PDA
  * Transfers accumulated SOL to the owner
  * **(Mint version)** Transfers mint authority back to the owner
  * **(Vault version)** Transfers remaining SPL tokens to the owner
* **Open whitelist registration**
  * Enables whitelist registrations
* **Close whitelist registration**
  * Disables whitelist registrations
* **Open purchasing**
  * Enables purchasing of tokens
* **Close purchasing**
  * Enables purchasing of tokens

#### Sale user actions

These actions can be called by anyone.

* **Register for whitelist**
  * Registers the given user when a whitelist opens
  * Fails if whitelist registrations are closed
  * Fails if the user is already registered
* **Buy tokens**
  * Allows users to purchase a user-defined amount of tokens (with a maximum)
  * Fails if purchasing is disabled for the sale
  * Fails if the user isn't whitelisted
  * Fails if the user attempts to buy more than their remaining allowance
  * Transfers SOL from the user's wallet to the Sale PDA
  * **(Mint version)** Mints tokens directly into the user's wallet
  * **(Vault version)** Transfers tokens from the Sale PDA into the user's wallet

### Development tidbits

[`actions/src/shared/action-parameters.ts`](./actions/src/shared/action-parameters.ts) contains code that allows developers to reduce boilerplate around action parameters.

It does this by providing a simple UX to define a set of action parameters and it can then create a list of them by using `getActionParametersFromDefinition`. Additionally, it can parse parameters and provide a `Result`-like experience while doing so through `getActionParametersFromRequest`.