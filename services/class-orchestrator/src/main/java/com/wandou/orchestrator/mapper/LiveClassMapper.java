package com.wandou.orchestrator.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.wandou.orchestrator.domain.LiveClass;
import org.apache.ibatis.annotations.Mapper;

/**
 * 直播课堂 Mapper · 基于 MyBatis-Plus
 * 提供基础 CRUD,复杂查询用 @Select 注解或 XML
 */
@Mapper
public interface LiveClassMapper extends BaseMapper<LiveClass> {
}
