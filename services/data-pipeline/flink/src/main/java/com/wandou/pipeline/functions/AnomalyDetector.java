package com.wandou.pipeline.functions;

import com.wandou.pipeline.models.StudentWindowAgg;
import org.apache.flink.api.common.state.ValueState;
import org.apache.flink.api.common.state.ValueStateDescriptor;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.functions.KeyedProcessFunction;
import org.apache.flink.util.Collector;

/**
 * 反事实监控(卷五 §5.6)· 连续 2 窗口指标下降 > 10% → 触发策略回退告警
 */
public class AnomalyDetector
        extends KeyedProcessFunction<String, StudentWindowAgg, String> {

    private static final double THRESHOLD_DROP = 0.10;

    private transient ValueState<Double> prevCorrectRate;
    private transient ValueState<Integer> consecutiveDrops;

    @Override
    public void open(Configuration parameters) {
        prevCorrectRate = getRuntimeContext().getState(
                new ValueStateDescriptor<>("prev_correct_rate", Double.class));
        consecutiveDrops = getRuntimeContext().getState(
                new ValueStateDescriptor<>("consecutive_drops", Integer.class));
    }

    @Override
    public void processElement(StudentWindowAgg agg, Context ctx, Collector<String> out)
            throws Exception {
        if (agg.getTotalAnswers() == 0) return;

        double current = (double) agg.getCorrectCount() / agg.getTotalAnswers();
        Double prev = prevCorrectRate.value();

        if (prev != null && prev > 0 && (prev - current) / prev > THRESHOLD_DROP) {
            Integer drops = consecutiveDrops.value();
            int count = (drops == null ? 0 : drops) + 1;
            consecutiveDrops.update(count);
            if (count >= 2) {
                out.collect(String.format(
                        "{\"alert\":\"counterfactual.drop\",\"class_id\":\"%s\",\"student_id\":\"%s\","
                        + "\"prev_correct_rate\":%.3f,\"curr_correct_rate\":%.3f}",
                        agg.getClassId(), agg.getStudentId(), prev, current));
                consecutiveDrops.update(0);  // 告警后重置
            }
        } else {
            consecutiveDrops.update(0);
        }
        prevCorrectRate.update(current);
    }
}
