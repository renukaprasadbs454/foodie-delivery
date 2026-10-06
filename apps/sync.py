import os
import shutil
import re

src_delivery = r'D:\foodie\foodie-frontend\apps\delivery\src'
src_shared = r'D:\foodie\foodie-frontend\packages\shared-rn\src'
dest = r'D:\foodie\foodie-delivery\src'

def copy_and_transform(src, dst_root):
    for root, _, files in os.walk(src):
        for file in files:
            if file == 'index.ts': continue
            if file.endswith(('.ts', '.tsx', '.png', '.jpg')):
                src_path = os.path.join(root, file)
                rel_path = os.path.relpath(src_path, src)
                dst_path = os.path.join(dst_root, rel_path)
                
                os.makedirs(os.path.dirname(dst_path), exist_ok=True)
                
                if file.endswith(('.ts', '.tsx')):
                    with open(src_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    # Transform foodie-shared-rn
                    content = content.replace("from 'foodie-shared-rn'", "from '@/dummy'")
                    content = content.replace('from "foodie-shared-rn"', "from '@/dummy'")
                    
                    # Transform relative paths that point to top-level folders
                    # e.g., ../../../api/endpoints -> @/api/endpoints
                    content = re.sub(r"from\s+['\"](?:\.\./)+(api|components|utils|types|hooks|constants|theme|features|store|navigation)/([^'\"]+)['\"]", r"from '@/\1/\2'", content)
                    
                    # Sometimes they use single dot: ../api -> @/api
                    content = re.sub(r"from\s+['\"]\.\./(api|components|utils|types|hooks|constants|theme|features|store|navigation)/([^'\"]+)['\"]", r"from '@/\1/\2'", content)
                    
                    with open(dst_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                else:
                    shutil.copy2(src_path, dst_path)

print("Copying delivery app files...")
copy_and_transform(src_delivery, dest)

print("Copying shared-rn files...")
copy_and_transform(src_shared, dest)

print("Done.")
