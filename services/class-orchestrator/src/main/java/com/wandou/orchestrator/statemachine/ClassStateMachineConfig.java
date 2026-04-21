package com.wandou.orchestrator.statemachine;

import com.wandou.orchestrator.domain.ClassEvent;
import com.wandou.orchestrator.domain.ClassState;
import org.springframework.context.annotation.Configuration;
import org.springframework.statemachine.config.EnableStateMachineFactory;
import org.springframework.statemachine.config.EnumStateMachineConfigurerAdapter;
import org.springframework.statemachine.config.builders.StateMachineStateConfigurer;
import org.springframework.statemachine.config.builders.StateMachineTransitionConfigurer;

import java.util.EnumSet;

/**
 * 课堂状态机配置(PRD 卷三 §3.2)
 *
 * <p>scheduled → warming → live → ended
 *                              ↘→ aborted
 */
@Configuration
@EnableStateMachineFactory
public class ClassStateMachineConfig extends EnumStateMachineConfigurerAdapter<ClassState, ClassEvent> {

    @Override
    public void configure(StateMachineStateConfigurer<ClassState, ClassEvent> states) throws Exception {
        states.withStates()
                .initial(ClassState.SCHEDULED)
                .states(EnumSet.allOf(ClassState.class))
                .end(ClassState.ENDED)
                .end(ClassState.ABORTED);
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<ClassState, ClassEvent> transitions) throws Exception {
        transitions
                .withExternal().source(ClassState.SCHEDULED).target(ClassState.WARMING).event(ClassEvent.WARM)
                .and()
                .withExternal().source(ClassState.WARMING).target(ClassState.LIVE).event(ClassEvent.START)
                .and()
                .withExternal().source(ClassState.LIVE).target(ClassState.ENDED).event(ClassEvent.END)
                .and()
                .withExternal().source(ClassState.WARMING).target(ClassState.ABORTED).event(ClassEvent.ABORT)
                .and()
                .withExternal().source(ClassState.LIVE).target(ClassState.ABORTED).event(ClassEvent.ABORT);
    }
}
