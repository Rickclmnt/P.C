// scripts/generate-posts.js
import fs from "fs";
import path from "path";

const POSTS_DIR = "posts";
const OUT_FILE = "posts.json";

function stripMarkdown(md) {
  return md
    .replace(/^# .*/gm, "")
    .replace(/^title:.*$/gmi, "")
    .replace(/^date:.*$/gmi, "")
    .replace(/^tags:.*$/gmi, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\((.*?)\)/g, "$1")
    .replace(/[*_`>#-]/g, "")
    .replace(/\n+/g, " ")
    .trim();
}

function estimateReadTime(text) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

function parseFrontmatter(content) {
  if (!content.startsWith("---")) return {};
  const end = content.indexOf("---", 3);
  if (end === -1) return {};
  const fm = content.slice(3, end).trim();
  const lines = fm.split("\n");
  const data = {};
  lines.forEach(line => {
    const [key, ...rest] = line.split(":");
    if (!key) return;
    const value = rest.join(":").trim();
    if (key.trim() === "tags") {
      data.tags = value.split(",").map(t => t.trim()).filter(Boolean);
    } else {
      data[key.trim()] = value;
    }
  });
  return data;
}

function cleanBody(content) {
  if (content.startsWith("---")) {
    const end = content.indexOf("---", 3);
    if (end !== -1) {
      content = content.slice(end + 3).trim();
    }
  }
  content = content.replace(/^# .*\n/, "");
  content = content.replace(/^(title|date|tags):.*\n/gi, "");
  return content.trim();
}

function processPost(file) {
  const fullPath = path.join(POSTS_DIR, file);
  const raw = fs.readFileSync(fullPath, "utf-8");
  
  const fm = parseFrontmatter(raw);
  const body = cleanBody(raw);
  
  const titleMatch = raw.match(/^# (.+)/m);
  const title = fm.title || (titleMatch ? titleMatch[1].trim() : file.replace(".md", ""));
  
  const excerpt = stripMarkdown(body).slice(0, 150) + "...";
  
  return {
    file, // keep filename only, no path needed anymore
    title,
    date: fm.date || new Date().toISOString().split("T")[0],
    tags: fm.tags || [],
    excerpt,
    readTime: estimateReadTime(body),
    claps: 0,
    content: body // 🔥 save cleaned Markdown body here
  };
}

function main() {
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith(".md"));
  const posts = files.map(processPost);
  fs.writeFileSync(OUT_FILE, JSON.stringify(posts, null, 2));
  console.log(`✅ Generated ${OUT_FILE} with ${posts.length} posts`);
}

main();