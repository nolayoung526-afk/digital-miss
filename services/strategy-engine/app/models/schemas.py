"""PRD 卷三 §3.1 + 卷五实体的 Pydantic 模型"""
from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


# ================== 画像 ==================
class StudentProfile(BaseModel):
    student_id: str
    age: Optional[int] = None
    grade: Optional[int] = None
    avg_interactions_per_class: Optional[float] = None
    speak_ratio: Optional[float] = None
    correct_rate: Optional[float] = None
    avg_answer_latency_ms: Optional[float] = None
    asr_success_rate: Optional[float] = None
    confused_ratio: Optional[float] = None
    focus_ratio: Optional[float] = None
    barge_in_per_min: Optional[float] = None
    happy_triggers: list[str] = Field(default_factory=list)
    knowledge_mastery: dict[str, float] = Field(default_factory=dict)
    recent_classes_count: int = 0
    updated_at: Optional[datetime] = None

    def is_cold_start(self) -> bool:
        """近 5 节课不足 → 冷启动,走 default_profile"""
        return self.recent_classes_count < 3


class ClassProfile(BaseModel):
    class_id: str
    profile_variance: Optional[float] = None
    avg_focus: Optional[float] = None
    low_participation_ratio: Optional[float] = None


# ================== 策略旋钮 ==================
class StrategyKnobs(BaseModel):
    K1_difficulty: Optional[Literal["easy", "balanced", "challenge"]] = None
    K2_density: Optional[float] = None
    K3_tts_speed: Optional[float] = None
    K4_call_strategy: Optional[Literal["balanced", "compensate", "proactive"]] = None
    K4_call_weight: Optional[float] = None
    K5_reward_rhythm: Optional[Literal["per_3_questions", "per_5_questions", "by_performance"]] = None
    K6_barge_in_policy: Optional[Literal["conservative", "default", "open"]] = None
    K7_board_density: Optional[Literal["sparse", "medium", "dense"]] = None
    K8_emotion_response: Optional[Literal["passive", "proactive"]] = None
    K9_reward_weight: Optional[dict[str, float]] = None
    K10_question_type: Optional[dict[str, float]] = None

    # 额外 Barge-in 控制参数(R_FREQUENT_BARGE_IN)
    vad_threshold_dbfs: Optional[float] = None
    min_speech_ms: Optional[int] = None


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
    metric: Optional[str] = None
    op: Optional[Literal["<", "<=", "==", ">=", ">", "!="]] = None
    value: Optional[Any] = None
    all: Optional[list["RuleCondition"]] = None
    any: Optional[list["RuleCondition"]] = None


RuleCondition.model_rebuild()


class RuleSafety(BaseModel):
    recovery_when: Optional[RuleCondition] = None
    max_consecutive_classes: Optional[int] = None
    cap: Optional[dict[str, Any]] = None


class Rule(BaseModel):
    id: str
    name: str
    priority: int = 100
    scope: Literal["student", "class"] = "student"
    when: RuleCondition
    then: dict[str, Any] = Field(default_factory=dict)
    rationale: str = ""
    safety: Optional[RuleSafety] = None
