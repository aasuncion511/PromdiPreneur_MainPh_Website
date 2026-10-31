/**
 * Retrieval for Ask PromdiPreneur: a small BM25 keyword search over the approved knowledge chunks.
 * Runs inside the function (no vector database, no extra API cost, fully versioned in git).
 * Simple Filipino/Bisaya business words are mapped to English terms so mixed-language questions still match.
 */
import { KNOWLEDGE_CHUNKS, OFFICIAL_SOURCES } from './generated/knowledge.ts';

const STOP = new Set(
  (
    'a an and are as at be but by can do does for from how i if in into is it its me my of on or our so that the their them then there these this to was we what when where which who why will with you your ' +
    'ang ng sa mga ko ba po na at para ako kung yung ano paano ito iyan dito si ni kay namin natin ninyo nila mo ka kami tayo sila may wala hindi oo opo lang din rin pa naman kasi pag mag ' +
    'unsa ug sa akong imong ako ikaw kay dili wala naa ni kini kana'
  ).split(' ')
);

// Tagalog / Bisaya → English search terms (lowercase). Extend as real questions come in.
const SYNONYMS: Record<string, string[]> = {
  negosyo: ['business'],
  puhunan: ['capital', 'startup', 'cash'],
  kapital: ['capital'],
  kwarta: ['cash', 'money'],
  pera: ['cash', 'money'],
  gastos: ['expenses', 'cost'],
  kita: ['income', 'profit', 'sales'],
  benta: ['sales'],
  utang: ['debt', 'credit', 'loan'],
  tindahan: ['store', 'shop'],
  kapihan: ['cafe', 'coffee'],
  kape: ['coffee', 'cafe'],
  paninda: ['inventory', 'stock'],
  stocks: ['inventory', 'stock'],
  imbentaryo: ['inventory'],
  empleyado: ['employee', 'staff'],
  trabahador: ['employee', 'staff'],
  tauhan: ['staff', 'employee'],
  sahod: ['salary', 'payroll', 'wage'],
  sweldo: ['salary', 'payroll', 'wage'],
  suweldo: ['salary', 'payroll', 'wage'],
  buwis: ['tax', 'bir'],
  rehistro: ['register', 'registration'],
  magparehistro: ['register', 'registration'],
  permiso: ['permit'],
  presyo: ['price', 'pricing'],
  resibo: ['receipt', 'invoice'],
  suki: ['customer', 'repeat'],
  kostumer: ['customer'],
  customers: ['customer'],
  iskedyul: ['schedule'],
  upa: ['rent', 'lease'],
  pwesto: ['location', 'premises', 'lease'],
  supplier: ['supplier'],
  proseso: ['process', 'procedure'],
  sistema: ['system', 'process'],
  inquiries: ['inquiry', 'customer'],
  messenger: ['inquiry', 'customer', 'reply'],
  followup: ['follow'],
  sop: ['procedure', 'checklist'],
  sops: ['procedure', 'checklist'],
};

export function tokenize(s: string): string[] {
  const words = s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !STOP.has(w));
  const out: string[] = [];
  for (const w of words) {
    out.push(stem(w));
    for (const s2 of SYNONYMS[w] ?? []) out.push(stem(s2));
  }
  return out;
}

/** Tiny English stemmer: enough to match plural/-ing/-ed forms. */
function stem(w: string) {
  return w.replace(/(ings?|ed|es|s)$/, '') || w;
}

type Indexed = { tf: Map<string, number>; len: number };
let index: { docs: Indexed[]; df: Map<string, number>; avg: number } | null = null;

function build() {
  const df = new Map<string, number>();
  const docs = KNOWLEDGE_CHUNKS.map((c) => {
    const toks = tokenize(c.text);
    const tf = new Map<string, number>();
    for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + 1);
    for (const t of tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
    return { tf, len: toks.length };
  });
  const avg = docs.reduce((a, d) => a + d.len, 0) / Math.max(docs.length, 1);
  index = { docs, df, avg };
  return index;
}

export type Retrieved = { ref: string; text: string; score: number };

/** Top-k chunks for a query (BM25). Returns [] when nothing matches meaningfully. */
export function retrieve(query: string, k = 3, minScore = 3.5): Retrieved[] {
  const idx = index ?? build();
  const q = [...new Set(tokenize(query))];
  const N = idx.docs.length;
  const scored = idx.docs.map((d, i) => {
    let s = 0;
    for (const t of q) {
      const f = d.tf.get(t);
      if (!f) continue;
      const n = idx.df.get(t) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      s += (idf * (f * 2.2)) / (f + 1.2 * (0.25 + 0.75 * (d.len / idx.avg)));
    }
    return { i, s: s * (KNOWLEDGE_CHUNKS[i].weight ?? 1) };
  });
  return scored
    .filter((x) => x.s >= minScore)
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .map((x) => ({ ref: KNOWLEDGE_CHUNKS[x.i].ref, text: KNOWLEDGE_CHUNKS[x.i].text, score: Number(x.s.toFixed(2)) }));
}

/** Official sources whose topics appear in the question (max 3). */
export function officialSourcesFor(query: string) {
  const q = ` ${query.toLowerCase()} `;
  const toks = new Set(tokenize(query));
  return OFFICIAL_SOURCES.filter((s) =>
    s.topics.some((t) => (t.includes(' ') ? q.includes(t) : toks.has(stem(t)) || q.includes(` ${t} `)))
  ).slice(0, 3);
}
