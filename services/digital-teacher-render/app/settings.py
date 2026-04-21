"""环境配置"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="APP_")

    # 是否启用 GPU(本地开发可关闭)
    gpu_enabled: bool = False

    # Agora
    agora_app_id: str = ""
    agora_app_cert: str = ""

    # Redis(与 orchestrator 共用,取断点/会话)
    redis_url: str = "redis://localhost:6379/0"

    # TTS 双通道
    tts_primary_endpoint: str = "http://localhost:9001/tts/synthesize"
    tts_backup_endpoint: str = "https://openspeech.bytedance.com/api/v1/tts"
    tts_primary_timeout_s: float = 3.0

    # 推流参数
    video_fps_speaking: int = 30
    video_fps_listening: int = 15
    video_fps_idle: int = 10
    video_resolution: tuple[int, int] = (1280, 720)
    audio_sample_rate: int = 48000

    # 性能目标
    lip_sync_tolerance_ms: int = 80
    tts_fade_out_ms: int = 200


settings = Settings()
