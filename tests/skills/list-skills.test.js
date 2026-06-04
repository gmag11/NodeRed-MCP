/**
 * Tests for the list-skills tool logic.
 */

import { describe, it, expect } from 'vitest';

describe('list-skills tool (logic)', () => {
  /** Simulates the list-skills handler: Map → JSON array of { name, description } */
  function buildSkillList(skillsMap) {
    return [...skillsMap].map(([name, s]) => ({
      name,
      description: s.description,
    }));
  }

  it('returns an array of { name, description } objects when skills exist', () => {
    const skills = new Map([
      ['nodered-fundamentals', { name: 'nodered-fundamentals', description: 'Core vocabulary', content: '...' }],
      ['nodered-patterns', { name: 'nodered-patterns', description: 'Recipe book', content: '...' }],
    ]);

    const result = buildSkillList(skills);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: 'nodered-fundamentals', description: 'Core vocabulary' });
    expect(result[1]).toEqual({ name: 'nodered-patterns', description: 'Recipe book' });
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
    expect(result[0]).not.toHaveProperty('content');
    expect(result[0]).not.toHaveProperty('path');
    expect(Object.keys(result[0])).toHaveLength(2);
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
