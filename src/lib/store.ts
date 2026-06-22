// Data model + localStorage store, mirrors a SQLite schema so a Python/Kivy
// app can implement the same tables and field names without changes.
//
// Table: members
//   id TEXT PRIMARY KEY
//   name TEXT NOT NULL
//   phone TEXT
//   amount REAL NOT NULL DEFAULT 0
//   status TEXT CHECK(status IN ('paid','unpaid','pending')) NOT NULL
//   month INTEGER NOT NULL  -- 1..12
//   year INTEGER NOT NULL
//   hold INTEGER NOT NULL DEFAULT 0  -- 0/1
//   months_pending INTEGER NOT NULL DEFAULT 0
//   created_at TEXT NOT NULL
//   updated_at TEXT NOT NULL

export type MemberStatus = "paid" | "unpaid" | "pending";

export interface Member {
  id: string;
  name: string;
  phone: string;
  amount: number;
  status: MemberStatus;
  month: number;
  year: number;
  hold: boolean;
  months_pending: number;
  created_at: string;
  updated_at: string;
}

export interface OrgSettings {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  logoDataUrl: string | null;
  signatureLabel: string;
  receiptPrefix: string;
  currency: string;
}

const MEMBERS_KEY = "mrm.members.v1";
const SETTINGS_KEY = "mrm.settings.v1";
const RECEIPT_SEQ_KEY = "mrm.receiptSeq.v1";

export const APP_VERSION = "1.0.0";

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function uuid(): string {
  return (crypto as any).randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const defaultSettings: OrgSettings = {
  name: "Masjid Al-Noor",
  tagline: "Donation & Receipt Management",
  address: "123 Community Lane, City",
  phone: "+1 555 0100",
  email: "info@masjid.example",
  logoDataUrl: null,
  signatureLabel: "Authorized Signatory",
  receiptPrefix: "RCPT",
  currency: "₹",
};

function seedMembers(): Member[] {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const sample: Omit<Member, "id" | "created_at" | "updated_at">[] = [
    { name: "Ahmed Khan", phone: "+91 98000 11111", amount: 500, status: "paid", month, year, hold: false, months_pending: 0 },
    { name: "Bilal Ahmad", phone: "+91 98000 22222", amount: 500, status: "unpaid", month, year, hold: false, months_pending: 2 },
    { name: "Yusuf Ali", phone: "+91 98000 33333", amount: 1000, status: "pending", month, year, hold: false, months_pending: 1 },
    { name: "Hamza Sheikh", phone: "+91 98000 44444", amount: 500, status: "paid", month, year, hold: false, months_pending: 0 },
    { name: "Ibrahim Qureshi", phone: "+91 98000 55555", amount: 750, status: "unpaid", month, year, hold: true, months_pending: 3 },
    { name: "Omar Farooq", phone: "+91 98000 66666", amount: 500, status: "paid", month, year, hold: false, months_pending: 0 },
    { name: "Zaid Hussain", phone: "+91 98000 77777", amount: 500, status: "pending", month, year, hold: false, months_pending: 1 },
    { name: "Salman Iqbal", phone: "+91 98000 88888", amount: 500, status: "paid", month, year, hold: false, months_pending: 0 },
  ];
  return sample.map((m) => ({
    ...m,
    id: uuid(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

export function loadMembers(): Member[] {
  const existing = read<Member[] | null>(MEMBERS_KEY, null);
  if (existing && existing.length) return existing;
  const seeded = seedMembers();
  write(MEMBERS_KEY, seeded);
  return seeded;
}

export function saveMembers(list: Member[]) {
  write(MEMBERS_KEY, list);
}

export function loadSettings(): OrgSettings {
  return { ...defaultSettings, ...read<Partial<OrgSettings>>(SETTINGS_KEY, {}) };
}

export function saveSettings(s: OrgSettings) {
  write(SETTINGS_KEY, s);
}

export function nextReceiptNumber(prefix: string): string {
  const seq = read<number>(RECEIPT_SEQ_KEY, 1000) + 1;
  write(RECEIPT_SEQ_KEY, seq);
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(seq).padStart(5, "0")}`;
}

export function newMember(partial: Partial<Member>): Member {
  const now = new Date();
  return {
    id: uuid(),
    name: partial.name ?? "",
    phone: partial.phone ?? "",
    amount: Number(partial.amount ?? 0),
    status: (partial.status as MemberStatus) ?? "unpaid",
    month: partial.month ?? now.getMonth() + 1,
    year: partial.year ?? now.getFullYear(),
    hold: !!partial.hold,
    months_pending: partial.months_pending ?? 0,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

// CSV / TXT parsing (header: name,phone,amount,status,month,year)
export function parseDelimited(text: string): Partial<Member>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  if (!lines.length) return [];
  const delim = lines[0].includes("\t") ? "\t" : ",";
  const header = lines[0].split(delim).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cols = line.split(delim);
    const row: Record<string, string> = {};
    header.forEach((h, i) => (row[h] = (cols[i] ?? "").trim()));
    const status = (row.status?.toLowerCase() as MemberStatus) || "unpaid";
    return {
      name: row.name || row.member || "Unknown",
      phone: row.phone || row.mobile || "",
      amount: Number(row.amount || 0),
      status: ["paid", "unpaid", "pending"].includes(status) ? status : "unpaid",
      month: Number(row.month) || new Date().getMonth() + 1,
      year: Number(row.year) || new Date().getFullYear(),
      months_pending: Number(row.months_pending || row.pending || 0),
    };
  });
}
