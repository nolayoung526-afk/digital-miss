package com.wandou.orchestrator.config;

import com.wandou.orchestrator.service.AgoraTokenService;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(AgoraTokenService.AgoraProperties.class)
public class AppConfig {

    @Bean
    public OpenAPI openApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Class Orchestrator API")
                        .version("0.1.0")
                        .description("豌豆思维数字人 · 课堂编排服务接口")
                        .contact(new Contact().name("产品 × 研发").email("digital-teacher@wandou.com")));
    }
}
