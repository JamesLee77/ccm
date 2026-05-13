export interface SendEmailInput {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      from: input.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });
  return res.ok;
}

interface VerifyParams { apiBaseUrl: string; token: string; }
export function renderEmailVerify({ apiBaseUrl, token }: VerifyParams) {
  const url = `${apiBaseUrl}/api/email/verify?token=${encodeURIComponent(token)}`;
  return {
    subject: "Verify your CCM Network portal email",
    html: `<p>Click to verify your email:</p><p><a href="${url}">${url}</a></p><p>This link expires in 24 hours.</p>`,
    text: `Verify your email: ${url}\nThis link expires in 24 hours.`,
  };
}

interface ClaimParams {
  appBaseUrl: string;
  releasable: string;
  symbol: string;
  scheduleId: number;
}
export function renderClaimReady({ appBaseUrl, releasable, symbol, scheduleId }: ClaimParams) {
  const url = `${appBaseUrl}/vesting`;
  return {
    subject: `${releasable} ${symbol} ready to claim`,
    html: `<p>You have <strong>${releasable} ${symbol}</strong> ready to claim from schedule #${scheduleId}.</p>
           <p><a href="${url}">Open the portal</a> to release it.</p>`,
    text: `You have ${releasable} ${symbol} ready to claim from schedule #${scheduleId}. Open ${url}.`,
  };
}

interface CliffParams {
  appBaseUrl: string;
  unlockDate: string;
}
export function renderCliff7d({ appBaseUrl, unlockDate }: CliffParams) {
  const url = `${appBaseUrl}/vesting`;
  return {
    subject: "Your CCM cliff ends in 7 days",
    html: `<p>Your CCM vesting cliff ends on <strong>${unlockDate}</strong>.</p>
           <p>After that, claimable tokens will start accruing linearly.</p>
           <p><a href="${url}">Open the portal</a>.</p>`,
    text: `Your CCM vesting cliff ends on ${unlockDate}. Open ${url}.`,
  };
}

export function renderCliff1d({ appBaseUrl, unlockDate }: CliffParams) {
  const url = `${appBaseUrl}/vesting`;
  return {
    subject: "Your CCM cliff ends tomorrow",
    html: `<p>Your CCM vesting cliff ends tomorrow (<strong>${unlockDate}</strong>).</p>
           <p><a href="${url}">Open the portal</a>.</p>`,
    text: `Your CCM vesting cliff ends tomorrow (${unlockDate}). Open ${url}.`,
  };
}
