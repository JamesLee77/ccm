# Uniswap default-token-list issue draft

Submission target: https://github.com/Uniswap/default-token-list/issues

Issue title:

```
Add CCM: CCM Network Token
```

Issue body (review and edit, then paste into the GitHub issue form):

```markdown
- [x] I understand that token listing is not required to use the Uniswap Interface with a token.
- [x] I understand that filing an issue or adding liquidity does not guarantee addition to the Uniswap default token list.
- [x] I will not ping the Discord about this listing request.

**Please provide the following information for your token.**

Token Address: 0x398b2eB83C59890a01418b8D661e9A36a7c9d23d
Token Name (from contract): CCM Network Token
Token Decimals (from contract): 18
Token Symbol (from contract): CCM
Uniswap V2 Pair Address of Token: (none yet — no DEX liquidity at this time)

Link to the official homepage of token: https://ccmnetwork.net
Link to CoinMarketCap or CoinGecko page of token: (pending registration)

**Additional context**

CCM is the utility token of CCM Network — a carbon credit measurement protocol on Base mainnet.

- Chain: Base mainnet (chainId 8453)
- Standard: ERC-20 (OpenZeppelin Capped + Burnable + Pausable + Permit + AccessControl), Solidity 0.8.24
- Hard cap: 5,000,000,000 CCM (ERC20Capped enforced)
- Current supply: 10,000,000 CCM (Phase 1 OTC/SAFT pool, minted 2026-05-12)
- BaseScan (verified source): https://basescan.org/address/0x398b2eB83C59890a01418b8D661e9A36a7c9d23d#code
- GitHub: https://github.com/JamesLee77/ccm
- Coinbase Token Hub EAS attestation: https://base.easscan.org/attestation/view/0x0b59cc6dfcca4a7e1d4fa77400143f905a7cb24a736be3453b4944556f421952

Logo (256×256 PNG, brand-aligned):
https://raw.githubusercontent.com/JamesLee77/ccm/main/frontend/public/ccm-token-mark.png

We acknowledge that without DEX liquidity or CoinGecko/CMC presence this request is unlikely to be accepted in the near term. Filing now for public transparency and to track listing demand. We will follow up once liquidity is in place and aggregator pages are live.
```

## One-click submission URL

Pre-fills title and body so you just click "Submit new issue":

https://github.com/Uniswap/default-token-list/issues/new?labels=token+request&template=token-request.md&title=Add+CCM%3A+CCM+Network+Token

(GitHub's pre-fill via `?body=...` works but URL-encoding 1.5KB of markdown is fragile. Use the link above to open the template, then paste the body markdown from the section above.)

## Realistic expectations

- Uniswap explicitly states: "we do not guarantee that we will review your request"
- The default list focuses on tokens with active trading and known aggregator presence
- For CCM, the realistic path is:
  1. List on CoinGecko (or CMC) — both require some trading activity
  2. Add Uniswap V3 / Aerodrome liquidity on Base
  3. Reference the established CoinGecko/CMC pages in the Uniswap issue follow-up

This issue is therefore mostly a public marker. Real reach for MetaMask
auto-suggest etc. will come via CoinGecko + DEX liquidity, not this list
directly.
