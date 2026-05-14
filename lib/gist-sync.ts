import type { Position, Settings } from "./types";

const GIST_FILENAME = "mystocks-portfolio.json";
const API = "https://api.github.com";

type GistPayload = {
  positions: Position[];
  exportedAt: string;
  version: 1;
};

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export async function createGist(
  token: string,
  positions: Position[],
): Promise<string> {
  const payload: GistPayload = {
    positions,
    exportedAt: new Date().toISOString(),
    version: 1,
  };
  const res = await fetch(`${API}/gists`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      description: "MyStocks portfolio sync",
      public: false,
      files: {
        [GIST_FILENAME]: { content: JSON.stringify(payload, null, 2) },
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Gist create failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.id as string;
}

export async function pushGist(
  token: string,
  gistId: string,
  positions: Position[],
): Promise<void> {
  const payload: GistPayload = {
    positions,
    exportedAt: new Date().toISOString(),
    version: 1,
  };
  const res = await fetch(`${API}/gists/${gistId}`, {
    method: "PATCH",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      files: {
        [GIST_FILENAME]: { content: JSON.stringify(payload, null, 2) },
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Gist push failed: ${res.status} ${await res.text()}`);
  }
}

export async function pullGist(
  token: string,
  gistId: string,
): Promise<GistPayload> {
  const res = await fetch(`${API}/gists/${gistId}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(`Gist pull failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const file = data.files?.[GIST_FILENAME];
  if (!file?.content) {
    throw new Error(`Gist does not contain ${GIST_FILENAME}`);
  }
  return JSON.parse(file.content) as GistPayload;
}

export type SyncDeps = {
  token: string;
  gistId: string;
};

export function readyForSync(s: Settings): SyncDeps | null {
  if (!s.githubToken || !s.gistId) return null;
  return { token: s.githubToken, gistId: s.gistId };
}
