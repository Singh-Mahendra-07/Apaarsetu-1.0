/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Supply chain patch for GHSA-vfj7-8cjw-p6xm (CWE-674 / CVE-2026-93687).
 * Adds recursive depth guards to braces compile.js and expand.js to protect
 * against stack-exhaustion Denial of Service from maliciously nested AST patterns.
 */
const fs = require('fs');
const path = require('path');

const bracesDir = path.join(__dirname, '..', 'node_modules', 'braces', 'lib');
const compileFile = path.join(bracesDir, 'compile.js');
const expandFile = path.join(bracesDir, 'expand.js');

if (fs.existsSync(compileFile)) {
  let content = fs.readFileSync(compileFile, 'utf8');
  if (!content.includes('MAX_DEPTH')) {
    content = content.replace(
      'const compile = (ast, options = {}) => {',
      'const MAX_DEPTH = 1000;\n\nconst compile = (ast, options = {}) => {'
    );
    content = content.replace(
      'const walk = (node, parent = {}) => {',
      'const walk = (node, parent = {}, depth = 0) => {\n    if (depth > MAX_DEPTH) {\n      throw new RangeError("Maximum brace depth exceeded (" + depth + ")");\n    }'
    );
    content = content.replace(
      'output += walk(child, node);',
      'output += walk(child, node, depth + 1);'
    );
    fs.writeFileSync(compileFile, content, 'utf8');
    console.log('[SECURITY PATCH] Applied recursion depth guard to braces/lib/compile.js');
  }
}

if (fs.existsSync(expandFile)) {
  let content = fs.readFileSync(expandFile, 'utf8');
  if (!content.includes('MAX_DEPTH')) {
    content = content.replace(
      'const expand = (ast, options = {}) => {',
      'const MAX_DEPTH = 1000;\n\nconst expand = (ast, options = {}) => {'
    );
    content = content.replace(
      'const walk = (node, parent = {}) => {',
      'const walk = (node, parent = {}, depth = 0) => {\n    if (depth > MAX_DEPTH) {\n      throw new RangeError("Maximum brace depth exceeded (" + depth + ")");\n    }'
    );
    content = content.replace(
      'walk(child, node);',
      'walk(child, node, depth + 1);'
    );
    fs.writeFileSync(expandFile, content, 'utf8');
    console.log('[SECURITY PATCH] Applied recursion depth guard to braces/lib/expand.js');
  }
}
