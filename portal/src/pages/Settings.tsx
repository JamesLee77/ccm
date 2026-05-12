import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import i18n from "../lib/i18n";
import { useAccount } from "wagmi";
import { api } from "../lib/api";
import { useSession } from "../hooks/useSession";
import CopyableAddress from "../components/CopyableAddress";
import { Card, CTA, H1, H2, SectionLabel } from "../components/site/primitives";

export default function Settings() {
  const { t } = useTranslation(["settings", "common"]);
  const { isConnected } = useAccount();
  const { me, signing, signIn, signOut, refresh, error } = useSession();
  const [emailInput, setEmailInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [params] = useSearchParams();
  const verifiedFlash = params.get("emailVerified");

  useEffect(() => {
    if (me?.email) setEmailInput(me.email);
  }, [me?.email]);

  if (!isConnected) {
    return (
      <Card className="text-center">
        <p style={{ color: "var(--ink-soft)" }}>{t("common:connect")}</p>
      </Card>
    );
  }

  if (!me) {
    return (
      <div className="space-y-10">
        <header>
          <SectionLabel className="mb-3">Settings</SectionLabel>
          <H1>{t("settings:title")}</H1>
        </header>
        <Card>
          <H2 className="mb-3">{t("settings:signIn.title")}</H2>
          <p className="font-mono text-[12px] mb-5" style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
            {t("settings:signIn.description")}
          </p>
          <CTA
            label={signing ? t("settings:signIn.signing") : t("settings:signIn.button")}
            onClick={() => void signIn()}
            disabled={signing}
          />
          {error && (
            <p className="font-mono text-[12px] mt-3" style={{ color: "#ef4444" }}>{error}</p>
          )}
        </Card>
      </div>
    );
  }

  async function subscribe() {
    setSaving(true);
    try { await api.subscribeEmail(emailInput); await refresh(); }
    finally { setSaving(false); }
  }
  async function unsubscribe() {
    setSaving(true);
    try { await api.unsubscribeEmail(); await refresh(); }
    finally { setSaving(false); }
  }
  async function togglePref(key: "cliff_7d" | "cliff_1d" | "claim_ready") {
    if (!me) return;
    setSaving(true);
    try {
      await api.updateMe({ notif_prefs: { ...me.notif_prefs, [key]: !me.notif_prefs[key] } });
      await refresh();
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-10">
      <header>
        <SectionLabel className="mb-3">Settings</SectionLabel>
        <H1>{t("settings:title")}</H1>
      </header>

      {verifiedFlash === "ok" && (
        <div
          className="border p-4 font-mono text-[12px]"
          style={{ background: "rgba(45,191,99,0.08)", borderColor: "var(--moss)", color: "var(--moss)" }}
        >
          {t("settings:verified")}
        </div>
      )}
      {verifiedFlash === "error" && (
        <div
          className="border p-4 font-mono text-[12px]"
          style={{ background: "rgba(239,68,68,0.08)", borderColor: "#ef4444", color: "#ef4444" }}
        >
          {t("settings:verifyError")}
        </div>
      )}

      <Card>
        <H2 className="mb-4">{t("settings:wallet.title")}</H2>
        <div className="font-mono text-[13px] mb-3" style={{ color: "var(--ink)" }}>
          <span style={{ color: "var(--ink-soft)" }}>{t("settings:wallet.connected")}: </span>
          <CopyableAddress address={me.address} withExplorer />
        </div>
        <button
          onClick={() => void signOut()}
          className="font-mono text-[11px] tracking-[0.12em] uppercase underline transition-colors"
          style={{ color: "var(--ink-soft)" }}
        >
          {t("settings:wallet.disconnect")}
        </button>
      </Card>

      <Card>
        <H2 className="mb-3">{t("settings:email.title")}</H2>
        <p className="font-mono text-[12px] mb-5" style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
          {t("settings:email.description")}
        </p>
        <div className="flex gap-3 mb-3">
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder={t("settings:email.placeholder")}
            className="flex-1 bg-transparent border px-3 py-2 font-mono text-sm"
            style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
          />
          <CTA
            label={t("settings:email.subscribe")}
            onClick={() => void subscribe()}
            disabled={saving || !emailInput}
          />
        </div>
        {me.email && (
          <div className="font-mono text-[12px] flex items-center gap-3 flex-wrap" style={{ color: "var(--ink-soft)" }}>
            <span>{t("settings:email.subscribed")}:</span>
            <span style={{ color: "var(--ink)" }}>{me.email}</span>
            {me.email_verified ? (
              <span style={{ color: "var(--moss)" }}>✓ {t("settings:email.verified")}</span>
            ) : (
              <span style={{ color: "var(--clay)" }}>{t("settings:email.unverified")}</span>
            )}
            <button
              onClick={() => void unsubscribe()}
              className="ml-auto underline transition-colors"
              style={{ color: "var(--ink-soft)" }}
            >
              {t("settings:email.remove")}
            </button>
          </div>
        )}
      </Card>

      <Card>
        <H2 className="mb-4">{t("settings:prefs.title")}</H2>
        <div className="space-y-3">
          {(["cliff_7d", "cliff_1d", "claim_ready"] as const).map((k) => (
            <label key={k} className="flex items-center gap-3 font-mono text-[13px]" style={{ color: "var(--ink)" }}>
              <input
                type="checkbox"
                checked={me.notif_prefs[k]}
                onChange={() => void togglePref(k)}
                className="size-4"
                style={{ accentColor: "var(--moss)" }}
                disabled={saving}
              />
              {t(`settings:prefs.${k}`)}
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <H2 className="mb-4">{t("settings:language.title")}</H2>
        <select
          value={me.language}
          disabled={saving}
          onChange={async (e) => {
            setSaving(true);
            try {
              await api.updateMe({ language: e.target.value });
              void i18n.changeLanguage(e.target.value);
              await refresh();
            } finally { setSaving(false); }
          }}
          className="bg-transparent border px-3 py-2 font-mono text-sm"
          style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
        >
          <option value="en">{t("settings:language.en")}</option>
        </select>
      </Card>
    </div>
  );
}
