# CoinGecko submission package — CCM Network Token

**Status (2026-05-12)**: draft. **Cannot submit yet** — CoinGecko requires
verified DEX or CEX liquidity, which CCM does not yet have. This document
holds the submission content so it can be filed the moment a DEX pool
exists (Uniswap V3 / Aerodrome on Base).

## Submission URL

Direct entry:

```
https://support.coingecko.com/hc/en-us/requests/new
```

Then select form: **New Coin Listing Request** (or via Self-Serve Request Form:
https://support.coingecko.com/hc/en-us/articles/33084534107289-Self-Serve-Request-Form ).

Logo upload (200×200 PNG):

```
https://raw.githubusercontent.com/JamesLee77/ccm/main/frontend/public/ccm-token-mark-200.png
```

(Or download from `frontend/public/ccm-token-mark-200.png` and upload directly.)

---

## Form fields (copy-paste ready)

### Basic info

```
Token name              : CCM Network Token
Token symbol            : CCM
Contract address        : 0x398b2eB83C59890a01418b8D661e9A36a7c9d23d
Chain / Network         : Base
Decimals                : 18
Total supply (cap)      : 5,000,000,000 CCM (ERC20Capped, hard cap)
Current supply          : 10,000,000 CCM (as of mainnet launch 2026-05-12)
```

### Verification

```
BaseScan source         : https://basescan.org/address/0x398b2eB83C59890a01418b8D661e9A36a7c9d23d#code
EAS attestation (Coinbase Token Hub) : https://base.easscan.org/attestation/view/0x0b59cc6dfcca4a7e1d4fa77400143f905a7cb24a736be3453b4944556f421952
```

### Description (short, for the form)

> CCM is the utility token of CCM Network — a carbon credit measurement
> protocol on Base. CCM is used for carbon credit mining rewards, DeFi
> gas, and on-chain governance. The token is a standard ERC-20 with a
> hard cap of 5,000,000,000 enforced by ERC20Capped (OpenZeppelin).
> Phase 1 minted 10,000,000 CCM (0.2% of cap) for off-chain SAFT
> distribution to KYC-cleared early backers.

### Links

```
Official website         : https://ccmnetwork.net
Whitepaper               : https://ccmnetwork.net/whitepaper   (deploy frontend first; placeholder URL until live)
GitHub                   : https://github.com/JamesLee77/ccm
Block explorer (live)    : https://basescan.org/token/0x398b2eB83C59890a01418b8D661e9A36a7c9d23d
```

### Social media

```
Twitter / X              : (pending — set up before submission)
Discord                  : (pending)
Telegram                 : (pending)
Medium / blog            : (pending)
```

⚠ CoinGecko expects active social presence. If these are not set up,
the submission may be marked incomplete. Recommend creating at least
Twitter/X (the minimum signal) before submitting.

### Trading pairs / Exchanges

⚠ **This is the blocker today**. Required: at least one verifiable
DEX or CEX pair.

```
Pair                     : (none yet)
Exchange                 : (none yet)
Liquidity (USD)          : 0
24h volume (USD)         : 0
```

When liquidity is added later, fill in like:

```
Pair                     : CCM/WETH on Aerodrome (Base)
Exchange URL             : https://aerodrome.finance/swap?from=0x...&to=0x398b2eB...
Pool address             : 0x...
Liquidity (USD)          : $X (live)
24h volume (USD)         : $Y (live, 7-day average preferred)
```

### Team / project info (optional but recommended)

```
Founder / contact email  : foundation@ccmnetwork.net
Audit reports            : (none yet — formal audit pending Phase 0 gating)
KYC of team              : (pending — internal process)
Token launch date        : 2026-05-12 (Phase 1 mainnet deploy)
```

---

## Pre-submission checklist

Before clicking Submit on the CoinGecko form:

- [ ] DEX pair created on Base (Aerodrome, Uniswap V3, or similar)
- [ ] Pool seeded with at least a few thousand USD of CCM + WETH/USDC
- [ ] At least 1 trade executed so volume data exists
- [ ] Twitter/X account live (CoinGecko checks for social presence)
- [ ] Whitepaper accessible at a public URL (deploy frontend or host PDF)
- [ ] Logo confirmed 200×200 PNG (file: `frontend/public/ccm-token-mark-200.png`)
- [ ] Description finalized in Korean/English (above draft acceptable)
- [ ] Founder/contact email working

Once all checked: file submission. Expected review time 2–6 weeks (or
24h with paid Fast Pass, which CoinGecko offers as an optional service).

---

## Why we're holding

Without DEX liquidity, the submission will sit in "incomplete" status
and likely auto-reject. CoinGecko's own listing requirements explicitly
state: "must be actively trading on at least one exchange already
tracked by CoinGecko."

The right sequence is therefore:

1. **Phase 1.x — DEX setup** (separate decision):
   - Deploy CCM/WETH or CCM/USDC pool on Base (Aerodrome or Uniswap V3)
   - Seed with treasury CCM + bridge ETH/USDC
   - Set initial price implied by SAFT rounds ($0.15-$0.20 per CCM range,
     per `onchain/CCM_Token_Design.md`)
2. **Phase 1.y — execute first trades** to establish volume
3. **CoinGecko submission** using this document as the package
4. **Wait 2–6 weeks** for CoinGecko review

Filing today is wasted effort. Document held in repo so the package is
ready to go the moment liquidity is in place.
