/**
 * Tests for the skill loader module.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { loadSkills } from '../../src/skills/loader.js';

describe('loadSkills', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  /** Helper: create a .github/skills/<name>/SKILL.md under tmpDir */
  function createSkill(skillName, frontmatter = {}, body = '') {
    const skillDir = path.join(tmpDir, '.github', 'skills', skillName);
    fs.mkdirSync(skillDir, { recursive: true });

    let yaml = `name: ${skillName}\n`;
    if (frontmatter.description) yaml += `description: ${frontmatter.description}\n`;
    for (const [key, value] of Object.entries(frontmatter)) {
      if (key === 'description') continue; // already handled
      yaml += `${key}: ${JSON.stringify(value)}\n`;
    }

    const content = `---\n${yaml}---\n${body}`;
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content, 'utf-8');
  }

  it('returns an empty Map when .github/skills directory does not exist', () => {
    const result = loadSkills(tmpDir);
    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });

  it('returns an empty Map when directory exists but has no skill subdirectories', () => {
    const skillsDir = path.join(tmpDir, '.github', 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    const result = loadSkills(tmpDir);
    expect(result.size).toBe(0);
  });

  it('returns an empty Map when directory exists but not a directory (e.g., file)', () => {
    const skillsFile = path.join(tmpDir, '.github', 'skills');
    fs.mkdirSync(path.join(tmpDir, '.github'), { recursive: true });
    fs.writeFileSync(skillsFile, 'not-a-dir', 'utf-8');
    const result = loadSkills(tmpDir);
    expect(result.size).toBe(0);
  });

  it('parses a single skill with YAML frontmatter', () => {
    createSkill('test-skill', { description: 'A test skill' }, '# Test Skill\n\nThis is test content.');
    const result = loadSkills(tmpDir);
    expect(result.size).toBe(1);

    const skill = result.get('test-skill');
    expect(skill).toBeDefined();
    expect(skill.name).toBe('test-skill');
    expect(skill.description).toBe('A test skill');
    expect(skill.content).toBe('# Test Skill\n\nThis is test content.');
    expect(skill.path).toContain('SKILL.md');
  });

  it('parses multiple skills', () => {
    createSkill('skill-a', { description: 'Skill A' }, 'Content A');
    createSkill('skill-b', { description: 'Skill B' }, 'Content B');
    createSkill('skill-c', { description: 'Skill C' }, 'Content C');

    const result = loadSkills(tmpDir);
    expect(result.size).toBe(3);
    expect(result.get('skill-a').content).toBe('Content A');
    expect(result.get('skill-b').content).toBe('Content B');
    expect(result.get('skill-c').content).toBe('Content C');
  });

  it('uses directory name as fallback when YAML frontmatter has no name field', () => {
    const skillDir = path.join(tmpDir, '.github', 'skills', 'fallback-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      '---\ndescription: No name field\n---\nBody content.',
      'utf-8',
    );
    const result = loadSkills(tmpDir);
    expect(result.size).toBe(1);
    expect(result.get('fallback-skill')).toBeDefined();
  });

  it('skips subdirectories without a SKILL.md file', () => {
    const skillDir = path.join(tmpDir, '.github', 'skills', 'empty-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    // No SKILL.md created
    const result = loadSkills(tmpDir);
    expect(result.size).toBe(0);
  });

  it('handles binary SKILL.md files gracefully (does not throw)', () => {
    const skillDir = path.join(tmpDir, '.github', 'skills', 'binary-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    // Write binary data — gray-matter treats it as content with no frontmatter
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), Buffer.from([0xFF, 0xFE, 0x00, 0x01]));
    // Should not throw — gracefully produces an entry with directory name fallback
    expect(() => loadSkills(tmpDir)).not.toThrow();
  });

  it('trims trailing whitespace from content', () => {
    createSkill('trim-test', { description: 'Trim test' }, '  content with spaces  \n\n');
    const result = loadSkills(tmpDir);
    expect(result.get('trim-test').content).toBe('content with spaces');
  });

  it('uses empty string for description when not in frontmatter', () => {
    createSkill('no-desc');
    const result = loadSkills(tmpDir);
    expect(result.get('no-desc').description).toBe('');
  });
});
