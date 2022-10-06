package khivy.wordtrisserver.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.AutoConfigureAfter
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.redis.connection.RedisConnectionFactory
import org.springframework.data.redis.connection.RedisStandaloneConfiguration
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory
import org.springframework.data.redis.core.RedisOperations
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer


@Configuration
@AutoConfigureAfter(RedisAutoConfiguration::class)
class RedisConfig {

    @Value("\${spring.redis.host}")
    private val redisHost: String? = null

    @Value("\${spring.redis.port}")
    private val redisPort: Int? = null

    @Bean
    fun lettuceConnectionFactory(): RedisConnectionFactory? {
        return LettuceConnectionFactory(RedisStandaloneConfiguration(redisHost!!, redisPort!!))
    }

    @Bean
    fun redisTemplate(lettuceConnectionFactory: RedisConnectionFactory?): RedisOperations<String, ByteArray>? {
        val template = RedisTemplate<String, ByteArray>()
        template.setConnectionFactory(lettuceConnectionFactory!!)
        template.valueSerializer = GenericJackson2JsonRedisSerializer()
        return template
    }
}