"use client";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Position, Settings } from "@/lib/types";
import { createGist, pullGist, pushGist } from "@/lib/gist-sync";

export function SyncPanel({
  open,
  onClose,
  settings,
  setSettings,
  positions,
  replaceAll,
}: {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  setSettings: (updater: (s: Settings) => Settings) => void;
  positions: Position[];
  replaceAll: (next: Position[]) => void;
}) {
  const [token, setToken] = useState(settings.githubToken ?? "");
  const [gistId, setGistId] = useState(settings.gistId ?? "");
  const [busy, setBusy] = useState<"" | "save" | "push" | "pull" | "create">("");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const save = () => {
    setSettings((s) => ({
      ...s,
      githubToken: token.trim() || undefined,
      gistId: gistId.trim() || undefined,
    }));
    setMsg("Sync settings saved");
    setError(null);
  };

  const doCreate = async () => {
    if (!token.trim()) {
      setError("Paste a GitHub token first");
      return;
    }
    setBusy("create");
    setError(null);
    try {
      const id = await createGist(token.trim(), positions);
      setGistId(id);
      setSettings((s) => ({
        ...s,
        githubToken: token.trim(),
        gistId: id,
        lastPushedAt: new Date().toISOString(),
      }));
      setMsg(`Created new gist ${id.slice(0, 8)}…`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "create failed");
    } finally {
      setBusy("");
    }
  };

  const doPush = async () => {
    if (!token.trim() || !gistId.trim()) {
      setError("Need both token and gist ID");
      return;
    }
    setBusy("push");
    setError(null);
    try {
      await pushGist(token.trim(), gistId.trim(), positions);
      setSettings((s) => ({ ...s, lastPushedAt: new Date().toISOString() }));
      setMsg("Pushed to gist");
    } catch (err) {
      setError(err instanceof Error ? err.message : "push failed");
    } finally {
      setBusy("");
    }
  };

  const doPull = async () => {
    if (!token.trim() || !gistId.trim()) {
      setError("Need both token and gist ID");
      return;
    }
    if (positions.length > 0) {
      if (!confirm("Pull will replace your local positions. Continue?")) return;
    }
    setBusy("pull");
    setError(null);
    try {
      const data = await pullGist(token.trim(), gistId.trim());
      replaceAll(data.positions);
      setSettings((s) => ({ ...s, lastPulledAt: new Date().toISOString() }));
      setMsg(`Pulled ${data.positions.length} positions`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "pull failed");
    } finally {
      setBusy("");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col border-l border-line bg-ink-950/95 backdrop-blur-2xl"
          >
            <header className="flex items-center justify-between border-b border-line px-6 py-5">
              <div>
                <h2 className="text-xl font-medium">Sync</h2>
                <p className="text-xs text-mute">GitHub Gist · cross-device</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg border border-line bg-white/[0.03] px-3 py-1.5 text-sm text-mute transition-colors hover:bg-white/[0.08] hover:text-chalk"
              >
                Close
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-5">
                <div className="rounded-lg border border-line bg-white/[0.02] p-4 text-xs text-mute">
                  <p>
                    Create a GitHub personal access token with the{" "}
                    <span className="font-mono text-chalk">gist</span> scope,
                    paste it below, then create a new private gist or paste an
                    existing gist ID to sync across devices.
                  </p>
                  <a
                    href="https://github.com/settings/tokens?type=beta"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-chalk underline"
                  >
                    Generate token →
                  </a>
                </div>

                <label className="block">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-mute">
                    GitHub token
                  </span>
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_…"
                    className="mt-1.5 w-full rounded-lg border border-line bg-white/[0.03] px-3 py-2.5 font-mono text-sm text-chalk placeholder:text-mute/40 focus:border-white/30 focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-mute">
                    Gist ID (optional — create one below)
                  </span>
                  <input
                    type="text"
                    value={gistId}
                    onChange={(e) => setGistId(e.target.value)}
                    placeholder="abc123…"
                    className="mt-1.5 w-full rounded-lg border border-line bg-white/[0.03] px-3 py-2.5 font-mono text-sm text-chalk placeholder:text-mute/40 focus:border-white/30 focus:outline-none"
                  />
                </label>

                <label className="flex items-center gap-3 rounded-lg border border-line bg-white/[0.02] px-4 py-3">
                  <input
                    type="checkbox"
                    checked={settings.autoSync}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, autoSync: e.target.checked }))
                    }
                    className="h-4 w-4 accent-chalk"
                  />
                  <div>
                    <div className="text-sm text-chalk">Auto-push on changes</div>
                    <div className="text-xs text-mute">
                      Debounced 5s after the last edit
                    </div>
                  </div>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={save}
                    className="rounded-lg border border-line bg-white/[0.03] py-2 text-sm text-chalk transition-colors hover:bg-white/[0.08]"
                  >
                    Save
                  </button>
                  <button
                    onClick={doCreate}
                    disabled={busy === "create"}
                    className="rounded-lg border border-line bg-white/[0.03] py-2 text-sm text-chalk transition-colors hover:bg-white/[0.08] disabled:opacity-50"
                  >
                    {busy === "create" ? "Creating…" : "Create new gist"}
                  </button>
                  <button
                    onClick={doPush}
                    disabled={busy === "push"}
                    className="rounded-lg bg-chalk py-2 text-sm font-medium text-ink-950 transition-transform hover:scale-[1.02] disabled:opacity-50"
                  >
                    {busy === "push" ? "Pushing…" : "⬆ Push"}
                  </button>
                  <button
                    onClick={doPull}
                    disabled={busy === "pull"}
                    className="rounded-lg border border-chalk/40 py-2 text-sm font-medium text-chalk transition-colors hover:bg-white/[0.05] disabled:opacity-50"
                  >
                    {busy === "pull" ? "Pulling…" : "⬇ Pull"}
                  </button>
                </div>

                {(settings.lastPushedAt || settings.lastPulledAt) && (
                  <div className="space-y-1 text-xs text-mute">
                    {settings.lastPushedAt && (
                      <div>
                        Last push:{" "}
                        <span className="font-mono text-chalk">
                          {new Date(settings.lastPushedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {settings.lastPulledAt && (
                      <div>
                        Last pull:{" "}
                        <span className="font-mono text-chalk">
                          {new Date(settings.lastPulledAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {msg && (
                  <div className="rounded-lg border border-gain/40 bg-gain/10 px-3 py-2 text-xs text-gain">
                    {msg}
                  </div>
                )}
                {error && (
                  <div className="rounded-lg border border-loss/40 bg-loss/10 px-3 py-2 text-xs text-loss">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
