package com.wandou.assetmgr;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.mybatis.spring.annotation.MapperScan;

@SpringBootApplication
@MapperScan("com.wandou.assetmgr.mapper")
public class AssetMgrApplication {
    public static void main(String[] args) {
        SpringApplication.run(AssetMgrApplication.class, args);
    }
}
