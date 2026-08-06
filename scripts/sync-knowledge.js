#!/usr/bin/env node
/**
 * Sync knowledge files into app/index.html
 * 
 * The app embeds knowledge files as JS string constants so it can pass them
 * to the LLM without needing a backend. This script keeps them in sync.
 * 
 * Run: node scripts/sync-knowledge.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const APP_FILE = path.join(ROOT, 'app/index.html');

// Read knowledge files
const EXTRACTION_RULES = fs.readFileSync(path.join(ROOT, 'knowledge/extraction-rules.md'), 'utf8');
const DERIVATION_RULES = fs.readFileSync(path.join(ROOT, 'knowledge/derivation-rules.md'), 'utf8');
const SCHEMA_REFERENCE = fs.readFileSync(path.join(ROOT, 'knowledge/schema-reference.md'), 'utf8');
const UNIT_CONVERSIONS = fs.readFileSync(path.join(ROOT, 'knowledge/unit-conversions.md'), 'utf8');
const GOLDEN_EXAMPLE_V2 = fs.readFileSync(path.join(ROOT, 'knowledge/golden-examples/golden_example_v2.txt'), 'utf8');

// Escape for JS string literal
function escapeForJS(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

// Read the app HTML
let appHTML = fs.readFileSync(APP_FILE, 'utf8');

// Replace each constant
const replacements = [
  {
    name: 'EXTRACTION_RULES_MD',
    content: EXTRACTION_RULES,
    pattern: /const EXTRACTION_RULES_MD = ".*?";/s
  },
  {
    name: 'DERIVATION_RULES_MD',
    content: DERIVATION_RULES,
    pattern: /const DERIVATION_RULES_MD = ".*?";/s
  },
  {
    name: 'SCHEMA_REFERENCE_MD',
    content: SCHEMA_REFERENCE,
    pattern: /const SCHEMA_REFERENCE_MD = ".*?";/s
  },
  {
    name: 'UNIT_CONVERSIONS_MD',
    content: UNIT_CONVERSIONS,
    pattern: /const UNIT_CONVERSIONS_MD = ".*?";/s
  },
  {
    name: 'GOLDEN_EXAMPLE_V2_TXT',
    content: GOLDEN_EXAMPLE_V2,
    pattern: /const GOLDEN_EXAMPLE_V2_TXT = ".*?";/s
  }
];

let changesMade = 0;

replacements.forEach(({ name, content, pattern }) => {
  const escaped = escapeForJS(content);
  const newDeclaration = `const ${name} = "${escaped}";`;
  
  if (appHTML.match(pattern)) {
    const oldHTML = appHTML;
    appHTML = appHTML.replace(pattern, newDeclaration);
    
    if (oldHTML !== appHTML) {
      console.log(`✓ Updated ${name} (${content.length} chars)`);
      changesMade++;
    } else {
      console.log(`✓ ${name} unchanged`);
    }
  } else {
    console.error(`✗ Could not find ${name} in app/index.html`);
    process.exit(1);
  }
});

// Write back
if (changesMade > 0) {
  fs.writeFileSync(APP_FILE, appHTML, 'utf8');
  console.log(`\n✅ Synced ${changesMade} knowledge file(s) into app/index.html`);
  console.log('   Commit the updated app/index.html to deploy the changes.');
} else {
  console.log('\n✓ All knowledge files already in sync');
}
