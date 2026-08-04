import json
import pathlib
import shutil
import urllib.parse

hist = pathlib.Path(r"C:/Users/iamhe/AppData/Roaming/Cursor/User/History")
restore_root = pathlib.Path(r"D:/foodie/foodie-frontend/packages")
restored = []

for entries_path in hist.glob("*/entries.json"):
    try:
        data = json.loads(entries_path.read_text(encoding="utf-8"))
    except Exception:
        continue
    resource = data.get("resource") or ""
    if "foodie-shared-rn" not in resource and "foodie-shared-web" not in resource:
        continue

    path = urllib.parse.unquote(resource)
    if path.startswith("file:///"):
        path = path[len("file:///") :]
    elif path.startswith("file://"):
        path = path[len("file://") :]
    path = path.replace("\\", "/")

    if len(path) >= 2 and path[1] == ":":
        abs_path = pathlib.Path(path)
    elif path.lower().startswith("d:/"):
        abs_path = pathlib.Path("D:/" + path[3:])
    else:
        abs_path = pathlib.Path(path)

    s = abs_path.as_posix()
    if "/foodie-shared-rn/" in s:
        rel = s.split("/foodie-shared-rn/", 1)[1]
        dest = restore_root / "shared-rn" / rel
    elif "/foodie-shared-web/" in s:
        rel = s.split("/foodie-shared-web/", 1)[1]
        dest = restore_root / "shared-web" / rel
    else:
        continue

    entries = data.get("entries") or []
    if not entries:
        continue
    latest = entries[-1]["id"]
    src = entries_path.parent / latest
    if not src.exists():
        print("missing history blob", src)
        continue
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)
    restored.append(str(dest))

print(f"Restored {len(restored)} files from Cursor history")
for p in restored:
    print(p)
