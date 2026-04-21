package com.wandou.fallback.config;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.boot.autoconfigure.kafka.KafkaProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.listener.ContainerProperties;
import org.springframework.kafka.support.serializer.JsonDeserializer;

import java.util.Map;

/**
 * Kafka 消费者配置 · 手动 ACK(At-least-once)
 */
@Configuration
public class KafkaConfig {

    @Bean(name = "manualAckFactory")
    public ConcurrentKafkaListenerContainerFactory<String, Object> manualAckFactory(
            KafkaProperties props) {

        Map<String, Object> cfg = props.buildConsumerProperties(null);
        cfg.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        cfg.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        cfg.put(JsonDeserializer.TRUSTED_PACKAGES, "*");
        cfg.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);

        ConsumerFactory<String, Object> cf = new DefaultKafkaConsumerFactory<>(cfg);

        ConcurrentKafkaListenerContainerFactory<String, Object> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(cf);
        factory.getContainerProperties()
                .setAckMode(ContainerProperties.AckMode.MANUAL_IMMEDIATE);
        factory.setConcurrency(3);
        return factory;
    }
}
