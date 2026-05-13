import type { Env, NotificationKind } from "./types";
import { readScheduleCount, readSchedule, readReleasable } from "./chain";
import { getUser, alreadySent, markSent } from "./db";
import {
  sendEmail,
  renderClaimReady,
  renderCliff7d,
  renderCliff1d,
} from "./email";
import { formatCCM, formatUnlockDate } from "./format";

const DAY = 86_400n;
const HALF_DAY = DAY / 2n;
const SEVEN_DAYS = 7n * DAY;

type Now = () => number;

export async function runScheduled(env: Env, now: Now = () => Math.floor(Date.now() / 1000)) {
  const count = await readScheduleCount(env);
  for (let id = 0n; id < count; id++) {
    try {
      await processOne(env, id, now);
    } catch (e) {
      console.error("scheduled:", id, e);
    }
  }
}

async function processOne(env: Env, id: bigint, now: Now) {
  const s = await readSchedule(env, id);
  if (s.revoked) return;
  const user = await getUser(env.DB, s.beneficiary);
  if (!user || !user.email || user.email_verified !== 1) return;
  const prefs = JSON.parse(user.notif_prefs) as Record<NotificationKind, boolean>;

  const cliffEnd = s.startTime + s.cliffDuration;
  const dt = cliffEnd - BigInt(now());

  if (prefs.cliff_7d && dt > (SEVEN_DAYS - HALF_DAY) && dt <= (SEVEN_DAYS + HALF_DAY)) {
    await maybeSend(env, user.address, Number(id), "cliff_7d", () =>
      renderCliff7d({ appBaseUrl: env.APP_BASE_URL, unlockDate: formatUnlockDate(cliffEnd) }),
      user.email!, now,
    );
  }

  if (prefs.cliff_1d && dt > (DAY - HALF_DAY) && dt <= (DAY + HALF_DAY)) {
    await maybeSend(env, user.address, Number(id), "cliff_1d", () =>
      renderCliff1d({ appBaseUrl: env.APP_BASE_URL, unlockDate: formatUnlockDate(cliffEnd) }),
      user.email!, now,
    );
  }

  if (prefs.claim_ready) {
    const releasable = await readReleasable(env, id);
    if (releasable > 0n) {
      await maybeSend(env, user.address, Number(id), "claim_ready", () =>
        renderClaimReady({
          appBaseUrl: env.APP_BASE_URL,
          releasable: formatCCM(releasable),
          symbol: "CCM",
          scheduleId: Number(id),
        }),
        user.email!, now,
      );
    }
  }
}

async function maybeSend(
  env: Env,
  address: string,
  scheduleId: number,
  kind: NotificationKind,
  render: () => { subject: string; html: string; text: string },
  toEmail: string,
  now: Now,
) {
  if (await alreadySent(env.DB, address, scheduleId, kind)) return;
  const tpl = render();
  const ok = await sendEmail({
    apiKey: env.RESEND_API_KEY,
    from: env.RESEND_FROM,
    to: toEmail,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
  });
  if (ok) await markSent(env.DB, address, scheduleId, kind, now());
}
