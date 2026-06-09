import { describe, it, expect } from 'vitest';
import {
  getNodeColor,
  getNodeCSSClass,
  getMermaidClass,
  DEFAULT_COLOR,
} from '../../src/renderer/colors.js';

describe('getNodeColor', () => {
  it('returns correct color for inject node', () => {
    expect(getNodeColor('inject')).toBe('#a6bbcf');
  });

  it('returns correct color for debug node', () => {
    expect(getNodeColor('debug')).toBe('#87a980');
  });

  it('returns correct color for function node', () => {
    expect(getNodeColor('function')).toBe('#fdd0a2');
  });

  it('returns correct color for switch node', () => {
    expect(getNodeColor('switch')).toBe('#d8bfd8');
  });

  it('returns correct color for change node', () => {
    expect(getNodeColor('change')).toBe('#e2d6b8');
  });

  it('returns correct color for mqtt in node', () => {
    expect(getNodeColor('mqtt in')).toBe('#d8bfd8');
  });

  it('returns correct color for http in node', () => {
    expect(getNodeColor('http in')).toBe('#d8bfd8');
  });

  it('returns default grey for unknown node type', () => {
    expect(getNodeColor('custom-sensor-pro')).toBe(DEFAULT_COLOR);
  });

  it('returns default grey for empty type', () => {
    expect(getNodeColor('')).toBe(DEFAULT_COLOR);
  });
});

describe('getNodeCSSClass', () => {
  it('returns base class for clean enabled node', () => {
    const node = { dirty: false, d: false };
    expect(getNodeCSSClass(node)).toBe('nr-node');
  });

  it('returns dirty class for dirty node', () => {
    const node = { dirty: true, d: false };
    expect(getNodeCSSClass(node)).toContain('nr-node-dirty');
  });

  it('returns disabled class for disabled node', () => {
    const node = { dirty: false, d: true };
    expect(getNodeCSSClass(node)).toContain('nr-node-disabled');
  });

  it('returns both classes for dirty disabled node', () => {
    const node = { dirty: true, d: true };
    const cls = getNodeCSSClass(node);
    expect(cls).toContain('nr-node-dirty');
    expect(cls).toContain('nr-node-disabled');
  });
});

describe('getMermaidClass', () => {
  it('returns empty string for clean enabled node', () => {
    const node = { dirty: false, d: false };
    expect(getMermaidClass(node)).toBe('');
  });

  it('returns :::dirty for dirty node', () => {
    const node = { dirty: true, d: false };
    expect(getMermaidClass(node)).toBe(':::dirty');
  });

  it('returns :::disabled for disabled node', () => {
    const node = { dirty: false, d: true };
    expect(getMermaidClass(node)).toBe(':::disabled');
  });

  it('returns :::dirty:::disabled for dirty disabled node', () => {
    const node = { dirty: true, d: true };
    expect(getMermaidClass(node)).toBe(':::dirty:::disabled');
  });
});
