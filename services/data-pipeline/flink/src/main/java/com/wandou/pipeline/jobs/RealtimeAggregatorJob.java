package com.wandou.pipeline.jobs;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wandou.pipeline.functions.AnomalyDetector;
import com.wandou.pipeline.functions.InteractionAggregator;
import com.wandou.pipeline.models.InteractionEvent;
import com.wandou.pipeline.models.StudentWindowAgg;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.connector.kafka.sink.KafkaRecordSerializationSchema;
import org.apache.flink.connector.kafka.sink.KafkaSink;
import org.apache.flink.connector.kafka.source.KafkaSource;
import org.apache.flink.connector.kafka.source.enumerator.initializer.OffsetsInitializer;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.assigners.TumblingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;

import java.time.Duration;

/**
 * 实时聚合 Job · 对齐 PRD 卷五 §5.5
 *
 * 数据流:
 *   Kafka: interaction.events
 *     ↓ keyBy(class_id, student_id)
 *     ↓ TumblingEventTimeWindows(5min)
 *     ↓ aggregate(InteractionAggregator)
 *     ↓ AnomalyDetector(反事实告警)
 *     ↓ Sink:Hologres(dws) + Kafka(alerts)
 */
public class RealtimeAggregatorJob {

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.enableCheckpointing(60_000);  // 1 min

        // Source
        KafkaSource<String> source = KafkaSource.<String>builder()
                .setBootstrapServers(System.getenv().getOrDefault("KAFKA_BROKERS", "localhost:9092"))
                .setTopics("interaction.events")
                .setGroupId("flink-realtime-aggregator-v1")
                .setStartingOffsets(OffsetsInitializer.committedOffsets())
                .setValueOnlyDeserializer(new SimpleStringSchema())
                .build();

        ObjectMapper mapper = new ObjectMapper();
        DataStream<InteractionEvent> events = env
                .fromSource(source,
                        WatermarkStrategy.<String>forBoundedOutOfOrderness(Duration.ofSeconds(10)),
                        "interaction-events")
                .map(json -> mapper.readValue(json, InteractionEvent.class))
                .returns(InteractionEvent.class);

        // 5min 窗口聚合
        DataStream<StudentWindowAgg> aggregated = events
                .keyBy(ev -> ev.getClassId() + "|" + ev.getStudentId())
                .window(TumblingEventTimeWindows.of(Time.minutes(5)))
                .aggregate(new InteractionAggregator());

        // 反事实告警
        DataStream<String> alerts = aggregated
                .keyBy(StudentWindowAgg::getStudentId)
                .process(new AnomalyDetector());

        // Sink 告警到 Kafka
        KafkaSink<String> alertSink = KafkaSink.<String>builder()
                .setBootstrapServers(System.getenv().getOrDefault("KAFKA_BROKERS", "localhost:9092"))
                .setRecordSerializer(KafkaRecordSerializationSchema.builder()
                        .setTopic("counterfactual.alerts")
                        .setValueSerializationSchema(new SimpleStringSchema())
                        .build())
                .build();
        alerts.sinkTo(alertSink);

        // TODO: dws_student_profile Hologres JDBC Sink
        // aggregated.addSink(...);

        aggregated.print("window-agg");  // 临时 · 便于本地观察
        alerts.print("alert");

        env.execute("realtime-aggregator");
    }
}
