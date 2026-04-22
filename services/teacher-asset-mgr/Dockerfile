# ============================================================
# teacher-asset-mgr Dockerfile · 多阶段构建
# ============================================================

FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
LABEL maintainer="digital-teacher@wandou.com"
LABEL org.opencontainers.image.title="teacher-asset-mgr"
LABEL org.opencontainers.image.description="豌豆思维数字人 · Persona / 资产管理"

RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

COPY --from=build /build/target/teacher-asset-mgr.jar app.jar

USER app
EXPOSE 8082

ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75 -XX:+HeapDumpOnOutOfMemoryError"

HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8082/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
