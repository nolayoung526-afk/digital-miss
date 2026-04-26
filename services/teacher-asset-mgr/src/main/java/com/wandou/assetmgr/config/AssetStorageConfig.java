package com.wandou.assetmgr.config;

import com.wandou.assetmgr.service.AssetStorageProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * 把本地 {@code assets/personas/**} 暴露为静态 HTTP 资源 · 方便 Next.js / 厂商 adapter 下载。
 *
 * <p>生产切 OSS 时这个配置可以删掉,改由 CDN 提供。
 */
@Configuration
@EnableConfigurationProperties(AssetStorageProperties.class)
@RequiredArgsConstructor
public class AssetStorageConfig implements WebMvcConfigurer {

    private final AssetStorageProperties props;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        if ("local".equals(props.getType())) {
            String absRoot = Paths.get(props.getLocalRoot()).toAbsolutePath().normalize().toString();
            String pattern = props.getUrlPrefix().replaceAll("/+$", "") + "/**";
            registry.addResourceHandler(pattern)
                    .addResourceLocations("file:" + absRoot + "/");
        }
    }
}
