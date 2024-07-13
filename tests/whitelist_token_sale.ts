import * as anchor from "@coral-xyz/anchor";
import { Program, getProvider, BN } from "@coral-xyz/anchor";
import { WhitelistTokenSale } from "../target/types/whitelist_token_sale";
import {
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  SendTransactionError,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  Account,
} from "@solana/spl-token";
import { assert } from "chai";

describe("Whitelist Token Sale - story", () => {
  // PRELUDE

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = getProvider();

  const program = anchor.workspace
    .WhitelistTokenSale as Program<WhitelistTokenSale>;

  // Number of decimals for the token mint
  const DECIMALS = 6;

  const SALE_NAME = "a token sale";
  const SALE_PRICE_PER_TOKEN_LAMPORTS = new BN(LAMPORTS_PER_SOL / 100); // 1 token = 0.01 SOL
  const SALE_MAX_BUYERS = new BN(2);
  const SALE_MAX_TOKENS_PER_BUYER = new BN(1000);

  // Actors in our tests
  const MINT_KEYPAIR = Keypair.generate();
  const OWNER_KEYPAIR = Keypair.generate();
  const BUYER_KEYPAIR = Keypair.generate();
  const NON_BUYER_KEYPAIR = Keypair.generate();

  // We will set these in the before() call
  let ownerAta: Account;
  let buyerAta1: Account;
  let buyerAta2: Account;

  const getSaleStateAddress = (name: string) => {
    const [address, _bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("sale"), Buffer.from(name)],
      program.programId
    );

    return address;
  };

  const getAllowanceAddress = (name: string, pubkey: PublicKey) => {
    const [address, _bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("allowance"), Buffer.from(name), pubkey.toBytes()],
      program.programId
    );

    return address;
  };

  const confirmTransaction = async (tx: string) => {
    const bh = await provider.connection.getLatestBlockhash();

    return await provider.connection.confirmTransaction(
      {
        signature: tx,
        blockhash: bh.blockhash,
        lastValidBlockHeight: bh.lastValidBlockHeight,
      },
      "confirmed"
    );
  };

  const airdropSol = async (pubkey: PublicKey, amount: number) => {
    await confirmTransaction(
      await provider.connection.requestAirdrop(
        pubkey,
        amount * LAMPORTS_PER_SOL
      )
    );
  };

  // BEGIN TESTS

  before("airdrop SOL into wallets and create a token mint", async () => {
    await airdropSol(OWNER_KEYPAIR.publicKey, 100);
    await airdropSol(BUYER_KEYPAIR.publicKey, 100);
    await airdropSol(NON_BUYER_KEYPAIR.publicKey, 100);

    await createMint(
      provider.connection,
      OWNER_KEYPAIR,
      OWNER_KEYPAIR.publicKey,
      OWNER_KEYPAIR.publicKey,
      DECIMALS,
      MINT_KEYPAIR
    );

    ownerAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      OWNER_KEYPAIR,
      MINT_KEYPAIR.publicKey,
      OWNER_KEYPAIR.publicKey
    );

    const mintAmount = 10_000 * Math.pow(10, DECIMALS); // Amount of tokens to mint (considering decimals)

    await mintTo(
      provider.connection,
      OWNER_KEYPAIR,
      MINT_KEYPAIR.publicKey,
      ownerAta.address,
      OWNER_KEYPAIR,
      mintAmount
    );

    buyerAta1 = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      BUYER_KEYPAIR,
      MINT_KEYPAIR.publicKey,
      BUYER_KEYPAIR.publicKey
    );

    buyerAta2 = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      NON_BUYER_KEYPAIR,
      MINT_KEYPAIR.publicKey,
      NON_BUYER_KEYPAIR.publicKey
    );
  });

  it("should fail initialization of a sale due to insufficient tokens", async () => {
    await program.methods
      .createWhitelistSale(
        SALE_NAME,
        SALE_PRICE_PER_TOKEN_LAMPORTS,
        new BN(1000),
        new BN(100)
      )
      .accounts({
        signer: OWNER_KEYPAIR.publicKey,
        tokenMint: MINT_KEYPAIR.publicKey,
      })
      .signers([OWNER_KEYPAIR])
      .rpc()
      .then(
        () => {
          assert.fail(
            "User shouldn't be able to create a sale if they have insuficcient tokens!"
          );
        },
        (e: SendTransactionError) => {
          assert.ok(
            e.logs.some((log) => log.includes("Error: insufficient funds"))
          );
        }
      );
  });

  it("should initialize a sale from owner's wallet", async () => {
    await program.methods
      .createWhitelistSale(
        SALE_NAME,
        SALE_PRICE_PER_TOKEN_LAMPORTS,
        SALE_MAX_TOKENS_PER_BUYER,
        SALE_MAX_BUYERS
      )
      .accounts({
        signer: OWNER_KEYPAIR.publicKey,
        tokenMint: MINT_KEYPAIR.publicKey,
      })
      .signers([OWNER_KEYPAIR])
      .rpc();

    const saleStateAddress = getSaleStateAddress(SALE_NAME);
    const saleState = await program.account.whitelistSale.fetch(
      saleStateAddress
    );

    // Assert that a created sale has its registration open and its sale closed
    assert.isTrue(saleState.isRegistrationOpen);
    assert.isFalse(saleState.isSaleOpen);

    // Assert that the correct amount is in the ATA
    const saleStateAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      OWNER_KEYPAIR,
      MINT_KEYPAIR.publicKey,
      saleStateAddress,
      true
    );
    const expectedAmount = SALE_MAX_TOKENS_PER_BUYER.mul(SALE_MAX_BUYERS).mul(
      new BN(Math.pow(10, DECIMALS))
    );
    assert.isTrue(expectedAmount.eq(new BN(saleStateAta.amount.toString())));
  });

  it("should allow a buyer to register on whitelist while registration is open", async () => {
    await program.methods
      .registerForWhitelist(SALE_NAME)
      .accounts({
        signer: BUYER_KEYPAIR.publicKey,
      })
      .signers([BUYER_KEYPAIR])
      .rpc();

    const allowanceAddress = getAllowanceAddress(
      SALE_NAME,
      BUYER_KEYPAIR.publicKey
    );
    const allowance = await program.account.allowance.fetch(allowanceAddress);

    assert.equal(allowance.tokensBought.cmp(new BN(0)), 0);
  });

  it("should disallow an already registered buyer tries to register on whitelist", async () => {
    await program.methods
      .registerForWhitelist(SALE_NAME)
      .accounts({
        signer: BUYER_KEYPAIR.publicKey,
      })
      .signers([BUYER_KEYPAIR])
      .rpc()
      .then(
        () => {
          assert.fail(
            "Buyer should not be able to register for whitelist twice!"
          );
        },
        (e: SendTransactionError) => {
          assert.ok(
            e.logs.some(
              (log) =>
                log.includes("Allocate: account Address") &&
                log.includes("already in use")
            )
          );
        }
      );
  });

  it("should disallow anyone other than owner to enable/disable whitelisting and buying", async () => {
    await program.methods
      .updateSaleState(SALE_NAME, false, true)
      .accounts({
        signer: BUYER_KEYPAIR.publicKey,
      })
      .signers([BUYER_KEYPAIR])
      .rpc()
      .then(
        () => {
          assert.fail("Non-owner should not be able to change sale state!");
        },
        (e: SendTransactionError) => {
          assert.ok(e.logs.some((log) => log.includes("OnlyOwner")));
        }
      );

    const saleStateAddress = getSaleStateAddress(SALE_NAME);
    const saleState = await program.account.whitelistSale.fetch(
      saleStateAddress
    );

    assert.isTrue(saleState.isRegistrationOpen);
    assert.isFalse(saleState.isSaleOpen);
  });

  it("should disallow whitelisted buyer to purchase tokens before sale is open", async () => {
    const buyAmount = new BN(10);

    await program.methods
      .buyTokens(SALE_NAME, buyAmount)
      .accounts({
        signer: BUYER_KEYPAIR.publicKey,
        tokenMint: MINT_KEYPAIR.publicKey,
      })
      .signers([BUYER_KEYPAIR])
      .rpc()
      .then(
        () => {
          assert.fail(
            "Whitelisted buyer should not be able to buy before token sale is open!"
          );
        },
        (e: SendTransactionError) => {
          assert.ok(e.logs.some((log) => log.includes("SaleClosed")));
        }
      );
  });

  it("should allow owner to enable/disable whitelisting and buying", async () => {
    await program.methods
      .updateSaleState(SALE_NAME, false, true)
      .accounts({
        signer: OWNER_KEYPAIR.publicKey,
      })
      .signers([OWNER_KEYPAIR])
      .rpc();

    const saleStateAddress = getSaleStateAddress(SALE_NAME);
    const saleState = await program.account.whitelistSale.fetch(
      saleStateAddress
    );

    assert.isFalse(saleState.isRegistrationOpen);
    assert.isTrue(saleState.isSaleOpen);
  });

  it("should allow whitelisted buyer to purchase tokens once sale is open", async () => {
    const buyAmount = new BN(999);

    await program.methods
      .buyTokens(SALE_NAME, buyAmount)
      .accounts({
        signer: BUYER_KEYPAIR.publicKey,
        tokenMint: MINT_KEYPAIR.publicKey,
      })
      .signers([BUYER_KEYPAIR])
      .rpc();

    const signerAtaAddress = await getAssociatedTokenAddress(
      MINT_KEYPAIR.publicKey,
      BUYER_KEYPAIR.publicKey
    );
    const signerAta = await getAccount(provider.connection, signerAtaAddress);

    assert.isTrue(
      new BN(signerAta.amount.toString()).eq(
        buyAmount.mul(new BN(Math.pow(10, DECIMALS)))
      ),
      `Singer's ATA amount is ${signerAta.amount}, while it should be ${buyAmount}`
    );
  });

  it("should disallow whitelisted buyer to purchase more tokens than allocated", async () => {
    // Buy limit is 1000. We already bought 999 tokens, so this should fail
    const buyAmount = new BN(2);

    await program.methods
      .buyTokens(SALE_NAME, buyAmount)
      .accounts({
        signer: BUYER_KEYPAIR.publicKey,
        tokenMint: MINT_KEYPAIR.publicKey,
      })
      .signers([BUYER_KEYPAIR])
      .rpc()
      .then(
        () => {
          assert.fail(
            "Whitelisted buyer should not be able to buy more than the allocated amount!"
          );
        },
        (e: SendTransactionError) => {
          assert.ok(e.logs.some((log) => log.includes("AllowanceExceeded")));
        }
      );
  });

  it("should allow the same purchaser to purchase more than once, up to the total allowance", async () => {
    // Let's buy the remaining 1 token...
    const remainingBuyAmount = new BN(1);

    await program.methods
      .buyTokens(SALE_NAME, remainingBuyAmount)
      .accounts({
        signer: BUYER_KEYPAIR.publicKey,
        tokenMint: MINT_KEYPAIR.publicKey,
      })
      .signers([BUYER_KEYPAIR])
      .rpc();

    const signerAtaAddress = await getAssociatedTokenAddress(
      MINT_KEYPAIR.publicKey,
      BUYER_KEYPAIR.publicKey
    );
    const signerAta = await getAccount(provider.connection, signerAtaAddress);
    const expectedAmount = new BN(1000);

    assert.isTrue(
      new BN(signerAta.amount.toString()).eq(
        expectedAmount.mul(new BN(Math.pow(10, DECIMALS)))
      ),
      `Singer's ATA amount is ${signerAta.amount}, while it should be ${expectedAmount}`
    );
  });

  it("should disallow non-whitelisted buyer to purchase tokens", async () => {
    const buyAmount = new BN(10);

    await program.methods
      .buyTokens(SALE_NAME, buyAmount)
      .accounts({
        signer: NON_BUYER_KEYPAIR.publicKey,
        tokenMint: MINT_KEYPAIR.publicKey,
      })
      .signers([NON_BUYER_KEYPAIR])
      .rpc()
      .then(
        () => {
          assert.fail(
            "Non-whitelisted buyer should not be able to purchase tokens!"
          );
        },
        (e: SendTransactionError) => {
          assert.ok(
            e.logs.some((log) => log.includes("AccountNotInitialized"))
          );
        }
      );
  });

  it("should disallow a buyer to register on whitelist while registration is closed", async () => {
    await program.methods
      .registerForWhitelist(SALE_NAME)
      .accounts({
        signer: NON_BUYER_KEYPAIR.publicKey,
      })
      .signers([NON_BUYER_KEYPAIR])
      .rpc()
      .then(
        () => {
          assert.fail(
            "Buyer should not be able to register for whitelist while registration is closed!"
          );
        },
        (e: SendTransactionError) => {
          assert.ok(
            e.logs.some((log) =>
              log.includes("Whitelist registration is closed")
            )
          );
        }
      );
  });
});
