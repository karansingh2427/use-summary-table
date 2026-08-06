#!/usr/bin/env python3
"""
Sync knowledge files into app/index.html

The app embeds knowledge files as JS string constants so it can pass them
to the LLM without needing a backend. This script keeps them in sync.

Run: python3 scripts/sync-knowledge.py
"""

import os
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
APP_FILE = ROOT / 'app' / 'index.html'

# Read knowledge files
EXTRACTION_RULES = (ROOT / 'knowledge' / 'extraction-rules.md').read_text('utf-8')
DERIVATION_RULES = (ROOT / 'knowledge' / 'derivation-rules.md').read_text('utf-8')
SCHEMA_REFERENCE = (ROOT / 'knowledge' / 'schema-reference.md').read_text('utf-8')
UNIT_CONVERSIONS = (ROOT / 'knowledge' / 'unit-conversions.md').read_text('utf-8')
GOLDEN_EXAMPLE_V2 = (ROOT / 'knowledge' / 'golden-examples' / 'golden_example_v2.txt').read_text('utf-8')

def escape_for_js(s):
    """Escape string for JS string literal"""
    return (s
        .replace('\\', '\\\\')
        .replace('"', '\\"')
        .replace('\n', '\\n')
        .replace('\r', '\\r')
        .replace('\t', '\\t'))

# Read the app HTML
app_html = APP_FILE.read_text('utf-8')

replacements = [
    ('EXTRACTION_RULES_MD', EXTRACTION_RULES),
    ('DERIVATION_RULES_MD', DERIVATION_RULES),
    ('SCHEMA_REFERENCE_MD', SCHEMA_REFERENCE),
    ('UNIT_CONVERSIONS_MD', UNIT_CONVERSIONS),
    ('GOLDEN_EXAMPLE_V2_TXT', GOLDEN_EXAMPLE_V2),
]

changes_made = 0

for name, content in replacements:
    escaped = escape_for_js(content)
    new_declaration = f'const {name} = "{escaped}";'
    
    # Pattern to match the constant declaration
    pattern = re.compile(rf'const {name} = ".*?";', re.DOTALL)
    
    if pattern.search(app_html):
        old_html = app_html
        app_html = pattern.sub(new_declaration, app_html)
        
        if old_html != app_html:
            print(f'✓ Updated {name} ({len(content)} chars)')
            changes_made += 1
        else:
            print(f'✓ {name} unchanged')
    else:
        print(f'✗ Could not find {name} in app/index.html')
        exit(1)

# Write back
if changes_made > 0:
    APP_FILE.write_text(app_html, 'utf-8')
    print(f'\n✅ Synced {changes_made} knowledge file(s) into app/index.html')
    print('   Commit the updated app/index.html to deploy the changes.')
else:
    print('\n✓ All knowledge files already in sync')
