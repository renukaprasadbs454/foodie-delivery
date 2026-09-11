import os
import filecmp

dir1 = r'D:\foodie\foodie-frontend\apps\delivery\src'
dir2 = r'D:\foodie\foodie-delivery\src'

def compare_dirs(d1, d2):
    diff = filecmp.dircmp(d1, d2)
    left = diff.left_only
    changed = diff.diff_files
    if left: print(f'Only in {d1}: {left}')
    if changed: print(f'Diff in {d1}: {changed}')
    for sub in diff.common_dirs:
        compare_dirs(os.path.join(d1, sub), os.path.join(d2, sub))

compare_dirs(dir1, dir2)

print("\n--- Shared-RN ---\n")
compare_dirs(r'D:\foodie\foodie-frontend\packages\shared-rn\src', r'D:\foodie\foodie-delivery\src')
