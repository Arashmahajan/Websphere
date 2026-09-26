package com.worksphere.hcm.infrastructure.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.net.URI;
import java.time.Duration;

/**
 * WorkSphere Enterprise HCM: Redis Infrastructure Configuration
 * Provides Redis connection and RedisTemplate for caching, session stores,
 * rate limiting, and temporary workflow tokens.
 */
@Configuration
public class RedisConfig {

    @Value("${spring.data.redis.url:redis://localhost:6379}")
    private String redisUrl;

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        try {
            URI uri = URI.create(redisUrl);
            RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
            config.setHostName(uri.getHost() != null ? uri.getHost() : "localhost");
            config.setPort(uri.getPort() > 0 ? uri.getPort() : 6379);

            if (uri.getUserInfo() != null) {
                String[] parts = uri.getUserInfo().split(":");
                if (parts.length > 1) {
                    config.setPassword(parts[1]);
                } else if (parts.length == 1) {
                    config.setPassword(parts[0]);
                }
            }

            LettuceClientConfiguration clientConfig = LettuceClientConfiguration.builder()
                .commandTimeout(Duration.ofMillis(2000))
                .shutdownTimeout(Duration.ofMillis(100))
                .build();

            return new LettuceConnectionFactory(config, clientConfig);
        } catch (Exception e) {
            // Fallback to default localhost:6379
            RedisStandaloneConfiguration fallback = new RedisStandaloneConfiguration("localhost", 6379);
            return new LettuceConnectionFactory(fallback);
        }
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.afterPropertiesSet();
        return template;
    }
}
