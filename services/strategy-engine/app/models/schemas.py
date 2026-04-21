"""PRD 卷三 §3.1 + 卷五实体的 Pydantic 模型"""
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


# ================== 画像 ==================
class StudentProfile(BaseModel):
    student_id: str
    age: int | None = None
    grade: int | None = None
    avg_interactions_per_class: float | None = None
    speak_ratio: float | None = None
    correct_rate: float | None = None
    avg_answer_latency_ms: float | None = None
    asr_success_rate: float | None = None
    confused_ratio: float | None = None
    focus_ratio: float | None = None
    barge_in_per_min: float | None = None
    happy_triggers: list[str] = Field(default_factory=list)
    knowledge_mastery: dict[str, float] = Field(default_factory=dict)
    recent_classes_count: int = 0
    updated_at: datetime | None = None

    def is_cold_start(self) -> bool:
        """近 5 节课不足 → 冷启动,走 default_profile"""
        return self.recent_classes_count < 3


class ClassProfile(BaseModel):
    class_id: str
    profile_variance: float | None = None
    avg_focus: float | None = None
    low_participation_ratio: float | None = None


# ================== 策略旋钮 ==================
class StrategyKnobs(BaseModel):
    K1_difficulty: Literal["easy", "balanced", "challenge"] | None = None
    K2_density: float | None = None
    K3_tts_speed: float | None = None
    K4_call_strategy: Literal["balanced", "compensate", "proactive"] | None = None
    K4_call_weight: float | None = None
    K5_reward_rhythm: Literal["per_3_questions", "per_5_questions", "by_performance"] | None = None
    K6_barge_in_policy: Literal["conservative", "default", "open"] | None = None
    K7_board_density: Literal["sparse", "medium", "dense"] | None = None
    K8_emotion_response: Literal["passive", "proactive"] | None = None
    K9_reward_weight: dict[str, float] | None = None
    K10_question_type: dict[str, float] | None = None

    # 额外 Barge-in 控制参数(R_FREQUENT_BARGE_IN)
    vad_threshold_dbfs: float | None = None
    min_speech_ms: int | None = None


class StudentStrategy(BaseModel):
    student_id: str
    variants: dict[str, str] = Field(default_factory=dict)
    knobs: StrategyKnobs = Field(default_factory=StrategyKnobs)
    matched_rules: list[str] = Field(default_factory=list)
    applied_profile: str = "personalized"  # 或 "default"


class StrategyConfig(BaseModel):
    class_id: str
    generated_at: datetime
    class_knobs: StrategyKnobs = Field(default_factory=StrategyKnobs)
    student_strategies: list[StudentStrategy] = Field(default_factory=list)
    fallback: Literal["default_profile"] = "default_profile"


# ================== 规则 ==================
class RuleCondition(BaseModel):
    """简单 DSL 条件 · 单条或 all/any 聚合"""
    metric: str | None = None
    op: Literal["<", "<=", "==", ">=", ">", "!="] | None = None
    value: Any | None = None
    all: list["RuleCondition"] | None = None
    any: list["RuleCondition"] | None = None


RuleCondition.model_rebuild()


class RuleSafety(BaseModel):
    recovery_when: RuleCondition | None = None
    max_consecutive_classes: int | None = None
    cap: dict[str, Any] | None = None


class Rule(BaseModel):
    id: str
    name: str
    priority: int = 100
    scope: Literal["student", "class"] = "student"
    when: RuleCondition
    then: dict[str, Any] = Field(default_factory=dict)
    rationale: str = ""
    safety: RuleSafety | None = None
