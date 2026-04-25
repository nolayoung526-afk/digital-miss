-- H2 测试 schema · MySQL 兼容模式
CREATE TABLE IF NOT EXISTS teacher_personas (
  id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
  persona_id          VARCHAR(36) NOT NULL UNIQUE,
  real_teacher_id     VARCHAR(64) NOT NULL,
  display_name        VARCHAR(32) NOT NULL,
  avatar_asset_id     VARCHAR(512) NOT NULL,
  voice_profile_id    VARCHAR(512) NOT NULL,
  license_doc_url     VARCHAR(512) NOT NULL,
  license_valid_until DATE NOT NULL,
  status              VARCHAR(16) NOT NULL DEFAULT 'collecting',
  style_preset        VARCHAR(16) NOT NULL DEFAULT 'cartoon_2d',
  render_vendor       VARCHAR(16) NOT NULL DEFAULT 'mock',
  vendor_avatar_id    VARCHAR(128),
  tts_vendor          VARCHAR(16) NOT NULL DEFAULT 'mock',
  vendor_voice_id     VARCHAR(128),
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at          TIMESTAMP NULL
);
