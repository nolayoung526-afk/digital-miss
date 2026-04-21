"""规则加载器 · 扫描 YAML 目录"""
from pathlib import Path

import structlog
import yaml

from app.models import Rule
from app.settings import settings

log = structlog.get_logger()


class RuleRegistry:
    """规则仓库 · MVP 从文件加载 · 未来改为 MySQL"""

    def __init__(self):
        self._rules: list[Rule] = []
        self._package_version: str = ""

    def load_from_path(self, path: str | Path) -> None:
        """扫描目录下所有 *.yaml · 校验受保护属性 · 按 priority 排序"""
        self._rules.clear()
        root = Path(path)
        if not root.exists():
            log.warning("rules_path.not_found", path=str(root))
            return

        for yml in sorted(root.glob("*.yaml")):
            try:
                data = yaml.safe_load(yml.read_text(encoding="utf-8"))
                if not data:
                    continue
                # 可能是 package 形式(含 meta + rules)也可能是单 rule
                if "rules" in data:
                    self._package_version = data.get("meta", {}).get("version", "unknown")
                    for rule_dict in data["rules"]:
                        rule = self._validate_and_build(rule_dict, source=yml.name)
                        if rule:
                            self._rules.append(rule)
                else:
                    rule = self._validate_and_build(data, source=yml.name)
                    if rule:
                        self._rules.append(rule)
            except Exception as e:
                log.error("rule_load_failed", file=str(yml), error=str(e))

        self._rules.sort(key=lambda r: r.priority)
        log.info(
            "rules_loaded",
            total=len(self._rules),
            version=self._package_version,
        )

    def _validate_and_build(self, data: dict, source: str) -> Rule | None:
        """合规校验:禁止使用受保护属性"""
        rule = Rule.model_validate(data)

        # 递归检查 when 中引用的 metric
        def scan_metrics(cond) -> list[str]:
            if cond is None:
                return []
            if cond.metric:
                return [cond.metric]
            metrics = []
            for sub in (cond.all or []):
                metrics.extend(scan_metrics(sub))
            for sub in (cond.any or []):
                metrics.extend(scan_metrics(sub))
            return metrics

        used_metrics = scan_metrics(rule.when)
        forbidden = set(settings.forbidden_attributes)
        hit = [m for m in used_metrics if m in forbidden]
        if hit:
            log.error(
                "rule_rejected.forbidden_attribute",
                rule_id=rule.id,
                source=source,
                forbidden=hit,
            )
            return None

        log.debug("rule_loaded", rule_id=rule.id, source=source)
        return rule

    def all(self) -> list[Rule]:
        return list(self._rules)

    def by_scope(self, scope: str) -> list[Rule]:
        return [r for r in self._rules if r.scope == scope]

    def version(self) -> str:
        return self._package_version
