import os, re

errors = []
for root, _, files in os.walk('.'):
    for f in files:
        if not f.endswith('.md'):
            continue
        p = os.path.join(root, f)
        t = open(p, encoding='utf-8').read()
        dirp = os.path.dirname(p)
        # strip code fences content
        t = re.sub(r'```.*?```', '', t, flags=re.DOTALL)
        t = re.sub(r'    .*', '', t)  # indented code blocks approx
        for m in re.finditer(r'\[\[(\.\.?/[^\]]+)\]\]', t):
            target = m.group(1).replace('\\', '/')
            if 'XX' in target:
                continue
            full = os.path.normpath(os.path.join(dirp, target))
            if not os.path.exists(full):
                errors.append(f'{p}: wiki [{target}] -> NAO EXISTE')
for e in errors:
    print(e)
print(f'total erros: {len(errors)}')