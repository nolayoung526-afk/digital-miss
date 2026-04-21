package com.wandou.orchestrator;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 课堂编排服务入口
 *
 * <p>职责:课堂生命周期管理、Agora 信令转发、助教接管协调、FP 触发分发。
 * 详见 <code>services/class-orchestrator/README.md</code>。
 */
@SpringBootApplication
@MapperScan("com.wandou.orchestrator.mapper")
@EnableKafka
@EnableAsync
@EnableScheduling
public class OrchestratorApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrchestratorApplication.class, args);
    }
}
