import LegalLayout from "../components/site/LegalLayout";

export default function Terms() {
  return (
    <LegalLayout title="Terms of Service" effective="2026-05-10">
      <p>
        These Terms of Service (the <strong>"Terms"</strong>) govern your access
        to and use of the websites at <code>ccmnetwork.net</code>,{" "}
        <code>portal.ccmnetwork.net</code>, <code>testnet.ccmnetwork.net</code>,
        and the related smart contracts deployed on Base mainnet (collectively,
        the <strong>"Service"</strong>) operated by CCM Network (the{" "}
        <strong>"Foundation"</strong>, <strong>"we"</strong>, or{" "}
        <strong>"us"</strong>).
      </p>
      <p>
        By accessing the Service, connecting a wallet, or interacting with the
        smart contracts, you agree to be bound by these Terms. If you do not
        agree, you may not use the Service.
      </p>

      <h2>1. Definitions</h2>
      <ul>
        <li>
          <strong>"CCM Token"</strong> — the ERC-20 utility token deployed by
          CCM Network on Base mainnet (chain ID 8453). The CCM Token represents
          a unit of account inside the protocol; it is not a security in the
          jurisdictions where CCM Network operates, and it is not an investment
          contract.
        </li>
        <li>
          <strong>"SAFT"</strong> — Simple Agreement for Future Tokens, the
          off-chain legal contract between CCM Network and an accredited
          investor governing the pre-mainnet purchase of CCM Tokens.
        </li>
        <li>
          <strong>"Wallet"</strong> — a self-custodial Ethereum-compatible
          wallet (e.g. MetaMask, Coinbase Wallet, Rainbow, hardware wallets,
          Gnosis Safe).
        </li>
        <li>
          <strong>"KYC"</strong> — Know Your Customer identity verification
          performed by a third-party provider (Sumsub, Persona, or equivalent).
        </li>
        <li>
          <strong>"VARA"</strong> — the Virtual Assets Regulatory Authority of
          the Emirate of Dubai, under whose Carbon Credit Token guidance CCM
          Network is structured.
        </li>
      </ul>

      <h2>2. Eligibility</h2>
      <p>By using the Service you represent that:</p>
      <ul>
        <li>
          You are at least 18 years of age and have the legal capacity to enter
          into a binding agreement.
        </li>
        <li>
          You are <strong>not</strong> a citizen, resident, or located in any
          jurisdiction subject to comprehensive U.S., U.K., E.U., U.N., or
          Singaporean sanctions, including Cuba, Iran, North Korea, Syria, the
          Crimea region of Ukraine, the so-called Donetsk and Luhansk People's
          Republics, and any other jurisdiction designated by the foregoing
          authorities.
        </li>
        <li>
          You are <strong>not</strong> a "U.S. person" as defined in Regulation
          S under the U.S. Securities Act of 1933, unless you are an accredited
          investor under Rule 506(c) and have completed the SAFT process with
          us. The Service blocks U.S. persons at the KYC layer regardless.
        </li>
        <li>
          Use of the Service does not violate any applicable law or regulation
          of your jurisdiction.
        </li>
      </ul>

      <h2>3. Wallet connection &amp; KYC</h2>
      <p>
        Some features of the Service (e.g. SAFT presale purchase, vesting
        release) require you to connect a self-custodial Wallet and complete
        KYC. We do not custody your Wallet or its private keys; you are solely
        responsible for the security of your seed phrase and devices.
      </p>
      <p>
        KYC is performed by our third-party identity-verification provider. By
        completing KYC you authorize the provider to share verification results
        with the Foundation, and you agree to the provider's terms and privacy
        policy in addition to ours.
      </p>

      <h2>4. The CCM Token</h2>
      <p>
        The CCM Token is a utility token whose primary purpose is to provide
        access to functions of the CCM Network protocol — staking, fee payment,
        retirement of carbon credit NFTs, and protocol governance once enabled.
      </p>
      <p>
        <strong>The CCM Token is not:</strong>
      </p>
      <ul>
        <li>A claim on the assets, revenues, or profits of the Foundation;</li>
        <li>A security, share, debt instrument, or financial product;</li>
        <li>A guarantee of any future return, profit, or appreciation;</li>
        <li>A means of payment, e-money, or fiat-backed stablecoin.</li>
      </ul>
      <p>
        Token holders should not expect price appreciation. The market price of
        the CCM Token may rise, fall, or go to zero at any time.
      </p>

      <h2>5. SAFT presale and vesting</h2>
      <p>
        Pre-mainnet purchases of CCM Tokens are governed by the SAFT signed
        between you and the Foundation. The SAFT contains the canonical terms
        for price, allocation, lockup, vesting, and revocation. In the event of
        any conflict between these Terms and the SAFT, the SAFT controls for
        SAFT investors.
      </p>
      <p>
        SAFT-allocated tokens vest according to the schedule recorded on-chain
        in the CCMVesting smart contract. The released tokens may be claimed by
        the beneficiary's Wallet at any time after the cliff. Vesting is
        irrevocable for SAFT investors except where the SAFT explicitly
        provides for revocation.
      </p>

      <h2>6. Smart contract risk</h2>
      <p>
        The Service relies on open-source smart contracts deployed on Base
        mainnet. While the contracts have been internally reviewed, statically
        analyzed (Slither), tested (370+ unit tests), and undergo external
        audit, smart contracts may contain undiscovered vulnerabilities that
        result in loss of tokens. The Foundation makes no warranty as to the
        absence of such vulnerabilities.
      </p>
      <p>
        Privileged operations (mint, pause, role grant, vesting management) are
        controlled by a Gnosis Safe multisig and a 48-hour TimelockController.
        These mechanisms reduce but do not eliminate the risk of operator error
        or compromise.
      </p>

      <h2>7. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>
          Use the Service for any illegal, fraudulent, or harmful purpose —
          including money laundering, terrorist financing, sanctions evasion,
          or market manipulation;
        </li>
        <li>
          Attempt to gain unauthorized access to any part of the Service,
          probe, scan, or test the vulnerability of any system without our
          prior written consent (bug bounty submissions through Immunefi are
          welcome — see our{" "}
          <a href="https://github.com/ccm-network/ccm/blob/main/onchain/SECURITY.md">
            Security Policy
          </a>
          );
        </li>
        <li>
          Impersonate any person or entity, or misrepresent your affiliation
          with the Foundation;
        </li>
        <li>
          Use any automated means (bots, scrapers, MEV searchers acting in bad
          faith) to interfere with the orderly operation of the Service;
        </li>
        <li>
          Reverse engineer, decompile, or attempt to extract the source code of
          our backend except to the extent permitted by applicable law.
        </li>
      </ul>

      <h2>8. Intellectual property</h2>
      <p>
        The Foundation owns the brand, the wordmark, and the marketing
        materials. The smart contract source code is licensed under the MIT
        License and may be freely forked. The whitepaper and design documents
        are available under a Creative Commons CC BY 4.0 license unless
        otherwise marked.
      </p>

      <h2>9. Disclaimers</h2>
      <p>
        THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF
        ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES
        OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT,
        OR THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, ERROR-FREE, OR FREE
        FROM HARMFUL COMPONENTS.
      </p>

      <h2>10. Limitation of liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE FOUNDATION,
        ITS DIRECTORS, OFFICERS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT
        BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
        PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, USE, OR
        GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF, OR
        INABILITY TO USE, THE SERVICE — WHETHER BASED ON CONTRACT, TORT
        (INCLUDING NEGLIGENCE), STRICT LIABILITY, OR ANY OTHER LEGAL THEORY,
        EVEN IF THE FOUNDATION HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH
        DAMAGES.
      </p>
      <p>
        Some jurisdictions do not allow the exclusion of certain warranties or
        the limitation of liability for consequential damages, so some of the
        above limitations may not apply to you.
      </p>

      <h2>11. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless the Foundation and its
        affiliates from any claim, demand, loss, or damage (including
        reasonable attorneys' fees) arising from your use of the Service, your
        breach of these Terms, or your violation of any law or third-party
        right.
      </p>

      <h2>12. Termination</h2>
      <p>
        We may suspend or terminate your access to the Service at any time,
        without prior notice or liability, for any reason — including breach of
        these Terms, change in applicable law, or operational necessity. Your
        on-chain holdings of the CCM Token are unaffected by such termination
        and remain yours under the rules of the smart contract.
      </p>

      <h2>13. Changes to these Terms</h2>
      <p>
        We may revise these Terms from time to time. The revised Terms will be
        posted at this URL with an updated "Effective date". Material changes
        will be announced through our official channels. Your continued use of
        the Service after changes take effect constitutes acceptance of the
        revised Terms.
      </p>

      <h2>14. Governing law &amp; dispute resolution</h2>
      <p>
        These Terms are governed by the laws of the Emirate of Dubai (United
        Arab Emirates), without regard to its conflict-of-laws rules. Any
        dispute arising out of or related to these Terms or the Service shall
        be resolved by binding arbitration administered by the Dubai
        International Arbitration Centre (DIAC) under its Arbitration Rules,
        with the seat of arbitration in Dubai and the proceedings conducted in
        English.
      </p>
      <p>
        You waive any right to participate in a class action or class
        arbitration against the Foundation.
      </p>

      <h2>15. Contact</h2>
      <p>
        For questions about these Terms, contact{" "}
        <a href="mailto:legal@ccmnetwork.net">legal@ccmnetwork.net</a>.
      </p>
    </LegalLayout>
  );
}
