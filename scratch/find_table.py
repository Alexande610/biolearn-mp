import os
import sys

p = r"c:\TailieucuaMintPhut\NextGen\supabase_unified_migration.sql"

if os.path.exists(p):
    with open(p, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    for idx, line in enumerate(lines):
        if "quiz_rooms" in line.lower() and "create" in line.lower():
            start = max(0, idx - 2)
            end = min(len(lines), idx + 18)
            text = "\n".join(lines[start:end])
            # Print only ascii or safe characters
            print(text.encode('ascii', errors='replace').decode('ascii'))
            print("=" * 50)
