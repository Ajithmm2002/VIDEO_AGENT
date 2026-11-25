/**
 * Retrieval for the support chat. Pure functions, no I/O, so it is easy to test.
 *
 * Every answer comes from the written guide (lib/ai/app-working.md). Articles are ranked with
 * whole-word matching: title words, exact keyword phrases, and BM25 over the body text. The
 * reply is built from the most relevant sentences of the best article, and the chat says when
 * it is not sure instead of guessing.
 */

export type GuideArticle = {
  title: string;
  kind: "help" | "error";
  keywords: string[];
  pages: string[];
  ask: string;
  /** Ranking multiplier; catch-all articles use less than 1 so specific ones win. */
  weight?: number;
  body: string;
};

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type RankedArticle = { article: GuideArticle; score: number };

export type SupportAnswer = {
  reply: string;
  sources: string[];
  suggestions: string[];
  confidence: "high" | "low" | "none";
};

const STOP_WORDS = new Set(
  (
    "a an the and or but if then so to of in on at by for with from into onto about as is are was were be been being am do does did " +
    "doing have has had having i me my mine we us our you your yours it its this that these those there here what which who whom whose " +
    "when where why how can could should would will shall may might must not no yes please pls plz just also too very really any some " +
    "all each more most other such only own same than up down out over under again further once get got go goes going want wanted " +
    "need needs tell know show let make made use used using way thing things one help hi hey hello thanks thank ok okay app studio content"
  ).split(" "),
);

// "content" and "studio" are in almost every article, so they carry no signal on their own,
// except where an article's own keywords or title name them.

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/'s\b/g, "")
    .replace(/n't\b/g, " not");
}

export function stem(word: string) {
  if (word.length <= 3 || /^\d/.test(word)) return word;
  let base = word;
  if (base.endsWith("ies") && base.length > 4) base = `${base.slice(0, -3)}y`;
  else if (base.endsWith("ing") && base.length > 5) base = base.slice(0, -3);
  else if (base.endsWith("ed") && base.length > 4) base = base.slice(0, -2);
  else if (base.endsWith("es") && base.length > 4 && /(ches|shes|sses|xes|zes)$/.test(base)) base = base.slice(0, -2);
  else if (base.endsWith("s") && !base.endsWith("ss") && !base.endsWith("us")) base = base.slice(0, -1);
  // logged → log, shopping → shop (but keep fill, pass, buzz).
  if (base !== word && /([^aeiouylsz])\1$/.test(base)) base = base.slice(0, -1);
  // rate / rating / rated → rat, so verb forms meet.
  if (base.length > 3 && base.endsWith("e")) base = base.slice(0, -1);
  return base;
}

/** All word tokens, stemmed, including stop words (used for phrase matching). */
export function wordTokens(text: string) {
  return (normalize(text).match(/[\p{L}\p{N}#]+/gu) ?? []).map(stem);
}

/** Meaningful tokens only (used for scoring). */
export function terms(text: string) {
  return (normalize(text).match(/[\p{L}\p{N}#]+/gu) ?? []).filter((word) => !STOP_WORDS.has(word)).map(stem);
}

function containsPhrase(haystack: string[], phrase: string[]) {
  if (!phrase.length || phrase.length > haystack.length) return false;
  outer: for (let start = 0; start <= haystack.length - phrase.length; start += 1) {
    for (let offset = 0; offset < phrase.length; offset += 1) {
      if (haystack[start + offset] !== phrase[offset]) continue outer;
    }
    return true;
  }
  return false;
}

function splitSentences(body: string) {
  return body
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9“"(₹])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

type IndexedArticle = {
  article: GuideArticle;
  titleTerms: Set<string>;
  keywordPhrases: string[][];
  keywordTerms: Set<string>;
  bodyTerms: string[];
  bodyCounts: Map<string, number>;
};

export type GuideIndex = {
  articles: IndexedArticle[];
  documentFrequency: Map<string, number>;
  averageLength: number;
};

export function buildIndex(articles: GuideArticle[]): GuideIndex {
  const indexed = articles.map((article) => {
    const bodyTerms = terms(article.body);
    const bodyCounts = new Map<string, number>();
    for (const term of bodyTerms) bodyCounts.set(term, (bodyCounts.get(term) ?? 0) + 1);
    const keywordPhrases = article.keywords.map((keyword) => wordTokens(keyword)).filter((phrase) => phrase.length);
    return {
      article,
      titleTerms: new Set(terms(article.title)),
      keywordPhrases,
      keywordTerms: new Set(article.keywords.flatMap((keyword) => terms(keyword))),
      bodyTerms,
      bodyCounts,
    };
  });
  const documentFrequency = new Map<string, number>();
  for (const item of indexed) {
    const seen = new Set([...item.bodyCounts.keys(), ...item.titleTerms, ...item.keywordTerms]);
    for (const term of seen) documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
  }
  const averageLength = indexed.reduce((sum, item) => sum + item.bodyTerms.length, 0) / Math.max(indexed.length, 1);
  return { articles: indexed, documentFrequency, averageLength };
}

function idf(index: GuideIndex, term: string) {
  const total = index.articles.length;
  const frequency = index.documentFrequency.get(term) ?? 0;
  return Math.log(1 + (total - frequency + 0.5) / (frequency + 0.5));
}

const ERROR_WORDS = new Set(
  ["error", "fail", "failed", "failing", "broken", "bug", "crash", "stuck", "blank", "wrong", "cannot", "unable", "problem", "issue", "incorrect", "invalid", "denied", "rejected", "blocked"].map(stem),
);

export function looksLikeError(question: string) {
  const words = wordTokens(question);
  if (words.some((word) => ERROR_WORDS.has(word))) return true;
  const text = normalize(question);
  return /\b(does not|did not|do not|is not|won't|wont|isn't|could not|couldn't|would not|wouldn't|will not|not working|not loading|not showing|went wrong|does nothing|keeps loading|nothing happens)\b/.test(text);
}

export function rankArticles(index: GuideIndex, question: string, options: { page?: string | null } = {}): RankedArticle[] {
  const queryTerms = [...new Set(terms(question))];
  const queryWords = wordTokens(question);
  const errorIntent = looksLikeError(question);
  const page = options.page ?? "";
  const aboutThisPage = /\b(this|current) (page|screen|tab)\b|\bhere\b|\bon this\b/i.test(question);
  const k1 = 1.2;
  const b = 0.75;

  return index.articles
    .map((item) => {
      let score = 0;
      for (const phrase of item.keywordPhrases) {
        if (containsPhrase(queryWords, phrase)) score += phrase.length > 1 ? 3 + phrase.length : 2.6;
      }
      for (const term of queryTerms) {
        const weight = idf(index, term);
        if (item.titleTerms.has(term)) score += 1.6 * weight;
        if (item.keywordTerms.has(term)) score += 0.8 * weight;
        const count = item.bodyCounts.get(term) ?? 0;
        if (count) {
          const norm = count + k1 * (1 - b + (b * item.bodyTerms.length) / Math.max(index.averageLength, 1));
          score += weight * ((count * (k1 + 1)) / norm);
        }
      }
      const onPage = Boolean(page) && item.article.pages.some((prefix) => page === prefix || page.startsWith(`${prefix}/`));
      if (onPage && aboutThisPage && item.article.kind === "help") score += 8;
      else if (onPage && score > 0) score += 1.5;
      if (item.article.kind === "error") score += errorIntent ? 1.5 : -2;
      score *= item.article.weight ?? 1;
      return { article: item.article, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);
}

/** Pick the sentences that answer the question, keeping the guide's own order and wording. */
export function focusedExcerpt(article: GuideArticle, question: string, maxSentences = 4) {
  const sentences = splitSentences(article.body);
  if (sentences.length <= maxSentences) return sentences.join(" ");
  const queryTerms = new Set(terms(question));
  const keywordTerms = new Set(article.keywords.flatMap((keyword) => terms(keyword)));
  const scored = sentences.map((sentence, position) => {
    const words = new Set(terms(sentence));
    let score = 0;
    for (const term of words) {
      if (queryTerms.has(term)) score += 2;
      else if (keywordTerms.has(term)) score += 0.25;
    }
    // The opening sentence usually defines the feature; keep it unless something beats it clearly.
    if (position === 0) score += 1.5;
    return { sentence, position, score };
  });
  const chosen = scored
    .slice()
    .sort((a, b) => b.score - a.score || a.position - b.position)
    .slice(0, maxSentences)
    .sort((a, b) => a.position - b.position);
  return chosen.map((item) => item.sentence).join(" ");
}

const FOLLOW_UP_START = /^(and|also|what about|how about|ok so|so|then)\b/i;
const FOLLOW_UP_PRONOUN = /\b(it|this|that|there|them|those|they)\b/i;

/** Short or pronoun-led questions borrow context from the previous question. */
export function retrievalQuery(question: string, history: ChatTurn[]) {
  const previous = [...history].reverse().find((turn) => turn.role === "user")?.content ?? "";
  if (!previous) return question;
  const meaningful = terms(question).length;
  const trimmed = question.trim();
  if (meaningful <= 1 || (meaningful <= 3 && (FOLLOW_UP_START.test(trimmed) || FOLLOW_UP_PRONOUN.test(trimmed)))) {
    return `${question} ${previous}`;
  }
  return question;
}

export const MIN_CONFIDENT_SCORE = 3.2;

export function suggestionFor(article: GuideArticle) {
  return article.ask || `Tell me about ${article.title}`;
}
