package com.wandou.orchestrator.agora.media;

public interface PackableEx extends Packable {
    void unmarshal(ByteBuf in);
}
