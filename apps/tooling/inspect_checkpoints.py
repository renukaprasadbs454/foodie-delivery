"""Restore foodie-shared-rn / foodie-shared-web from Cursor commit checkpoints."""
from __future__ import annotations

import json
import pathlib
import shutil
from typing import Dict, Tuple

CK = pathlib.Path(
    r"C:/Users/iamhe/AppData/Roaming/Cursor/User/globalStorage/anysphere.cursor-commits/checkpoints"
)
OUT_RN = pathlib.Path(r"D:/foodie/foodie-frontend/packages/shared-rn")
OUT_WEB = pathlib.Path(r"D:/foodie/foodie-frontend/packages/shared-web")

# path -> (mtime_or_order, src_file)
best: Dict[str, Tuple[float, pathlib.Path]] = {}

for meta_path in CK.glob("*/metadata.json"):
    try:
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
    except Exception:
        continue
    ck_dir = meta_path.parent
    # Try common shapes
    file_entries = []
    if isinstance(meta, dict):
        if "files" in meta and isinstance(meta["files"], list):
            file_entries = meta["files"]
        elif "entries" in meta and isinstance(meta["entries"], list):
            file_entries = meta["entries"]
        else:
            # Sometimes metadata maps id -> path
            for k, v in meta.items():
                if isinstance(v, str) and ("foodie-shared" in v or "shared-rn" in v or "shared-web" in v):
                    file_entries.append({"id": k, "path": v})
                elif isinstance(v, dict) and "path" in v:
                    file_entries.append({"id": k, **v})

    mtime = meta_path.stat().st_mtime

    # Also scan diffs/files directories with companion sidecars
    for folder in ("files", "diffs"):
        d = ck_dir / folder
        if not d.is_dir():
            continue
        for f in d.iterdir():
            if not f.is_file():
                continue
            # Heuristic: read first lines for package markers if metadata incomplete
            try:
                sample = f.read_text(encoding="utf-8", errors="ignore")[:2000]
            except Exception:
                continue
            # Use metadata match preferentially
            pass

    for ent in file_entries:
        if not isinstance(ent, dict):
            continue
        path = ent.get("path") or ent.get("filePath") or ent.get("uri") or ent.get("resource") or ""
        file_id = ent.get("id") or ent.get("fileId") or ent.get("uuid")
        if not path:
            continue
        path_norm = str(path).replace("\\", "/")
        if "foodie-shared-rn" not in path_norm and "foodie-shared-web" not in path_norm:
            continue
        if not file_id:
            continue
        src = ck_dir / "files" / str(file_id)
        if not src.exists():
            src = ck_dir / "diffs" / str(file_id)
        if not src.exists():
            continue
        # relative path inside package
        if "/foodie-shared-rn/" in path_norm:
            rel = path_norm.split("/foodie-shared-rn/", 1)[1]
            key = "rn:" + rel
        elif "/foodie-shared-web/" in path_norm:
            rel = path_norm.split("/foodie-shared-web/", 1)[1]
            key = "web:" + rel
        else:
            continue
        prev = best.get(key)
        if prev is None or mtime >= prev[0]:
            best[key] = (mtime, src)

print("metadata-mapped candidates", len(best))

# Fallback: dump metadata keys for debugging one checkpoint
sample_meta = next(CK.glob("*/metadata.json"))
sample = json.loads(sample_meta.read_text(encoding="utf-8"))
print("sample metadata type", type(sample).__name__)
if isinstance(sample, dict):
    print("sample keys", list(sample.keys())[:30])
    for k in list(sample.keys())[:5]:
        v = sample[k]
        print(" ", k, type(v).__name__, str(v)[:120].replace("\n", " "))
