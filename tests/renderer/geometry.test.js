import { describe, it, expect } from 'vitest';
import { generateLinkPath } from '../../src/renderer/geometry.js';

describe('generateLinkPath', () => {
  it('produces valid SVG path string for horizontal left-to-right connection', () => {
    const path = generateLinkPath(100, 50, 300, 50, 1);
    expect(path).toMatch(/^M /);
    expect(path).toContain(' C ');
    expect(path).toMatch(/\d+ \d+$/);
    // Should not be empty or throw
    expect(path.length).toBeGreaterThan(10);
  });

  it('produces valid SVG path for vertical connection', () => {
    const path = generateLinkPath(100, 50, 100, 150, 1);
    expect(path).toMatch(/^M /);
    expect(path.length).toBeGreaterThan(10);
  });

  it('produces valid SVG path for angled connection (diagonal)', () => {
    const path = generateLinkPath(100, 50, 400, 200, 1);
    expect(path).toMatch(/^M /);
    expect(path.length).toBeGreaterThan(10);
  });

  it('handles right-to-left direction (sc = -1)', () => {
    const path = generateLinkPath(400, 50, 100, 50, -1);
    expect(path).toMatch(/^M /);
    expect(path.length).toBeGreaterThan(10);
  });

  it('handles hasStatus flag without error', () => {
    const path = generateLinkPath(100, 50, 300, 50, 1, true);
    expect(path).toMatch(/^M /);
    expect(path.length).toBeGreaterThan(10);
  });

  it('handles nodes at same coordinates', () => {
    const path = generateLinkPath(100, 50, 100, 50, 1);
    expect(path).toMatch(/^M /);
    expect(path.length).toBeGreaterThan(10);
  });

  it('produces different paths for different source ports (Y-offset)', () => {
    const path1 = generateLinkPath(100, 50, 300, 50, 1);
    const path2 = generateLinkPath(100, 70, 300, 50, 1);
    expect(path1).not.toBe(path2);
  });
});
