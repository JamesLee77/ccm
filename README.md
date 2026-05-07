# CCM Network

**Carbon Credit Measurement** — 탄소 크레딧을 위한 개방형 표준·검증·DeFi 네트워크.

> The Carbon Credit Standard. Verified. Onchain. DeFi-native.

PPM이 대기 중 CO₂ 농도의 표준 단위가 된 것처럼, CCM은 검증된 1톤의 CO₂ 감축·제거를 표현하는 보편 단위가 되는 것을 목표로 합니다.

🌐 **언어**: **한국어** · [English](README.en.md)

---

## 시장 기회 — Voluntary Carbon Market 2030

| 연도 | 시장 규모 (USD) |
|------|-----------------|
| 2024 | $2B |
| 2026E | $8B |
| 2028E | $25B |
| **2030E** | **$50B** |
| 2050E | $250B |

> **2030년까지 25× 성장, 2050년까지 125× 성장이 예상되지만 시장은 망가져 있다.** (출처: McKinsey 2024)

---

## Trinity: Network · Unit · Token

Bitcoin이 *Network + bitcoin + $BTC* 세 layer로 구성되듯, CCM도 세 층이 함께 작동합니다.

| 층 | 이름 | 역할 |
|---|------|------|
| **N**etwork | **CCM Network** | 재단 · 표준 · 거버넌스. VVB·Oracle·Registry를 관장하는 글로벌 표준 네트워크 |
| **U**nit | **CCM** | PPM처럼 누구나 사용 가능한 검증된 탄소 감축 단위 (1 ton CO₂e verified) |
| **T**oken | **$CCM** | ERC-20 wrapper. AMM·lending·DeFi에서 자유롭게 합성되는 fungible 자산 |

---

## 핵심 개념

### 1 CCM = 1 ton CO₂e (verified, onchain)

CCM은 **단위(unit)**입니다. 토큰이 아니라, 검증된 탄소 감축량을 표현하는 표준 단위. 온체인에서는 두 형태로 동시에 존재합니다.

### Dual Representation 아키텍처

| 형태 | 표준 | 역할 |
|------|------|------|
| **CCM-NFT** | ERC-1155 | Source-of-truth (vintage·등급·project ID·VVB 서명 메타데이터) |
| **$CCM 토큰** | ERC-20 | Fungible wrapper (AMM·lending·payment) |

두 형태는 vault에서 1:1로 wrap/unwrap됩니다. 결과적으로 NFT의 **추적성·고유성**과 ERC-20의 **유동성·DeFi 합성성**을 동시에 갖춘 최초의 onchain carbon primitive를 제공합니다.

### 4단계 등급 시스템

| 등급 | 영속성 | MRV | 대표 카테고리 |
|------|--------|-----|--------------|
| **CCM-A** | 1,000년+ | Tier-1 | DAC, 광물화, 해양 알칼리화 |
| **CCM-B** | 100년+ | Tier-1 | 바이오차, 강화풍화, 건설자재 |
| **CCM-C** | 40~100년 | Tier-2 | 신규조림, 토양탄소, 습지복원 |
| **CCM-D** | <40년 | Tier-2 | REDD+, 메탄 회피, 쿡스토브 |

### SI 접두어 단위 체계

μCCM (1g) · mCCM (1kg) · CCM (1ton) · kCCM · MCCM · GCCM — 개인 항공권(≈200 mCCM)부터 국가 NDC(예: 한국 2030 ≈ 290 MCCM)까지 통일된 표현.

---

## 해결하는 4대 시장 실패

1. **불투명성** → onchain registry, 실시간 mint/transfer/burn 이벤트
2. **이중계상** → globally unique tokenId, retire-once invariant
3. **유동성 부족** → AMM·lending·index 등 DeFi 합성성
4. **등급 차별 부재** → CCM-A~D 4단계 등급, 등급별 wrapper 분리

---

## 아키텍처 — 8층 스택

| Layer | 역할 |
|-------|------|
| L8 Application | 지갑, 마켓플레이스, ESG 대시보드 |
| **L7 DeFi Primitives** ★ | Wrap, AMM, Vault, Index, Insurance |
| L6 Token Layer | $CCM ERC-20, veCCM |
| **L5 NFT Registry** ★ | CCM-NFT ERC-1155 (source-of-truth) |
| L4 Verification | VVB 합의, ZK proof |
| L3 Oracle / MRV | 위성(Sentinel-2, Planet Labs) · IoT · LiDAR |
| L2 Mining (CCMine) | Physical / Verification 노드 |
| L1 Settlement | Base (Coinbase L2) |

**핵심 책임 분리**: L5 NFT = **추적성** · L6 Token = **유동성** · L7 DeFi = **합성성**

---

## CCMine — Proof of Carbon Removal/Reduction (PoCR)

비트코인이 PoW로 BTC를 발행하듯, CCMine 노드는 검증된 감축 활동으로 CCM-NFT를 mint합니다.

- **Physical Miner**: DAC 장비, 광물화 플랜트, 바이오차 가마, 신규조림 부지 등 운영
- **Verification Miner**: oracle / attestation 노드 운영
- **Storage Miner**: IPFS·Arweave 분산 저장

### 발행 흐름 (5단계)

```
1. 감축 활동           2. Oracle 측정         3. VVB 검증
   DAC, 광물화,    →   위성·IoT·LiDAR    →   M-of-N 합의,
   신규조림 운영        데이터 수집           등급 부여
                                              ↓
5. Wrap / Sell        4. NFT Mint
   $CCM 전환,     ←    CCM-NFT (ERC-1155)
   DeFi 활용           발행
```

---

## $CCM 토큰

- **Hard cap**: 5,000,000,000 (50억, ERC20Capped 강제, 추가 발행 영구 불가)
- **Settlement layer**: Base (EVM L2)

### 분배

| 카테고리 | 비율 | 비고 |
|---------|------|------|
| Mining Rewards | 40% | 10년 감속 emission |
| Foundation / Ecosystem | 18% | 4Y vesting + 1Y cliff |
| Strategic / Partners | 10% | 4Y vesting + 1Y cliff |
| Liquidity / AMM | 9% | 즉시 unlock |
| Treasury Reserve | 8% | DAO 거버넌스 |
| Public Sale (TGE) | 5% | Seed + Series A |
| Staking Pool | 5% | 가격 탄력적 yield |
| Team & Advisors | 5% | 4Y vesting + 1Y cliff |

### 유틸리티

1. Settlement currency
2. VVB / CCMiner staking
3. Governance (veCCM lock-and-vote)
4. Marketplace fee 50% 할인
5. DeFi liquidity primitive

---

## CCM × DeFi 시너지

| Primitive | 설명 |
|-----------|------|
| **Wrap / Unwrap** | NFT ↔ ERC-20 1:1 (Standard / Premium / Specific 모드) |
| **Grade Wrappers** | $CCM-A, $CCM-B, $CCM-C, $CCM-D 등급별 풀 |
| **NFT Vault Lending** | NFT 담보 차입, 등급별 LTV 30~70% |
| **Fractionalization** | 대형 NFT 분할 → 소액 투자자 접근성 |
| **NFT Yield** | Hold-to-Earn, 등급·빈티지 가중 yield |
| **Retire-to-Earn** | ESG retire → Retirement Certificate + $CCM rebate |
| **Insurance Vault** | dispute 무효화 리스크 헷지 |
| **Index Tokens** | $CCM-PRIME (A+B), $CCM-FOREST (NbS), $CCM-TECH (TbS) |

표준 ERC-20 / ERC-1155 호환으로 Uniswap, Curve, Aave, Pendle, Yearn, OpenSea, Sudoswap 등 외부 DeFi와 자유롭게 합성됩니다.

---

## vs. 기존 onchain Carbon 프로젝트

| 항목 | Toucan (BCT) | Moss (MCO2) | KlimaDAO | **CCM Network** |
|------|--------------|-------------|----------|-----------------|
| Originate vs Tokenize | Tokenize | Tokenize | Tokenize | ✅ **Originate** |
| NFT × ERC-20 Dual | ❌ ERC-20 only | ❌ ERC-20 only | ❌ ERC-20 only | ✅ **Both, 1:1 wrap** |
| 등급 차별화 | ❌ 단일 풀 | ❌ 단일 | ❌ | ✅ **A/B/C/D 등급** |
| DeFi Native (Vault, Index) | Limited | ❌ | Partial | ✅ **8 primitives** |
| 검증 거버넌스 | External (Verra) | External | External | ✅ **Multi-VVB DAO** |
| Bridge 위험 | ⚠️ 동결 (Verra ban) | ⚠️ | ⚠️ | ✅ **Originate, no bridge** |

**CCM = 첫 번째 Originate × NFT/Token Dual × DeFi-native 카본 인프라.**

---

## 거버넌스 — veCCM

| Lock 기간 | 가중치 |
|-----------|--------|
| 4년 | 1.0× |
| 2년 | 0.5× |
| 1년 | 0.25× |
| 6개월 | 0.1× |

veCCM은 transfer 불가. CCM Standard 개정, VVB 화이트리스트, Treasury 지출, fee rate, vault 파라미터 등에 vote.

**점진적 탈중앙화**: Y0 multisig → Y1 treasury vote binding → Y2 표준 vote → Y3+ 완전 DAO.

---

## 로드맵

| Phase | 시기 | 주요 마일스톤 |
|-------|------|--------------|
| 0 — Foundation | 완료 | Standard v1.0, Whitepaper v1.0, 핵심 컨트랙트 초안 |
| 1 — Mainnet | 2026 Q3 | 외부 감사, Base 배포, TGE, AMM 조성, Foundation 설립 |
| 2 — Mining + DeFi 시작 | 2026 Q4 | 첫 5개 CCMine pilot, VVB 5개, Wrapper/Staking 배포 |
| 3 — DeFi 본격 가동 | 2027 H1 | Vault, Fractional, Index, Insurance, veCCM 거버넌스 |
| 4 — Scale | 2027 H2~2028 | 노드 100+, VVB 20+, 다국어, multi-chain |
| 5 — Standard Adoption | 2028+ | UNFCCC Article 6 / ISO TC 207, A6.4ER ↔ CCM bridge |

---

## 상호운용성

- **Verra VCS**: 1 VCU = 1 CCM (검증 후 등급 부여)
- **Gold Standard**: 1 GS-VER = 1 CCM
- **ACR**: 1 ERT = 1 CCM
- **Paris Agreement Article 6.4**: 1 A6.4ER = 1 CCM-B 이상
- **ICVCM CCP**: CCP-eligible → CCM-A 또는 CCM-B 후보

---

## 보안 정책

- 모든 컨트랙트 **non-upgradeable**
- 외부 감사 1개 이상 필수 (Trail of Bits / OpenZeppelin / Quantstamp)
- TGE 후 Immunefi bug bounty (최대 $500K)
- Slither, Mythril 정적 분석 통과
- Admin role: 3-of-5 Gnosis Safe + 48시간 timelock

---

## 문서

- [Whitepaper v1.0](docs/CCM_Network_Whitepaper_v1.0.pdf) (39 pages)
- [Deck v1.0](docs/CCM_Network_Deck_v1.0.pdf)

---

## 라이선스

- **Whitepaper**: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- **CCM Standard** (별도 문서): Apache License 2.0
- **스마트 컨트랙트 소스코드**: MIT License

---

## 링크

- 웹사이트: ccm.network · ccm.earth
- 발행: CCM Foundation, May 2026

---

> **Disclaimer**: 본 저장소의 자료는 정보 제공 목적이며, 투자 권유나 증권 발행 제안이 아닙니다. $CCM 토큰 구매 관련 리스크는 백서 12장을 참조하십시오.
