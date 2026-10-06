import os

files_to_fix = [
    r'src/api/createBaseApi.ts',
    r'src/features/auth/apiError.ts',
    r'src/hooks/useApiErrorHandler.ts'
]

for fpath in files_to_fix:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace("from '@/api/errorMapping'", "from '@/types/api'")
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)

with open(r'src/core/providers/ThemeProvider.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("from '../../theme'", "from '@/theme'")
with open(r'src/core/providers/ThemeProvider.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
