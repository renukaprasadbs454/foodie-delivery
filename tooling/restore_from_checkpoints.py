"""Re-restore shared packages; prefer files/ blobs, else reconstruct from diffs addedLines."""
from __future__ import annotations

import json
import pathlib
from typing import Dict, Optional, Tuple

CK = pathlib.Path(
    r"C:/Users/iamhe/AppData/Roaming/Cursor/User/globalStorage/anysphere.cursor-commits/checkpoints"
)
OUT = {
    "rn": pathlib.Path(r"D:/foodie/foodie-frontend/packages/shared-rn"),
    "web": pathlib.Path(r"D:/foodie/foodie-frontend/packages/shared-web"),
}


def content_from_checkpoint(ck_dir: pathlib.Path, file_uuid: str) -> Optional[bytes]:
    files_blob = ck_dir / "files" / file_uuid
    diffs_blob = ck_dir / "diffs" / file_uuid

    if files_blob.exists() and files_blob.stat().st_size > 0:
        return files_blob.read_bytes()

    if diffs_blob.exists():
        raw = diffs_blob.read_bytes()
        try:
            obj = json.loads(raw.decode("utf-8"))
        except Exception:
            return raw if raw else None
        if not isinstance(obj, dict):
            return raw
        # Full content fields
        for key in ("contents", "content", "newContent", "afterContent"):
            if key in obj and obj[key]:
                v = obj[key]
                return v.encode("utf-8") if isinstance(v, str) else bytes(v)
        # Reconstruct from addedLines if this looks like a full-file add/replace
        changes = obj.get("diffChanges") or []
        if len(changes) == 1:
            ch = changes[0]
            added = ch.get("addedLines")
            if isinstance(added, list) and added:
                # drop trailing empty line marker commonly present
                lines = list(added)
                if lines and lines[-1] == "":
                    lines = lines[:-1]
                text = "\n".join(lines) + ("\n" if lines else "")
                return text.encode("utf-8")
        # Multi-hunk: cannot safely reconstruct without original — skip
    return None


# Collect best by mtime
best: Dict[str, Tuple[float, bytes, str, str]] = {}  # key -> (mtime, content, rel, kind)

for meta_path in CK.glob("*/metadata.json"):
    try:
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
    except Exception:
        continue
    mtime = meta_path.stat().st_mtime
    ck_dir = meta_path.parent
    for ent in meta.get("requestFiles") or []:
        fs_path = (ent.get("fsPath") or "").replace("\\", "/")
        file_uuid = ent.get("fileUuid")
        if not fs_path or not file_uuid:
            continue
        if "/foodie-shared-rn/" in fs_path:
            kind = "rn"
            rel = fs_path.split("/foodie-shared-rn/", 1)[1]
        elif "/foodie-shared-web/" in fs_path:
            kind = "web"
            rel = fs_path.split("/foodie-shared-web/", 1)[1]
        else:
            continue
        content = content_from_checkpoint(ck_dir, file_uuid)
        if content is None or len(content) == 0:
            continue
        key = f"{kind}:{rel}"
        prev = best.get(key)
        # Prefer larger content on equal/newer mtime if previous was tiny
        if prev is None or mtime > prev[0] or (mtime == prev[0] and len(content) > len(prev[1])):
            # If newer but empty-ish vs older rich content, keep richer if newer is empty
            if prev is not None and len(content) < 10 and len(prev[1]) > 10 and mtime >= prev[0]:
                continue
            best[key] = (mtime, content, rel, kind)
        elif prev is not None and len(prev[1]) < 10 < len(content):
            best[key] = (mtime, content, rel, kind)

written = 0
empty_skipped = 0
for key, (_m, content, rel, kind) in sorted(best.items()):
    dest = OUT[kind] / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(content)
    written += 1

print(f"wrote {written} files from checkpoints")
print("rn files", sum(1 for k in best if k.startswith("rn:")))
print("web files", sum(1 for k in best if k.startswith("web:")))

# Report empty files still present
for kind, root in OUT.items():
    empties = [p for p in root.rglob("*") if p.is_file() and p.stat().st_size == 0]
    print(f"{kind} empty files:", len(empties))
    for p in empties[:20]:
        print(" ", p)

# Validate package.json
for kind in ("rn", "web"):
    pj = OUT[kind] / "package.json"
    print(kind, "package.json size", pj.stat().st_size if pj.exists() else None)
    if pj.exists() and pj.stat().st_size:
        pkg = json.loads(pj.read_text(encoding="utf-8"))
        print(" ", pkg.get("name"), "exports", list((pkg.get("exports") or {}).keys()))
