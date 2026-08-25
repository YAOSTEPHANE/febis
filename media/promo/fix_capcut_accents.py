"""Fix CapCut draft texts that store accents as literal \\u00e9 sequences."""
from __future__ import annotations

import json
import re
import shutil
from datetime import datetime
from pathlib import Path

DRAFTS = [
    Path(
        r"C:\Users\UTILISATEUR\AppData\Local\CapCut\User Data\Projects"
        r"\com.lveditor.draft\1787647155059544_DigitalPro_pub_apps_reels"
        r"\draft_content.json"
    ),
    Path(
        r"C:\Users\UTILISATEUR\AppData\Local\CapCut\User Data\Projects"
        r"\com.lveditor.draft\1787647547826060_DigitalPro_pub_v2_youtube"
        r"\draft_content.json"
    ),
]

ESCAPE_RE = re.compile(r"\\u([0-9a-fA-F]{4})")


def unescape_literal_unicode(text: str) -> str:
    """Turn literal \\u00e9 sequences into real Unicode characters."""
    if "\\u" not in text:
        return text
    return ESCAPE_RE.sub(lambda m: chr(int(m.group(1), 16)), text)


def fix_draft(path: Path) -> int:
    if not path.exists():
        print(f"SKIP missing {path}")
        return 0

    backup = path.with_name(
        path.name + f".backup.fix_accents_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    )
    shutil.copy2(path, backup)

    with path.open("r", encoding="utf-8") as f:
        draft = json.load(f)

    fixed = 0
    texts = draft.get("materials", {}).get("texts", [])
    for item in texts:
        content = item.get("content")
        if not isinstance(content, str):
            continue
        try:
            inner = json.loads(content)
        except json.JSONDecodeError:
            # Content may itself contain broken escapes; unescape then parse
            try:
                inner = json.loads(unescape_literal_unicode(content))
            except json.JSONDecodeError as exc:
                print(f"FAIL parse {path.name}: {exc}")
                continue

        old = inner.get("text", "")
        if not isinstance(old, str):
            continue
        new = unescape_literal_unicode(old)
        if new != old or "\\u" in content:
            inner["text"] = new
            item["content"] = json.dumps(inner, ensure_ascii=False, separators=(",", ":"))
            fixed += 1
            print(f"FIXED: {old!r} -> {new!r}")

    with path.open("w", encoding="utf-8") as f:
        json.dump(draft, f, ensure_ascii=False, separators=(",", ":"))

    print(f"Wrote {path} ({fixed} texts), backup {backup.name}")
    return fixed


def verify(path: Path) -> None:
    if not path.exists():
        return
    with path.open("r", encoding="utf-8") as f:
        raw = f.read()
    print(f"VERIFY {path.parent.name}: literal \\u00 count = {raw.count(chr(92)+'u00')}")
    draft = json.loads(raw)
    for item in draft["materials"]["texts"]:
        text = json.loads(item["content"]).get("text", "")
        if any(ch in text for ch in "éàèçôêî"):
            print(f"  OK: {text}")


def main() -> None:
    total = 0
    for draft in DRAFTS:
        total += fix_draft(draft)
        verify(draft)
    print(f"Done. Total fixed: {total}")


if __name__ == "__main__":
    main()
