/**
 * Skill Loader — reads and caches skill content from `.github/skills/* /SKILL.md` files.
 *
 * Each skill directory contains a SKILL.md file with YAML frontmatter (name, description, etc.)
 * followed by Markdown body content.
 */

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

/**
 * Extract the first sentence from a description string for use as a use-case hint.
 *
 * Splits on ". " (period + space) boundaries and returns the first sentence.
 * Falls back to the full description if it's a single sentence.
 *
 * @param {string} description
 * @returns {string}
 */
function firstSentence(description) {
  if (!description) return '';
  const idx = description.indexOf('. ');
  if (idx === -1) return description;
  return description.slice(0, idx + 1); // include the period
}

/**
 * Load all skills from the GitHub skills directory.
 *
 * Scans `.github/skills/* /SKILL.md`, parses YAML frontmatter, and returns a Map
 * keyed by skill name.
 *
 * @param {string} basePath — project root directory (resolved by caller)
 * @returns {Map<string, { name: string, description: string, content: string, path: string, category: string, useCase: string }>}
 */
export function loadSkills(basePath) {
  const skillsDir = path.join(basePath, '.github', 'skills');
  const skills = new Map();

  // Handle missing skills directory gracefully — return empty map
  if (!fs.existsSync(skillsDir)) {
    return skills;
  }

  if (!fs.statSync(skillsDir).isDirectory()) {
    return skills;
  }

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillFile = path.join(skillsDir, entry.name, 'SKILL.md');

    // Skip directories without a SKILL.md
    if (!fs.existsSync(skillFile)) continue;

    try {
      const raw = fs.readFileSync(skillFile, 'utf-8');
      const parsed = matter(raw);

      const skillName = parsed.data.name || entry.name;
      const description = parsed.data.description || '';
      const content = parsed.content.trim();
      const category = parsed.data.category || entry.name;
      const useCase = firstSentence(description);

      skills.set(skillName, {
        name: skillName,
        description,
        content,
        path: skillFile,
        category,
        useCase,
      });
    } catch {
      // Skip files that cannot be read or parsed
    }
  }

  return skills;
}
