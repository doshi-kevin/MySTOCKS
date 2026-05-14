export type Position = {
  id: string;
  symbol: string;
  name: string;
  buyPrice: number;
  targetPrice: number;
  stoploss: number;
  buyDate: string;
  quantity: number;
  notes?: string;
  alertedTarget?: boolean;
  alertedStoploss?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Settings = {
  gistId?: string;
  githubToken?: string;
  autoSync: boolean;
  notificationsEnabled: boolean;
  lastPushedAt?: string;
  lastPulledAt?: string;
};

export type Quote = {
  symbol: string;
  price: number;
  dayChange: number;
  dayChangePct: number;
  dayHigh: number;
  dayLow: number;
  previousClose: number;
  currency: string;
  shortName?: string;
};

export type Quotes = Record<string, Quote>;

export type VaultEntry = {
  id: string;
  label: string;
  token: string;
  gistId: string;
  createdAt: string;
  lastUsedAt?: string;
};
