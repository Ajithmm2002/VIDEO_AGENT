import { readFileSync } from "node:fs";

import type { GuideArticle } from "@/lib/ai/support-engine";

export type KnowledgeArticle = GuideArticle;

export function readAppWorkingMarkdown() {
  return readFileSync(new URL("./app-working.md", import.meta.url), "utf8");
}

export function parseAppWorking(markdown: string): KnowledgeArticle[] {
  const articles: KnowledgeArticle[] = [];
  const sections = markdown.split(/^## /m).slice(1);
  for (const section of sections) {
    const lines = section.replace(/\r\n/g, "\n").split("\n");
    const title = lines[0]?.trim();
    if (!title) continue;
    let index = 1;
    let kind: "help" | "error" = "help";
    let keywords: string[] = [];
    let pages: string[] = [];
    let ask = "";
    let weight = 1;
    while (index < lines.length) {
      const line = lines[index].trim();
      if (!line) {
        index += 1;
        continue;
      }
      if (/^kind:/i.test(line)) {
        kind = line.slice(line.indexOf(":") + 1).trim().toLowerCase() === "error" ? "error" : "help";
        index += 1;
        continue;
      }
      if (/^keywords:/i.test(line)) {
        keywords = line
          .slice(line.indexOf(":") + 1)
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
        index += 1;
        continue;
      }
      if (/^pages:/i.test(line)) {
        pages = line
          .slice(line.indexOf(":") + 1)
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item.startsWith("/"));
        index += 1;
        continue;
      }
      if (/^weight:/i.test(line)) {
        const value = Number(line.slice(line.indexOf(":") + 1).trim());
        if (Number.isFinite(value) && value > 0) weight = value;
        index += 1;
        continue;
      }
      if (/^ask:/i.test(line)) {
        ask = line.slice(line.indexOf(":") + 1).trim();
        index += 1;
        continue;
      }
      break;
    }
    const body = lines.slice(index).join("\n").trim();
    if (!keywords.length || !body) continue;
    articles.push({ title, kind, keywords, pages, ask, weight, body });
  }
  return articles;
}

const articles = parseAppWorking(readAppWorkingMarkdown());

export const HELP_ARTICLES = articles.filter((article) => article.kind === "help");
export const ERROR_GUIDES = articles.filter((article) => article.kind === "error");
export const APP_WORKING_TEXT = articles.map((article) => `${article.title}: ${article.body}`).join("\n");
