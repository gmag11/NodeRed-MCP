/**
 * Tests for the list-skills tool logic.
 */

import { describe, it, expect } from 'vitest';

describe('list-skills tool (logic)', () => {
  /** Simulates the list-skills handler: Map → JSON array of { name, description, uri, category, useCase } */
  function buildSkillList(skillsMap) {
    return [...skillsMap].map(([name, s]) => ({
      name,
      description: s.description,
      uri: `nodered://skills/${name}`,
      category: s.category || name,
      useCase: s.useCase || s.description,
    }));
  }

  it('returns an array of { name, description, uri, category, useCase } objects when skills exist', () => {
    const skills = new Map([
      ['nodered-fundamentals', { name: 'nodered-fundamentals', description: 'Core vocabulary', content: '...', category: 'nodered-fundamentals', useCase: 'Core vocabulary' }],
      ['nodered-patterns', { name: 'nodered-patterns', description: 'Recipe book', content: '...', category: 'nodered-patterns', useCase: 'Recipe book' }],
    ]);

    const result = buildSkillList(skills);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: 'nodered-fundamentals', description: 'Core vocabulary', uri: 'nodered://skills/nodered-fundamentals', category: 'nodered-fundamentals', useCase: 'Core vocabulary' });
    expect(result[1]).toEqual({ name: 'nodered-patterns', description: 'Recipe book', uri: 'nodered://skills/nodered-patterns', category: 'nodered-patterns', useCase: 'Recipe book' });
  });

  it('returns empty array when no skills exist', () => {
    const skills = new Map();
    const result = buildSkillList(skills);
    expect(result).toEqual([]);
  });

  it('returns empty string description when skill has no description', () => {
    const skills = new Map([
      ['nodered-test', { name: 'nodered-test', description: '', content: '...' }],
    ]);

    const result = buildSkillList(skills);

    expect(result[0].description).toBe('');
  });

  it('each entry contains name and description fields (no content leaking)', () => {
    const skills = new Map([
      ['nodered-flow-builder', { name: 'nodered-flow-builder', description: 'Step-by-step guide', content: 'LONG CONTENT HERE', path: '/some/path' }],
    ]);

    const result = buildSkillList(skills);

    expect(result[0]).toHaveProperty('name');
    expect(result[0]).toHaveProperty('description');
    expect(result[0]).toHaveProperty('uri', 'nodered://skills/nodered-flow-builder');
    expect(result[0]).toHaveProperty('category');
    expect(result[0]).toHaveProperty('useCase');
    expect(result[0]).not.toHaveProperty('content');
    expect(result[0]).not.toHaveProperty('path');
    expect(Object.keys(result[0])).toHaveLength(5);
  });

  it('JSON.stringify produces valid JSON', () => {
    const skills = new Map([
      ['nodered-fundamentals', { name: 'nodered-fundamentals', description: 'Core vocabulary', content: '...' }],
    ]);

    const result = buildSkillList(skills);
    const json = JSON.stringify(result);

    expect(() => JSON.parse(json)).not.toThrow();
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('nodered-fundamentals');
  });
});
