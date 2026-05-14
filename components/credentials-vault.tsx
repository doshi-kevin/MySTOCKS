"use client";
import { motion } from "motion/react";
import { useState } from "react";
import type { VaultEntry } from "@/lib/types";

function mask(token: string): string {
  if (token.length <= 8) return "•".repeat(token.length);
  return token.slice(0, 4) + "•".repeat(Math.max(8, token.length - 8)) + token.slice(-4);
}

export function CredentialsVault({
  vault,
  activeGistId,
  onUse,
  onDelete,
  onAdd,
}: {
  vault: VaultEntry[];
  activeGistId?: string;
  onUse: (entry: VaultEntry) => void;
  onDelete: (id: string) => void;
  onAdd: (entry: Omit<VaultEntry, "id" | "createdAt">) => void;
}) {
  const [showId, setShowId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ label: "", token: "", gistId: "" });

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  const submitAdd = () => {
    if (!draft.token.trim() || !draft.gistId.trim()) return;
    onAdd({
      label: draft.label.trim() || "Untitled",
      token: draft.token.trim(),
      gistId: draft.gistId.trim(),
    });
    setDraft({ label: "", token: "", gistId: "" });
    setAdding(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mt-12 overflow-hidden rounded-3xl border border-line bg-white/[0.03] backdrop-blur-xl"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-white/[0.02]"
      >
        <div className="text-left">
          <div className="text-[10px] uppercase tracking-[0.25em] text-mute">
            Credentials vault
          </div>
          <div className="mt-1 text-sm text-chalk">
            {vault.length === 0
              ? "No saved tokens or gist IDs yet"
              : `${vault.length} saved ${vault.length === 1 ? "entry" : "entries"}`}
          </div>
        </div>
        <span className="text-mute">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="border-t border-line px-6 py-5">
          {vault.length === 0 && !adding && (
            <p className="mb-4 text-xs text-mute">
              Set up sync once and credentials get auto-saved here. Or add them
              manually below — they live in localStorage, so they survive
              browser refreshes but stay on this device.
            </p>
          )}

          {vault.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-separate border-spacing-y-1.5 text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-mute">
                    <th className="px-3 pb-2 font-normal">Label</th>
                    <th className="px-3 pb-2 font-normal">Token</th>
                    <th className="px-3 pb-2 font-normal">Gist ID</th>
                    <th className="px-3 pb-2 font-normal">Created</th>
                    <th className="px-3 pb-2 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vault.map((e) => {
                    const active = e.gistId === activeGistId;
                    const reveal = showId === e.id;
                    return (
                      <tr
                        key={e.id}
                        className={
                          "rounded-lg " +
                          (active
                            ? "bg-gain/10 ring-1 ring-gain/30"
                            : "bg-white/[0.02]")
                        }
                      >
                        <td className="rounded-l-lg px-3 py-3 align-middle">
                          <div className="flex items-center gap-2">
                            {active && (
                              <span className="h-1.5 w-1.5 rounded-full bg-gain" />
                            )}
                            <span className="text-chalk">{e.label}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-middle font-mono text-xs tabular text-chalk">
                          <div className="flex items-center gap-2">
                            <span className="truncate" title={reveal ? e.token : mask(e.token)}>
                              {reveal ? e.token : mask(e.token)}
                            </span>
                            <button
                              onClick={() =>
                                setShowId(reveal ? null : e.id)
                              }
                              className="rounded border border-line bg-white/[0.03] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-mute hover:text-chalk"
                            >
                              {reveal ? "Hide" : "Show"}
                            </button>
                            <button
                              onClick={() => copy(e.token)}
                              className="rounded border border-line bg-white/[0.03] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-mute hover:text-chalk"
                              title="Copy token"
                            >
                              Copy
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-middle font-mono text-xs tabular text-chalk">
                          <div className="flex items-center gap-2">
                            <span className="truncate" title={e.gistId}>
                              {e.gistId.slice(0, 10)}…
                            </span>
                            <button
                              onClick={() => copy(e.gistId)}
                              className="rounded border border-line bg-white/[0.03] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-mute hover:text-chalk"
                              title="Copy gist ID"
                            >
                              Copy
                            </button>
                            <a
                              href={`https://gist.github.com/${e.gistId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded border border-line bg-white/[0.03] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-mute hover:text-chalk"
                              title="Open on GitHub"
                            >
                              Open
                            </a>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-middle text-xs text-mute">
                          {new Date(e.createdAt).toLocaleDateString()}
                        </td>
                        <td className="rounded-r-lg px-3 py-3 align-middle">
                          <div className="flex items-center justify-end gap-1.5">
                            {!active && (
                              <button
                                onClick={() => onUse(e)}
                                className="rounded-lg bg-chalk px-2.5 py-1 text-[11px] font-medium text-ink-950 hover:scale-[1.03]"
                              >
                                Use this
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (confirm(`Delete "${e.label}"?`)) onDelete(e.id);
                              }}
                              className="rounded-lg border border-line bg-white/[0.03] px-2 py-1 text-[11px] text-mute hover:text-loss"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* add manually */}
          <div className="mt-4">
            {!adding ? (
              <button
                onClick={() => setAdding(true)}
                className="rounded-lg border border-line bg-white/[0.03] px-3 py-2 text-xs text-mute transition-colors hover:bg-white/[0.08] hover:text-chalk"
              >
                + Add credentials manually
              </button>
            ) : (
              <div className="rounded-xl border border-line bg-white/[0.02] p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Input
                    label="Label"
                    value={draft.label}
                    onChange={(v) => setDraft((d) => ({ ...d, label: v }))}
                    placeholder="Laptop"
                  />
                  <Input
                    label="Token"
                    value={draft.token}
                    onChange={(v) => setDraft((d) => ({ ...d, token: v }))}
                    placeholder="ghp_…"
                  />
                  <Input
                    label="Gist ID"
                    value={draft.gistId}
                    onChange={(v) => setDraft((d) => ({ ...d, gistId: v }))}
                    placeholder="abc123…"
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={submitAdd}
                    className="rounded-lg bg-chalk px-3 py-1.5 text-xs font-medium text-ink-950"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setAdding(false);
                      setDraft({ label: "", token: "", gistId: "" });
                    }}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs text-mute hover:text-chalk"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="mt-4 text-[11px] text-mute/70">
            Tokens are stored unencrypted in your browser&apos;s localStorage. Anyone
            with access to this device + browser profile can read them.
          </p>
        </div>
      )}
    </motion.div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.2em] text-mute">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-line bg-white/[0.03] px-3 py-2 font-mono text-xs text-chalk placeholder:text-mute/40 focus:border-white/30 focus:outline-none"
      />
    </label>
  );
}
