const fs = require('fs');
const path = require('path');
const { loadApp, requireApp } = require('./setup/loadApp');

const STATIC = path.resolve(__dirname, '../../main/resources/static');
const themeOf = (document) => document.documentElement.getAttribute('data-theme');

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('theme toggle', () => {
  test('AC-4: defaults to dark when nothing is stored, ignoring the OS setting', async () => {
    window.matchMedia = () => ({ matches: false });
    const { document } = await loadApp();
    expect(themeOf(document)).toBe('dark');
  });

  test('AC-1: clicking switches theme and the label names the theme you will get', async () => {
    const { document } = await loadApp();
    const button = document.getElementById('theme-toggle');
    expect(button.textContent).toBe('Light theme');
    button.click();
    expect(themeOf(document)).toBe('light');
    expect(button.textContent).toBe('Dark theme');
    button.click();
    expect(themeOf(document)).toBe('dark');
  });

  test('AC-3: the choice is persisted and restored on load', async () => {
    let result = await loadApp();
    result.document.getElementById('theme-toggle').click();
    expect(localStorage.getItem('theme')).toBe('light');
    document.documentElement.removeAttribute('data-theme');
    result = await loadApp();
    expect(themeOf(result.document)).toBe('light');
  });

  test('an invalid stored value falls back to dark', async () => {
    localStorage.setItem('theme', '"><img src=x>');
    const { document } = await loadApp();
    expect(themeOf(document)).toBe('dark');
  });

  test('normalizeTheme accepts only light and dark', () => {
    const { normalizeTheme } = requireApp();
    expect(normalizeTheme('light')).toBe('light');
    expect(normalizeTheme('dark')).toBe('dark');
    expect(normalizeTheme('blue')).toBe('dark');
    expect(normalizeTheme(null)).toBe('dark');
  });
});

describe('AC-2: colours come from CSS variables', () => {
  const css = fs.readFileSync(path.join(STATIC, 'style.css'), 'utf8');

  test('both themes are defined and chart colours use variables', () => {
    expect(css).toContain(':root[data-theme="dark"]');
    expect(css).toContain(':root[data-theme="light"]');
    expect(css).toMatch(/\.chart-svg \.bar \{\s*fill: var\(--bar\)/);
    expect(css).toMatch(/\.bar-label \{\s*fill: var\(--bar-label\)/);
  });

  test('no hardcoded colours outside the variable blocks', () => {
    const rest = css.replace(/:root[^{]*\{[^}]*\}/g, '');
    expect(rest).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
  });

  test('app.js contains no colour values', () => {
    const js = fs.readFileSync(path.join(STATIC, 'app.js'), 'utf8');
    expect(js).not.toMatch(/#[0-9a-fA-F]{6}\b/);
  });
});
