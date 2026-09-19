#!/usr/bin/env node
/* ============================================================================
   99WORLDCUP — BUILD
   ----------------------------------------------------------------------------
   Produces dist/99worldcup.html: one self-contained file with the CSS inlined,
   the fonts embedded as base64 and the ES modules concatenated in dependency
   order. That single file is what gets published as an artifact; the project
   you edit is src/.

     node build.mjs

   The concatenation is deliberately dumb — no bundler, no config, no lockfile.
   It walks the import graph from src/main.js, strips the import/export
   keywords and joins the files into one scope. Because everything shares that
   scope it also checks for duplicate top-level names and fails loudly rather
   than shipping a file that breaks at runtime.
   ========================================================================== */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const read = p => readFileSync(resolve(ROOT, p), 'utf8');

/* -------------------------------------------------------------- 1. styles */
const CSS_FILES = [
  'src/styles/01-tokens.css',
  'src/styles/02-base.css',
  'src/styles/03-layout.css',
  'src/styles/04-components.css',
  'src/styles/05-arcade.css',
  'src/styles/06-pages.css'
];

function inlineFonts(css){
  return css.replace(/url\(["']([^"')]+\.woff2)["']\)/g, (_, rel) => {
    const file = resolve(ROOT, 'public/fonts', rel.split('/').pop());
    const b64 = readFileSync(file).toString('base64');
    return `url("data:font/woff2;base64,${b64}")`;
  });
}

const css = inlineFonts(CSS_FILES.map(read).join('\n'));

/* ------------------------------------------------------------- 2. modules */
const IMPORT_RE = /^\s*import\s+[^;]*?from\s+['"]([^'"]+)['"];?\s*$/;

const seen = new Set();
const order = [];

function walk(file){
  const abs = resolve(ROOT, file);
  if (seen.has(abs)) return;
  seen.add(abs);
  const src = readFileSync(abs, 'utf8');
  for (const line of src.split('\n')){
    const m = line.match(IMPORT_RE);
    if (m && m[1].startsWith('.')) walk(resolve(dirname(abs), m[1]));
  }
  order.push(abs);              // dependencies first, then the importer
}
walk('src/main.js');

function strip(src){
  return src
    .split('\n')
    .filter(l => !IMPORT_RE.test(l))
    .map(l => l.replace(/^(\s*)export\s+(?=(const|let|var|function|async|class)\b)/, '$1'))
    .filter(l => !/^\s*export\s*\{[^}]*\};?\s*$/.test(l))
    .join('\n');
}

const chunks = order.map(f => {
  const label = relative(ROOT, f);
  return `/* ===== ${label} ${'='.repeat(Math.max(0, 66 - label.length))} */\n${strip(read(f))}`;
});

/* --- shared-scope sanity check: two modules must not declare the same name */
const declared = new Map();
const DECL_RE = /^(?:const|let|var|function|async function|class)\s+([A-Za-z_$][\w$]*)/;
order.forEach((f, i) => {
  for (const line of chunks[i].split('\n')){
    const m = line.match(DECL_RE);
    if (!m) continue;
    const name = m[1];
    if (declared.has(name))
      throw new Error(`Duplicate top-level name "${name}" in ${relative(ROOT, f)} ` +
                      `(already declared in ${declared.get(name)}). Rename one of them.`);
    declared.set(name, relative(ROOT, f));
  }
});

const js = `(function(){\n'use strict';\n\n${chunks.join('\n\n')}\n})();`;

/* ---------------------------------------------------------------- 3. html */
let html = read('index.html');
html = html
  .replace(/\n?\s*<!--[\s\S]*?-->/g, '')
  .replace(/\n?\s*<link rel="stylesheet"[^>]*>/g, '')
  .replace(/\n?\s*<script type="module"[^>]*><\/script>/g, '')
  /* Replacer FUNCTIONS, not strings: a "$$" inside the bundle would otherwise
     be eaten as a replacement pattern by String.replace. */
  .replace('</head>', () => `<style>\n${css}\n</style>\n</head>`)
  .replace('</body>', () => `<script>\n${js}\n</script>\n</body>`);

mkdirSync(resolve(ROOT, 'dist'), { recursive:true });
const out = resolve(ROOT, 'dist/99worldcup.html');
writeFileSync(out, html);

console.log('built  ' + relative(ROOT, out));
console.log('       ' + order.length + ' modules, ' + (html.length / 1024).toFixed(0) + ' KB total');
