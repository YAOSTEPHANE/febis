"""Fix CapCut DigitalPro drafts: unwrap double-encoded text and real UTF-8 accents."""
from __future__ import annotations

import json
import re
import shutil
from datetime import datetime
from pathlib import Path

BASE = Path(
    r"C:\Users\UTILISATEUR\AppData\Local\CapCut\User Data\Projects\com.lveditor.draft"
)
ESC_RE = re.compile(r"\\u([0-9a-fA-F]{4})")


def unescape(s: str) -> str:
    if "\\u" not in s:
        return s
    return ESC_RE.sub(lambda m: chr(int(m.group(1), 16)), s)


def unwrap_text(value: object) -> str:
    """Extract plain display text from nested JSON / escaped forms."""
    current = value
    for _ in range(5):
        if not isinstance(current, str):
            return str(current) if current is not None else ""
        stripped = current.strip()
        if stripped.startswith("{") and '"text"' in stripped:
            try:
                obj = json.loads(stripped)
            except json.JSONDecodeError:
                try:
                    obj = json.loads(unescape(stripped))
                except json.JSONDecodeError:
                    return unescape(current)
            if isinstance(obj, dict) and "text" in obj:
                current = obj["text"]
                continue
            return unescape(current)
        return unescape(current)
    return unescape(str(current))


def rebuild_content(content: str, plain: str) -> str:
    """Keep CapCut styles if present; put plain UTF-8 text in text field."""
    try:
        obj = json.loads(content)
    except json.JSONDecodeError:
        try:
            obj = json.loads(unescape(content))
        except json.JSONDecodeError:
            return json.dumps({"text": plain}, ensure_ascii=False, separators=(",", ":"))

    if not isinstance(obj, dict):
        return json.dumps({"text": plain}, ensure_ascii=False, separators=(",", ":"))

    # If styles.range length is wrong, fix range to match new text length
    styles = obj.get("styles")
    if isinstance(styles, list) and styles:
        for style in styles:
            if isinstance(style, dict) and "range" in style:
                style["range"] = [0, len(plain)]
        obj["text"] = plain
        return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))

    return json.dumps({"text": plain}, ensure_ascii=False, separators=(",", ":"))


def fix_file(path: Path) -> int:
    backup = path.with_name(
        f"{path.name}.backup.unwrap_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    )
    shutil.copy2(path, backup)
    draft = json.loads(path.read_text(encoding="utf-8"))
    fixed = 0

    for item in draft.get("materials", {}).get("texts", []):
        content = item.get("content")
        if not isinstance(content, str):
            continue
        plain = unwrap_text(content)
        # Also unwrap if content parses but text field is nested JSON
        try:
            parsed = json.loads(content)
            if isinstance(parsed, dict) and "text" in parsed:
                plain = unwrap_text(parsed["text"])
        except json.JSONDecodeError:
            plain = unwrap_text(content)

        new_content = rebuild_content(content, plain)
        old_content = content
        old_base = item.get("base_content")

        changed = new_content != old_content or old_base != plain
        if changed:
            item["content"] = new_content
            item["base_content"] = plain
            fixed += 1
            print(f"  {path.parent.name}")
            print(f"    OLD: {old_content[:120]!r}")
            print(f"    NEW: {plain!r}")

    path.write_text(
        json.dumps(draft, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"Saved {path.parent.name} ({fixed} texts) backup={backup.name}")
    return fixed


def verify(path: Path) -> None:
    raw = path.read_text(encoding="utf-8")
    draft = json.loads(raw)
    print(f"VERIFY {path.parent.name}")
    for item in draft["materials"]["texts"]:
        content = item["content"]
        obj = json.loads(content)
        text = obj.get("text", "")
        if text.strip().startswith("{"):
            print(f"  STILL NESTED: {text[:100]!r}")
        elif "\\u" in text:
            print(f"  STILL ESCAPED: {text[:100]!r}")
        elif any(ord(c) > 127 for c in text):
            print(f"  OK accents: {text}")


def main() -> None:
    total = 0
    for folder in sorted(BASE.glob("*DigitalPro*")):
        draft = folder / "draft_content.json"
        if draft.exists():
            total += fix_file(draft)
            verify(draft)
            print()
    print(f"TOTAL fixed texts: {total}")
    print("IMPORTANT: Close CapCut completely, then reopen the project.")


if __name__ == "__main__":
    main()
