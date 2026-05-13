/**
 * Submit a Coinbase Token Hub EAS attestation for CCM on Base mainnet.
 *
 * The Coinbase Wallet token-hub UI at wallet.coinbase.com/token-hub is
 * gone (HTTP 404 as of 2026-05-12), so we submit the attestation directly
 * against the EAS contract at 0x4200000000000000000000000000000000000021.
 * The schema is the canonical token-hub schema from coinbase/token-hub:
 *   0x1134b93c315c222968305b0467339b4fe8fc42c4646c4d4fce5d89e506c5aa6c
 *
 * The deployer EOA (the same wallet that holds Token admin) signs the
 * attestation. It is "self-attestation" — the token owner declares the
 * metadata for their own contract. Coinbase Wallet's indexer may treat
 * issuer == admin as a higher-trust signal.
 *
 * Idempotency: re-running creates a NEW attestation. The schema is
 * non-revocable on-chain (verified via SchemaRegistry.getSchema), so old
 * attestations remain permanent in the registry. Coinbase's indexer
 * picks the latest by (attester, contract) tuple.
 *
 * Run:
 *   npx hardhat run scripts/submit-token-hub-attestation.ts --network base
 *
 * Optional dry-run (just print the calldata, don't send):
 *   DRY_RUN=1 npx hardhat run scripts/submit-token-hub-attestation.ts --network base
 */
import { ethers } from "hardhat";

// ===== schema and contract addresses =====
const EAS_BASE_MAINNET = "0x4200000000000000000000000000000000000021";
const TOKEN_HUB_SCHEMA = "0x1134b93c315c222968305b0467339b4fe8fc42c4646c4d4fce5d89e506c5aa6c";

// Schema field order (must match coinbase/token-hub):
//   uint256 chainId, address contractAddress, string name, string symbol,
//   string description, string imageUrl, string websiteUrl, string whitePaperUrl,
//   string codebaseUrl, string[] socialMediaUrls, string[] auditUrls,
//   address migratedToAddress, string version, string email,
//   uint256 canonicalChainId, address canonicalAddress
const SCHEMA_TYPES = [
  "uint256", "address", "string", "string",
  "string",  "string",  "string", "string",
  "string",  "string[]","string[]",
  "address", "string",  "string",
  "uint256", "address",
];

// ===== CCM token-hub metadata =====
// Edit values here. Empty strings / empty arrays are valid (Coinbase indexer
// just won't display empty fields). To revise later, run the script again.
const ATTESTATION = {
  chainId:           8453n,
  contractAddress:   "0x398b2eB83C59890a01418b8D661e9A36a7c9d23d",
  name:              "CCM Network Token",
  symbol:            "CCM",
  description:       "Utility token of the CCM Network ecosystem on Base. Used for carbon credit mining rewards, DeFi gas, and governance. 5,000,000,000 hard cap, ERC20Capped enforced.",
  imageUrl:          "https://ccmnetwork.net/ccm-token-mark.png",
  websiteUrl:        "https://ccmnetwork.net",
  whitePaperUrl:     "https://ccmnetwork.net/whitepaper",
  codebaseUrl:       "https://github.com/JamesLee77/ccm",
  socialMediaUrls:   [] as string[],
  auditUrls:         [] as string[],
  migratedToAddress: "0x0000000000000000000000000000000000000000",
  version:           "1.0.0",
  email:             "foundation@ccmnetwork.net",
  canonicalChainId:  8453n,
  canonicalAddress:  "0x398b2eB83C59890a01418b8D661e9A36a7c9d23d",
};

// Minimal EAS ABI — just attest(AttestationRequest) → returns bytes32 uid.
// AttestationRequest = { schema: bytes32, data: AttestationRequestData }
// AttestationRequestData = {
//   recipient: address, expirationTime: uint64, revocable: bool,
//   refUID: bytes32, data: bytes, value: uint256
// }
const EAS_ABI = [
  {
    type: "function",
    name: "attest",
    stateMutability: "payable",
    inputs: [
      {
        type: "tuple",
        name: "request",
        components: [
          { type: "bytes32", name: "schema" },
          {
            type: "tuple",
            name: "data",
            components: [
              { type: "address", name: "recipient" },
              { type: "uint64",  name: "expirationTime" },
              { type: "bool",    name: "revocable" },
              { type: "bytes32", name: "refUID" },
              { type: "bytes",   name: "data" },
              { type: "uint256", name: "value" },
            ],
          },
        ],
      },
    ],
    outputs: [{ type: "bytes32", name: "uid" }],
  },
] as const;

async function main() {
  const DRY_RUN = process.env.DRY_RUN === "1";
  const [signer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 8453n) {
    throw new Error(`Refusing to run: chainId is ${network.chainId} (expected 8453 = Base mainnet)`);
  }

  // ABI-encode the schema fields in declaration order.
  const coder = ethers.AbiCoder.defaultAbiCoder();
  const encoded = coder.encode(SCHEMA_TYPES, [
    ATTESTATION.chainId,
    ATTESTATION.contractAddress,
    ATTESTATION.name,
    ATTESTATION.symbol,
    ATTESTATION.description,
    ATTESTATION.imageUrl,
    ATTESTATION.websiteUrl,
    ATTESTATION.whitePaperUrl,
    ATTESTATION.codebaseUrl,
    ATTESTATION.socialMediaUrls,
    ATTESTATION.auditUrls,
    ATTESTATION.migratedToAddress,
    ATTESTATION.version,
    ATTESTATION.email,
    ATTESTATION.canonicalChainId,
    ATTESTATION.canonicalAddress,
  ]);

  const eas = new ethers.Contract(EAS_BASE_MAINNET, EAS_ABI, signer);

  const request = {
    schema: TOKEN_HUB_SCHEMA,
    data: {
      recipient: ATTESTATION.contractAddress,          // attestation "about" the token contract
      expirationTime: 0n,                              // no expiration
      // The token-hub schema is non-revocable on-chain (verified via
      // SchemaRegistry.getSchema). To update metadata later, submit a new
      // attestation — Coinbase's indexer picks the latest by (attester, contract).
      revocable: false,
      refUID: ethers.ZeroHash,
      data: encoded,
      value: 0n,
    },
  };

  console.log("=".repeat(72));
  console.log("Coinbase Token Hub attestation — Base mainnet");
  console.log("  EAS contract :", EAS_BASE_MAINNET);
  console.log("  Schema UID   :", TOKEN_HUB_SCHEMA);
  console.log("  Signer       :", signer.address);
  console.log("  Network      :", network.name, "chainId", network.chainId.toString());
  console.log("  Recipient    :", request.data.recipient);
  console.log("  Revocable    :", request.data.revocable);
  console.log("  Data length  :", (encoded.length - 2) / 2, "bytes");
  console.log("=".repeat(72));
  console.log("\n  description  :", ATTESTATION.description);
  console.log("  imageUrl     :", ATTESTATION.imageUrl);
  console.log("  websiteUrl   :", ATTESTATION.websiteUrl);
  console.log("  whitePaper   :", ATTESTATION.whitePaperUrl);
  console.log("  codebaseUrl  :", ATTESTATION.codebaseUrl);
  console.log("  email        :", ATTESTATION.email);
  console.log("  social URLs  :", ATTESTATION.socialMediaUrls.length, "items");
  console.log("  audit URLs   :", ATTESTATION.auditUrls.length, "items");
  console.log("");

  // Pre-flight: gas estimate to catch revert before sending.
  let gasEstimate: bigint;
  try {
    gasEstimate = await eas.attest.estimateGas(request);
    console.log("Gas estimate :", gasEstimate.toString());
  } catch (e) {
    console.error("Pre-flight gas estimate FAILED — attestation would revert.");
    throw e;
  }

  const feeData = await ethers.provider.getFeeData();
  const estCostWei = gasEstimate * (feeData.gasPrice ?? 0n);
  console.log("Gas price    :", feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") + " gwei" : "n/a");
  console.log("Est cost     :", ethers.formatEther(estCostWei), "ETH");

  if (DRY_RUN) {
    console.log("\n[DRY_RUN=1] not sending. To submit: re-run without DRY_RUN.");
    console.log("\nRaw calldata for manual submission (sign via MetaMask Contract Interaction → target =", EAS_BASE_MAINNET, "):");
    const calldata = eas.interface.encodeFunctionData("attest", [request]);
    console.log(calldata);
    return;
  }

  console.log("\nSending attestation in 10 seconds. Ctrl-C to abort.");
  await new Promise((r) => setTimeout(r, 10_000));

  const tx = await eas.attest(request);
  console.log("\nAttestation tx:", tx.hash);
  const receipt = await tx.wait(2);
  if (!receipt) throw new Error("tx.wait() returned null");
  console.log("Mined in block:", receipt.blockNumber);

  // The attest() return value (the attestation UID) is in the tx return data,
  // but eth_getTransactionReceipt doesn't include return values. Instead we
  // read the Attested event from the receipt logs.
  // Attested event: Attested(address indexed recipient, address indexed attester, bytes32 uid, bytes32 indexed schema)
  const attestedTopic = ethers.id("Attested(address,address,bytes32,bytes32)");
  const evt = receipt.logs.find((l) =>
    l.address.toLowerCase() === EAS_BASE_MAINNET.toLowerCase() && l.topics[0] === attestedTopic,
  );
  if (evt) {
    // uid is the only non-indexed field — in evt.data, 32 bytes
    const uid = evt.data.slice(0, 66); // "0x" + 64 hex
    console.log("\nAttestation UID:", uid);
    console.log("EAS explorer   :", `https://base.easscan.org/attestation/view/${uid}`);
  } else {
    console.log("Warning: no Attested event found in receipt logs. Tx succeeded but UID couldn't be parsed.");
  }
  console.log("BaseScan tx    :", `https://basescan.org/tx/${tx.hash}`);
  console.log("\n✓ Done. Coinbase Wallet indexer may take 24h to reflect metadata.");
}

main().catch((e) => { console.error(e); process.exit(1); });
