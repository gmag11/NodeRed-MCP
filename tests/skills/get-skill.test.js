/**
 * Tests for the get-skill tool logic.
 */

import { describe, it, expect } from 'vitest';

describe('get-skill tool (logic)', () => {
  /** Simulates the get-skill handler: Map lookup → { name, description, category, useCase, content } or error */
  function getSkill(skillsMap, name) {
    const skill = skillsMap.get(name);
    if (!skill) {
      const available = [...skillsMap.keys()].join(', ');
      return {
        error: true,
        message: `Skill "${name}" not found. Available skills: ${available || '(none)'}`,
      };
    }
    return {
      name: skill.name,
      description: skill.description,
      category: skill.category || name,
      useCase: skill.useCase || skill.description,
      content: skill.content,
    };
  }

  it('returns skill content when skill exists', () => {
    const skills = new Map([
      ['nodered-flow-builder', {
        name: 'nodered-flow-builder',
        description: 'Step-by-step guide',
        content: '# Flow Builder\n\nGuide content here.',
      }],
    ]);

    const result = getSkill(skills, 'nodered-flow-builder');

    expect(result).toEqual({
      name: 'nodered-flow-builder',
      description: 'Step-by-step guide',
      category: 'nodered-flow-builder',
      useCase: 'Step-by-step guide',
      content: '# Flow Builder\n\nGuide content here.',
    });
    expect(result).not.toHaveProperty('error');
  });

  it('returns error with available skills when skill not found', () => {
    const skills = new Map([
      ['nodered-fundamentals', { name: 'nodered-fundamentals', description: 'Core vocabulary', content: '...' }],
      ['nodered-patterns', { name: 'nodered-patterns', description: 'Recipe book', content: '...' }],
    ]);

    const result = getSkill(skills, 'nonexistent');

    expect(result.error).toBe(true);
    expect(result.message).toContain('Skill "nonexistent" not found');
    expect(result.message).toContain('nodered-fundamentals');
    expect(result.message).toContain('nodered-patterns');
  });

  it('returns error with (none) when no skills exist', () => {
    const skills = new Map();

    const result = getSkill(skills, 'anything');

    expect(result.error).toBe(true);
    expect(result.message).toContain('(none)');
  });

  it('returns empty content string when skill has empty body', () => {
    const skills = new Map([
      ['nodered-empty', { name: 'nodered-empty', description: 'Empty skill', content: '' }],
    ]);

    const result = getSkill(skills, 'nodered-empty');

    expect(result).toEqual({
      name: 'nodered-empty',
      description: 'Empty skill',
      category: 'nodered-empty',
      useCase: 'Empty skill',
      content: '',
    });
  });

  it('returns content without uri or path fields', () => {
    const skills = new Map([
      ['nodered-test', {
        name: 'nodered-test',
        description: 'Test skill',
        content: '# Test',
        path: '/some/path',
      }],
    ]);

    const result = getSkill(skills, 'nodered-test');

    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('description');
    expect(result).toHaveProperty('category');
    expect(result).toHaveProperty('useCase');
    expect(result).toHaveProperty('content');
    expect(result).not.toHaveProperty('uri');
    expect(result).not.toHaveProperty('path');
    expect(Object.keys(result)).toHaveLength(5);
  });

  it('JSON.stringify produces valid JSON', () => {
    const skills = new Map([
      ['nodered-fundamentals', { name: 'nodered-fundamentals', description: 'Core vocabulary', content: 'Some content' }],
    ]);

    const result = getSkill(skills, 'nodered-fundamentals');
    const json = JSON.stringify(result);

    expect(() => JSON.parse(json)).not.toThrow();
    const parsed = JSON.parse(json);
    expect(parsed.name).toBe('nodered-fundamentals');
    expect(parsed.content).toBe('Some content');
  });
});
