"""规则求值器 · 支持 metric 条件 + all/any 聚合"""
import operator
from typing import Any

from app.models import Rule, RuleCondition, StudentProfile

OP_TABLE = {
    "<":  operator.lt,
    "<=": operator.le,
    "==": operator.eq,
    ">=": operator.ge,
    ">":  operator.gt,
    "!=": operator.ne,
}


def get_metric(profile: StudentProfile | Any, path: str) -> Any:
    """解析 'student.avg_interactions_per_class' 这种路径"""
    parts = path.split(".")
    # 去掉前缀 'student.' 或 'class.'
    if parts[0] in ("student", "class"):
        parts = parts[1:]
    obj: Any = profile
    for p in parts:
        if obj is None:
            return None
        obj = obj.get(p) if isinstance(obj, dict) else getattr(obj, p, None)
    return obj


def eval_condition(cond: RuleCondition, profile: StudentProfile | Any) -> bool:
    """递归求值"""
    if cond.all:
        return all(eval_condition(sub, profile) for sub in cond.all)
    if cond.any:
        return any(eval_condition(sub, profile) for sub in cond.any)
    if cond.metric and cond.op:
        actual = get_metric(profile, cond.metric)
        if actual is None:
            return False
        try:
            return OP_TABLE[cond.op](actual, cond.value)
        except TypeError:
            return False
    return False


def match_rule(rule: Rule, profile: StudentProfile | Any) -> bool:
    return eval_condition(rule.when, profile)
