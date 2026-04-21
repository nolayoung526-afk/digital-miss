package com.wandou.orchestrator.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Kafka 事件生产者 · 对齐 infra/mq/topics.md
 *
 * Topics:
 *   class.lifecycle   16p / 90d
 *   takeover.events    8p / 30d
 *   fallback.triggers  8p / 30d
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EventProducer {

    public static final String TOPIC_CLASS_LIFECYCLE  = "class.lifecycle";
    public static final String TOPIC_TAKEOVER         = "takeover.events";
    public static final String TOPIC_FALLBACK         = "fallback.triggers";

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void publishClassLifecycle(String classId, Map<String, Object> payload) {
        publish(TOPIC_CLASS_LIFECYCLE, classId, payload);
    }

    public void publishTakeover(String classId, Map<String, Object> payload) {
        publish(TOPIC_TAKEOVER, classId, payload);
    }

    public void publishFallback(String classId, Map<String, Object> payload) {
        publish(TOPIC_FALLBACK, classId, payload);
    }

    private void publish(String topic, String key, Map<String, Object> payload) {
        Map<String, Object> envelope = new HashMap<>(payload);
        envelope.putIfAbsent("ts", Instant.now().toString());
        envelope.putIfAbsent("class_id", key);

        ProducerRecord<String, Object> record = new ProducerRecord<>(topic, key, envelope);
        kafkaTemplate.send(record).whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("kafka publish failed · topic={} key={} payload={}",
                        topic, key, envelope, ex);
                // TODO: 落本地重试表(MVP 先丢日志),避免事件丢失
            } else {
                log.debug("kafka published · topic={} offset={}",
                        topic, result.getRecordMetadata().offset());
            }
        });
    }
}
