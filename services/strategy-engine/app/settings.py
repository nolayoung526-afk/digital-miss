"""全局配置 · 读环境变量"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="APP_")

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # MySQL(可选 · MVP 先读 Hologres)
    hologres_url: str = "postgresql://user:pass@localhost:5432/dws"

    # Kafka
    kafka_brokers: str = "localhost:9092"

    # 规则路径
    rules_path: str = "./rules"

    # 策略硬约束
    k3_tts_speed_min: float = 0.85
    k3_tts_speed_max: float = 1.10
    k2_density_min: float = 0.6
    k2_density_max: float = 1.5

    # 受保护属性(禁止用于规则条件 · 合规红线)
    forbidden_attributes: list[str] = [
        "student.gender",
        "student.ethnicity",
        "student.region",
        "student.income_level",
    ]


settings = Settings()
