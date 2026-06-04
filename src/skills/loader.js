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
 * Load all skills from the GitHub skills directory.
 *
 * Scans `.github/skills/* /SKILL.md`, parses YAML frontmatter, and returns a Map
 * keyed by skill name.
 *
 * @param {string} basePath — project root directory (resolved by caller)
 * @returns {Map<string, { name: string, description: string, content: string, path: string }>}
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

      skills.set(skillName, {
        name: skillName,
        description,
        content,
        path: skillFile,
      });
    } catch {
      // Skip files that cannot be read or parsed
    }
  }

  return skills;
}
