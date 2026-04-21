package com.wandou.fallback.service;

import com.wandou.fallback.domain.Playbook;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Service;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.Constructor;

import java.io.InputStream;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * 预案加载器 · 启动时扫描 classpath:playbooks/*.yaml
 * <p>生产可改为从 MySQL 加载,支持教研后台动态编辑。
 */
@Slf4j
@Service
public class PlaybookRegistry {

    /** trigger → Playbook */
    private final Map<String, Playbook> registry = new HashMap<>();

    @PostConstruct
    public void loadAll() {
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        try {
            Resource[] resources = resolver.getResources("classpath:playbooks/*.yaml");
            LoaderOptions opts = new LoaderOptions();
            opts.setAllowDuplicateKeys(false);
            Yaml yaml = new Yaml(new Constructor(Playbook.class, opts));

            for (Resource r : resources) {
                try (InputStream is = r.getInputStream()) {
                    Playbook pb = yaml.load(is);
                    if (pb != null && pb.getTrigger() != null) {
                        registry.put(pb.getTrigger(), pb);
                        log.info("playbook loaded · {} (trigger={}) from {}",
                                pb.getPlaybookId(), pb.getTrigger(), r.getFilename());
                    }
                }
            }
            log.info("✅ total {} playbooks loaded", registry.size());
        } catch (Exception e) {
            log.error("failed to load playbooks", e);
        }
    }

    public Optional<Playbook> findByTrigger(String trigger) {
        return Optional.ofNullable(registry.get(trigger));
    }

    public Map<String, Playbook> all() {
        return Collections.unmodifiableMap(registry);
    }
}
