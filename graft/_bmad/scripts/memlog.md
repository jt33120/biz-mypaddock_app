# _bmad/scripts/memlog.py

- now · function · L81-L82 — def now() -> str
- resolve · function · L85-L87 — def resolve(args) -> Path
- split · function · L90-L107 — def split(text: str) -> tuple[dict, str]
- render · function · L110-L113 — def render(meta: dict, body: str) -> str: # Neutralize newlines in values so a multi-line field can't break the fence on re-read.
- touch · function · L116-L119 — def touch(meta: dict) -> None
- write_atomic · function · L122-L129 — def write_atomic(path: Path, text: str) -> None
- entry_count · function · L132-L133 — def entry_count(body: str) -> int
- ack · function · L136-L142 — def ack(path: Path, body: str) -> None
- cmd_init · function · L145-L161 — def cmd_init(args) -> int
- cmd_append · function · L164-L177 — def cmd_append(args) -> int
- cmd_set · function · L180-L187 — def cmd_set(args) -> int
- add_target · function · L190-L194 — def add_target(sp) -> None
- main · function · L197-L220 — def main(argv: list[str] | None = None) -> int
