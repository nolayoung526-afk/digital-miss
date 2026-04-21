"""规则引擎单测 · 6 条 MVP 规则命中性验证"""
from datetime import datetime

import pytest

from app.models import ClassProfile, StrategyKnobs, StudentProfile
from app.rules.engine import StrategyEngine
from app.rules.loader import RuleRegistry


@pytest.fixture
def registry(tmp_path):
    # 指向真实 rules 目录
    import os
    root = os.path.join(os.path.dirname(__file__), "..", "rules")
    r = RuleRegistry()
    r.load_from_path(root)
    return r


def make_student(**kwargs) -> StudentProfile:
    base = dict(student_id="stu_test", recent_classes_count=5)
    base.update(kwargs)
    return StudentProfile(**base)


def test_low_participation_matched(registry):
    sp = make_student(avg_interactions_per_class=4, recent_classes_count=5)
    engine = StrategyEngine(registry)
    cfg = engine.generate("lc_1", ClassProfile(class_id="lc_1"), [sp])
    s = cfg.student_strategies[0]
    assert "R_LOW_PARTICIPATION" in s.matched_rules
    assert s.knobs.K4_call_weight == 1.5
    assert s.knobs.K9_reward_weight == {"star": 0.3, "red_packet": 0.5, "clap": 0.2}


def test_cold_start_uses_default(registry):
    sp = make_student(avg_interactions_per_class=3, recent_classes_count=2)  # <3
    engine = StrategyEngine(registry)
    cfg = engine.generate("lc_1", ClassProfile(class_id="lc_1"), [sp])
    s = cfg.student_strategies[0]
    assert s.applied_profile == "default"
    assert s.matched_rules == []


def test_confused_hotspot(registry):
    sp = make_student(confused_ratio=0.32)
    engine = StrategyEngine(registry)
    cfg = engine.generate("lc_1", ClassProfile(class_id="lc_1"), [sp])
    s = cfg.student_strategies[0]
    assert "R_CONFUSED_HOTSPOT" in s.matched_rules
    assert s.knobs.K3_tts_speed == 0.92
    assert s.knobs.K1_difficulty == "easy"


def test_hard_constraint_clamp(registry):
    # 模拟一个极端规则命中(手动覆盖)
    sp = make_student(confused_ratio=0.9)
    engine = StrategyEngine(registry)
    cfg = engine.generate("lc_1", ClassProfile(class_id="lc_1"), [sp])
    s = cfg.student_strategies[0]
    assert 0.85 <= s.knobs.K3_tts_speed <= 1.10


def test_asr_unfriendly_by_age(registry):
    sp = make_student(age=5, asr_success_rate=0.85)
    engine = StrategyEngine(registry)
    cfg = engine.generate("lc_1", ClassProfile(class_id="lc_1"), [sp])
    s = cfg.student_strategies[0]
    assert "R_ASR_UNFRIENDLY" in s.matched_rules
    assert s.knobs.K10_question_type["voice"] == 0.0


def test_class_scattered(registry):
    engine = StrategyEngine(registry)
    cfg = engine.generate(
        "lc_1",
        ClassProfile(class_id="lc_1", profile_variance=0.5),
        [],
    )
    assert cfg.class_knobs.K2_density == 1.2
    assert cfg.class_knobs.K5_reward_rhythm == "per_3_questions"


def test_rules_loaded(registry):
    # 6 条 MVP 规则都加载成功
    assert len(registry.all()) == 6
