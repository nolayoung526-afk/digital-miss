"""策略引擎主执行逻辑"""
from datetime import datetime

import structlog

from app.models import (
    ClassProfile,
    Rule,
    StrategyConfig,
    StrategyKnobs,
    StudentProfile,
    StudentStrategy,
)
from app.rules.evaluator import match_rule
from app.rules.loader import RuleRegistry
from app.settings import settings

log = structlog.get_logger()


class StrategyEngine:
    """规则 + 硬约束 · MVP 纯规则层(V2 叠加 Contextual Bandit)"""

    def __init__(self, registry: RuleRegistry):
        self.registry = registry

    def generate(
        self,
        class_id: str,
        class_profile: ClassProfile,
        student_profiles: list[StudentProfile],
    ) -> StrategyConfig:
        # 班级级规则
        class_knobs = StrategyKnobs()
        for rule in self.registry.by_scope("class"):
            if match_rule(rule, class_profile):
                self._apply_then(class_knobs, rule.then)
                log.info("rule.matched.class", class_id=class_id, rule_id=rule.id)

        # 学员级规则
        strategies: list[StudentStrategy] = []
        for sp in student_profiles:
            strategies.append(self._apply_student(sp))

        # 硬约束裁剪
        class_knobs = self._clamp(class_knobs)
        for s in strategies:
            s.knobs = self._clamp(s.knobs)

        return StrategyConfig(
            class_id=class_id,
            generated_at=datetime.utcnow(),
            class_knobs=class_knobs,
            student_strategies=strategies,
            fallback="default_profile",
        )

    def _apply_student(self, sp: StudentProfile) -> StudentStrategy:
        if sp.is_cold_start():
            return StudentStrategy(
                student_id=sp.student_id,
                applied_profile="default",
            )

        knobs = StrategyKnobs()
        matched: list[str] = []
        for rule in self.registry.by_scope("student"):
            if match_rule(rule, sp):
                self._apply_then(knobs, rule.then)
                matched.append(rule.id)
                log.info("rule.matched.student",
                         student_id=sp.student_id, rule_id=rule.id)

        return StudentStrategy(
            student_id=sp.student_id,
            knobs=knobs,
            matched_rules=matched,
            applied_profile="personalized" if matched else "default",
        )

    def _apply_then(self, knobs: StrategyKnobs, then: dict) -> None:
        """将规则 then 节点写入 knobs · 后命中覆盖前命中"""
        # 扁平 knobs 字段
        for field in knobs.model_fields:
            if field in then:
                setattr(knobs, field, then[field])

        # 嵌套结构(knobs 包装 · 旧 YAML 可能写成 { knobs: { K1: ... } })
        if "knobs" in then and isinstance(then["knobs"], dict):
            for k, v in then["knobs"].items():
                if k in knobs.model_fields:
                    setattr(knobs, k, v)

        # 权重类 reward_weight / question_type 单独处理
        if "reward_weight" in then:
            knobs.K9_reward_weight = then["reward_weight"]
        if "question_type" in then:
            knobs.K10_question_type = then["question_type"]

    def _clamp(self, knobs: StrategyKnobs) -> StrategyKnobs:
        """硬约束裁剪(卷五 §5.4)"""
        if knobs.K3_tts_speed is not None:
            knobs.K3_tts_speed = max(
                settings.k3_tts_speed_min,
                min(settings.k3_tts_speed_max, knobs.K3_tts_speed),
            )
        if knobs.K2_density is not None:
            knobs.K2_density = max(
                settings.k2_density_min,
                min(settings.k2_density_max, knobs.K2_density),
            )
        return knobs
