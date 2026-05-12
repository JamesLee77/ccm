import LegalLayout from "../components/site/LegalLayout";

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Policy" effective="2026-05-10">
      <p>
        This Privacy Policy describes how CCM Network (the{" "}
        <strong>"Foundation"</strong>) collects, uses, and shares personal
        data when you use our websites at <code>ccmnetwork.net</code>,{" "}
        <code>portal.ccmnetwork.net</code>, <code>testnet.ccmnetwork.net</code>,
        and the related smart contracts on Base mainnet (the{" "}
        <strong>"Service"</strong>).
      </p>

      <h2>1. What we collect</h2>

      <h3>1.1 Information you provide directly</h3>
      <ul>
        <li>
          <strong>Wallet address.</strong> When you connect a self-custodial
          wallet, your public Ethereum address is stored to link on-chain
          activity to your account preferences. We do not have access to your
          private keys.
        </li>
        <li>
          <strong>Email address (optional).</strong> If you opt in, you may
          provide an email address to receive notifications about cliff
          unlocks, claim availability, and protocol announcements.
        </li>
        <li>
          <strong>KYC data (for SAFT investors).</strong> Government-issued ID,
          proof of address, selfie, and other identity-verification documents.
          KYC is performed by our third-party provider (Sumsub or Persona) and
          we receive only the verification result and a reference id, not the
          underlying documents themselves.
        </li>
        <li>
          <strong>SAFT contract data.</strong> Legal name, jurisdiction,
          accreditation status, allocation tier, and signed SAFT document.
        </li>
      </ul>

      <h3>1.2 Information collected automatically</h3>
      <ul>
        <li>
          <strong>Network metadata.</strong> IP address, country (derived from
          IP), browser type, device type, and language preference. This data
          is processed by Cloudflare as our edge provider.
        </li>
        <li>
          <strong>On-chain activity.</strong> All transactions on Base mainnet
          are publicly visible by design. Your wallet's interactions with our
          smart contracts (purchase, claim, transfer) are recorded immutably
          on-chain. We index this public data for product features (Dashboard,
          Vesting page).
        </li>
        <li>
          <strong>Cookies.</strong> We use a minimal set of cookies for
          authentication (SIWE session) and theme preference. We do not use
          third-party tracking, advertising, or behavioral cookies.
        </li>
      </ul>

      <h2>2. How we use your data</h2>
      <p>We process personal data for the following purposes:</p>
      <ul>
        <li>
          <strong>Service provision</strong> — to operate the wallet
          connection, vesting display, and SAFT investor portal;
        </li>
        <li>
          <strong>Compliance</strong> — to meet our legal obligations under
          AML/CFT, sanctions screening, and securities regulations in the
          jurisdictions where we operate;
        </li>
        <li>
          <strong>Communication</strong> — to send you transactional
          notifications you opted in for (cliff reminder, claim ready,
          protocol upgrades);
        </li>
        <li>
          <strong>Security</strong> — to detect fraud, abuse, and unauthorized
          access; to operate the admin audit log for operational oversight;
        </li>
        <li>
          <strong>Improvement</strong> — to understand how the Service is used,
          in aggregated and anonymized form, to inform product decisions.
        </li>
      </ul>

      <h2>3. Legal bases (GDPR / PIPA)</h2>
      <p>
        For users in the European Economic Area, we process personal data on
        the following legal bases under the GDPR (Articles 6 and 9):
      </p>
      <ul>
        <li>
          <strong>Performance of a contract</strong> (Art. 6(1)(b)) — to
          deliver the Service you requested when you connect a wallet or sign
          a SAFT.
        </li>
        <li>
          <strong>Compliance with legal obligation</strong> (Art. 6(1)(c)) —
          for KYC, sanctions screening, and tax reporting.
        </li>
        <li>
          <strong>Legitimate interests</strong> (Art. 6(1)(f)) — for security
          monitoring, fraud prevention, and product analytics that do not
          override your fundamental rights.
        </li>
        <li>
          <strong>Consent</strong> (Art. 6(1)(a)) — for optional email
          notifications. You may withdraw consent at any time without
          affecting the lawfulness of processing performed before withdrawal.
        </li>
      </ul>
      <p>
        For users in the Republic of Korea, we comply with the Personal
        Information Protection Act (개인정보 보호법, "PIPA"). The legal bases
        above map onto the corresponding consent and necessity provisions
        under PIPA Article 15.
      </p>

      <h2>4. Sharing with third parties</h2>
      <p>We share personal data only with the following categories of recipients:</p>
      <ul>
        <li>
          <strong>KYC providers</strong> (Sumsub, Persona) — strictly for
          identity verification and ongoing sanctions screening.
        </li>
        <li>
          <strong>Edge / hosting providers</strong> (Cloudflare) — to deliver
          the Service securely and reliably.
        </li>
        <li>
          <strong>Email delivery</strong> (Resend) — only if you opted in to
          email notifications, and only the email address itself is shared.
        </li>
        <li>
          <strong>Blockchain indexers</strong> (BaseScan, public RPC nodes) —
          we display links to public on-chain data; we do not transmit your
          off-chain data to indexers.
        </li>
        <li>
          <strong>Auditors and counsel</strong> — under confidentiality
          agreements, for security review, financial audit, and legal advice.
        </li>
        <li>
          <strong>Authorities</strong> — when required to comply with valid
          legal process (subpoena, court order, regulatory request) issued by
          a competent authority in a jurisdiction where we operate.
        </li>
      </ul>
      <p>
        We do <strong>not</strong> sell your personal data, and we do
        <strong> not</strong> share it with advertising networks.
      </p>

      <h2>5. International transfers</h2>
      <p>
        The Foundation operates internationally; personal data may be
        transferred to and processed in jurisdictions other than your own,
        including the UAE, the European Economic Area, the United States, and
        the Republic of Korea. Where required, we rely on appropriate
        safeguards such as the European Commission's Standard Contractual
        Clauses or equivalent mechanisms.
      </p>

      <h2>6. Data retention</h2>
      <p>
        We retain personal data for as long as necessary to provide the
        Service and comply with our legal obligations:
      </p>
      <ul>
        <li>
          <strong>KYC records</strong> — 5 years after the end of the business
          relationship, as required by AML legislation;
        </li>
        <li>
          <strong>SAFT records</strong> — for the term of the SAFT plus 7
          years, as required for tax and securities recordkeeping;
        </li>
        <li>
          <strong>Wallet ↔ email / preferences</strong> — until you remove the
          email association or request deletion of your account preferences;
        </li>
        <li>
          <strong>Audit log entries</strong> — for at least 5 years for
          regulatory and operational forensics;
        </li>
        <li>
          <strong>On-chain data</strong> — permanent and outside our control
          (Base mainnet is a public ledger).
        </li>
      </ul>

      <h2>7. Your rights</h2>
      <p>Subject to your jurisdiction, you have the right to:</p>
      <ul>
        <li>
          <strong>Access</strong> — request a copy of the personal data we
          hold about you;
        </li>
        <li>
          <strong>Rectification</strong> — request correction of inaccurate
          data;
        </li>
        <li>
          <strong>Erasure</strong> — request deletion of off-chain personal
          data, subject to retention obligations above. On-chain data cannot
          be deleted.
        </li>
        <li>
          <strong>Restriction</strong> — request restriction of processing in
          certain circumstances;
        </li>
        <li>
          <strong>Portability</strong> — receive your data in a structured,
          machine-readable format;
        </li>
        <li>
          <strong>Objection</strong> — object to processing based on
          legitimate interests, including profiling;
        </li>
        <li>
          <strong>Withdraw consent</strong> — at any time, where processing is
          based on consent;
        </li>
        <li>
          <strong>Lodge a complaint</strong> — with a supervisory authority in
          your jurisdiction.
        </li>
      </ul>
      <p>
        To exercise these rights, email{" "}
        <a href="mailto:privacy@ccmnetwork.net">privacy@ccmnetwork.net</a>{" "}
        from the email address associated with your account, or sign a message
        proving control of your wallet address. We respond within 30 days.
      </p>

      <h2>8. Children's privacy</h2>
      <p>
        The Service is not directed at children under 18 and we do not
        knowingly collect personal data from children. If you believe we have
        collected such data, contact us and we will delete it.
      </p>

      <h2>9. Security</h2>
      <p>
        We implement industry-standard technical and organizational measures
        to protect personal data — TLS in transit, encryption at rest,
        principle of least privilege, multisig + 48-hour timelock on all
        privileged actions, and regular security review. No system is
        completely secure; we cannot guarantee absolute security.
      </p>

      <h2>10. Changes to this Policy</h2>
      <p>
        We may revise this Privacy Policy from time to time. The revised
        Policy will be posted at this URL with an updated "Effective date".
        Material changes will be announced through our official channels.
      </p>

      <h2>11. Contact</h2>
      <p>
        For privacy-related questions, contact{" "}
        <a href="mailto:privacy@ccmnetwork.net">privacy@ccmnetwork.net</a>.
      </p>
    </LegalLayout>
  );
}
