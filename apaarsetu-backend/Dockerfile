# ============================================================================
# APAARSetu National Registry System — Backend Multi-Stage Dockerfile
# ============================================================================
# Stage 1: Build stage with Eclipse Temurin Java 21 & Maven
# ============================================================================
FROM maven:3.9.6-eclipse-temurin-21-jammy AS builder

WORKDIR /build

# Copy Maven POM and dependency definition first for caching
COPY pom.xml .

# Download dependencies in a separate layer to accelerate subsequent builds
RUN mvn dependency:go-offline -B

# Copy backend source code
COPY src ./src

# Compile and package executable fat jar (skipping tests in final container build)
RUN mvn clean package -DskipTests -B

# ============================================================================
# Stage 2: Hardened, Minimal Production Runtime Container
# ============================================================================
FROM eclipse-temurin:21-jre-jammy AS runner

LABEL maintainer="AICTE National Portal Engineering Team"
LABEL service="apaarsetu-backend"

# Install curl for container health check probes
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Create dedicated non-root application user and group
RUN groupadd -g 10001 apaargroup && \
    useradd -u 10001 -g apaargroup -m -s /bin/bash apaaruser

WORKDIR /app

# Copy the built jar from the builder stage
COPY --from=builder --chown=apaaruser:apaargroup /build/target/apaarsetu-backend-1.0.0.jar app.jar

# Switch to unprivileged non-root user
USER 10001:10001

# Expose internal application port
EXPOSE 8081

# Configure JVM flags optimized for container memory constraints
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"

# Built-in container health check probe hitting the /api/v1/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD curl -f http://localhost:8081/api/v1/health || exit 1

# Launch Spring Boot microservice
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]

