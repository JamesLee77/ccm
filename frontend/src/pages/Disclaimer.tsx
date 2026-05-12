import LegalLayout from "../components/site/LegalLayout";

export default function Disclaimer() {
  return (
    <LegalLayout title="Risk Disclosure" effective="2026-05-10">
      <p>
        This Risk Disclosure is provided for informational purposes only and
        is not, and should not be construed as, financial, legal, tax, or
        investment advice. By accessing CCM Network you acknowledge that you
        have read, understood, and accept the risks below. If you do not
        understand any of the risks, you should not interact with the
        Service.
      </p>

      <h2>1. No investment advice</h2>
      <p>
        Nothing on the Service or in our materials constitutes an offer to
        sell, a solicitation of an offer to buy, or a recommendation of any
        security or financial instrument. The CCM Token is a utility token,
        not a security. You should consult an independent qualified financial
        advisor and legal counsel before participating in the Service.
      </p>

      <h2>2. Token price risk</h2>
      <p>
        The CCM Token may trade on secondary markets after Phase 0. Token
        prices are highly volatile and may fall to zero. Past performance
        does not predict future returns. There is no buyback, no
        market-making commitment, and no guaranteed liquidity. The Foundation
        does not warrant that any market will ever develop, or that any
        market that develops will continue.
      </p>

      <h2>3. Smart contract risk</h2>
      <p>
        The Service relies on open-source smart contracts deployed on Base
        mainnet. Despite internal review, static analysis (Slither), an
        extensive unit test suite (370+ tests), end-to-end rehearsal on Base
        Sepolia, an external audit by a recognized firm, and a $500K-cap
        Immunefi bug bounty, smart contracts may contain vulnerabilities that
        result in:
      </p>
      <ul>
        <li>Permanent loss of locked tokens;</li>
        <li>Unintended minting or burning of supply;</li>
        <li>Front-running or sandwich attacks;</li>
        <li>Re-entrancy or other implementation bugs.</li>
      </ul>
      <p>
        Once deployed, the contracts are non-upgradeable. A bug fix requires
        deploying a v2 and an opt-in migration; this is at the discretion of
        the multisig signers and subject to a 48-hour timelock delay.
      </p>

      <h2>4. Custody risk</h2>
      <p>
        The Service is non-custodial. You are responsible for the security
        of your seed phrase, hardware wallet, and signing devices. Loss of
        access to your wallet is permanent — there is no password reset and
        no recovery service. Phishing, malware, and social engineering
        attacks targeting users of crypto wallets are common; exercise
        heightened skepticism toward any communication asking you to sign,
        approve, or transfer.
      </p>

      <h2>5. Regulatory risk</h2>
      <p>
        Crypto-asset regulation is evolving rapidly. Future legislation,
        rulings, or enforcement actions in any jurisdiction may:
      </p>
      <ul>
        <li>Restrict or prohibit your access to the Service;</li>
        <li>Impose tax or reporting obligations on your holdings;</li>
        <li>
          Reclassify the CCM Token in ways that affect its utility or
          tradability;
        </li>
        <li>Require operational changes that materially affect the Foundation.</li>
      </ul>
      <p>
        The Foundation is structured under the Virtual Assets Regulatory
        Authority (VARA) of Dubai's Carbon Credit Token guidance, but no
        regulatory regime is permanent or universally applicable. You are
        responsible for ensuring your participation is lawful in your
        jurisdiction.
      </p>

      <h2>6. Counterparty risk (KYC, sale)</h2>
      <p>
        The SAFT presale involves the Foundation as a counterparty. While we
        operate under standard governance (multisig + timelock + bug bounty),
        residual counterparty risk includes:
      </p>
      <ul>
        <li>
          Operational failure or bankruptcy of the Foundation before mainnet
          deploy;
        </li>
        <li>
          Failure of the Foundation's banking, KYC, or hosting providers;
        </li>
        <li>
          Inability of the Foundation to deliver on its roadmap due to
          fundraising shortfall, technology shift, or external events.
        </li>
      </ul>

      <h2>7. Carbon credit market risk</h2>
      <p>
        The CCM Network protocol is designed to bridge voluntary carbon
        credits on-chain. The voluntary carbon market itself is subject to
        risks beyond the Foundation's control:
      </p>
      <ul>
        <li>
          Methodology and additionality concerns affecting the credibility of
          underlying credits;
        </li>
        <li>
          Verification body (VVB) failures resulting in retroactive
          invalidation of credits;
        </li>
        <li>
          Demand-side risk if corporate buyers shift to alternative
          decarbonization mechanisms;
        </li>
        <li>
          Government action that mandates or supersedes voluntary markets.
        </li>
      </ul>

      <h2>8. Forward-looking statements</h2>
      <p>
        Any roadmap, projection, or forward-looking statement made by the
        Foundation reflects current expectations and is subject to change.
        Actual results may differ materially from any plans or projections.
        The Foundation undertakes no obligation to update forward-looking
        statements.
      </p>

      <h2>9. No fiduciary relationship</h2>
      <p>
        Your use of the Service does not create a fiduciary, advisory, or
        professional relationship between you and the Foundation. We act in
        the interest of the protocol and the holder community as a whole, not
        as your personal advisor.
      </p>

      <h2>10. Acknowledgement</h2>
      <p>
        By accessing the Service you confirm that:
      </p>
      <ol>
        <li>You have read and understand all of the risks above;</li>
        <li>
          You can financially absorb the total loss of any value committed to
          the Service;
        </li>
        <li>
          You are not relying on any statement, projection, or representation
          by the Foundation as a guarantee of future outcomes;
        </li>
        <li>
          Your decision to participate is based on your own independent
          research and the advice of your own qualified advisors.
        </li>
      </ol>

      <h2>11. Contact</h2>
      <p>
        For questions about this Risk Disclosure, contact{" "}
        <a href="mailto:legal@ccmnetwork.net">legal@ccmnetwork.net</a>. For
        security issues, see our{" "}
        <a href="https://github.com/ccm-network/ccm/blob/main/onchain/SECURITY.md">
          Security Policy
        </a>
        .
      </p>
    </LegalLayout>
  );
}
