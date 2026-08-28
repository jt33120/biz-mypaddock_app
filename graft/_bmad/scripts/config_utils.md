# _bmad/scripts/config_utils.py

- ConfigError · class · L10-L11 — class ConfigError(ValueError)
- load_toml · function · L17-L34 — def load_toml(path: Path, *, required: bool = False) -> dict[str, Any]
- _detect_keyed_merge_field · function · L37-L54 — def _detect_keyed_merge_field(items: list[Any]) -> str | None
- _merge_arrays · function · L57-L76 — def _merge_arrays(base: list[Any], override: list[Any]) -> list[Any]
- structural_merge · function · L79-L88 — def structural_merge(base: Any, override: Any) -> Any
- merge_layers · function · L91-L95 — def merge_layers(layers: Iterable[dict[str, Any]]) -> dict[str, Any]
- load_central_config · function · L98-L107 — def load_central_config(project_root: Path) -> dict[str, Any]
- load_customization · function · L110-L119 — def load_customization(project_root: Path | None, skill_dir: Path) -> dict[str, Any]
