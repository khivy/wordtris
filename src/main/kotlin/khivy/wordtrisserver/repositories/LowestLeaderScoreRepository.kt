package khivy.wordtrisserver.repositories.lls

import org.springframework.data.redis.connection.RedisConnectionFactory
import org.springframework.data.redis.repository.configuration.EnableRedisRepositories
import org.springframework.data.redis.core.RedisHash
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.data.annotation.Id
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.data.redis.connection.jedis.JedisConnectionFactory
import java.io.Serializable
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository
import org.springframework.data.jpa.repository.JpaRepository
import khivy.wordtrisserver.datamodel.LowestLeaderScore

@Repository
interface LowestLeaderScoreRepository : CrudRepository<LowestLeaderScore?, String?>