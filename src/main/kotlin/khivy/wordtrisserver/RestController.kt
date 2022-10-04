package khivy.wordtrisserver.rest

import PlayerSubmissionDataOuterClass.PlayerSubmissionData
import com.google.protobuf.ByteString
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.context.config.ConfigDataException
import org.springframework.context.annotation.Bean
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.redis.connection.RedisStandaloneConfiguration
import org.springframework.data.redis.connection.jedis.JedisConnectionFactory
import org.springframework.data.redis.core.RedisHash
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.data.repository.query.Param
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Repository
import org.springframework.util.Assert
import org.springframework.web.bind.annotation.*
import org.springframework.web.bind.annotation.RestController
import java.io.Serializable
import java.security.MessageDigest
import java.time.OffsetDateTime
import org.springframework.data.annotation.Id
import khivy.wordtrisserver.datamodel.*
import khivy.wordtrisserver.setup.*
import khivy.wordtrisserver.repositories.ip.IpRepository
import khivy.wordtrisserver.repositories.name.NameRepository
import khivy.wordtrisserver.repositories.score.ScoreRepository
import khivy.wordtrisserver.repositories.lls.*


@RestController
class RestController {

    @Autowired
    lateinit var scoreRepository: ScoreRepository

    @Autowired
    lateinit var nameRepository: NameRepository

    @Autowired
    lateinit var ipRepository: IpRepository

    @Autowired
    lateinit var lowestLeaderScoreRepository: LowestLeaderScoreRepository

    @RequestMapping("/save")
    fun save(): String {
        return "Done"
    }

    @RequestMapping("/findallips")
    fun findAllIps() = ipRepository.findAll()

    @RequestMapping("/findallnames")
    fun findAllNames() = nameRepository.findAll()

    @RequestMapping("/findallscores")
    fun findAllScores() = scoreRepository.findAll()

    @PutMapping(value = ["/score"])
    @ResponseBody
    fun updateScore(@RequestBody data: PlayerSubmissionData): ResponseEntity<HttpStatus> {
        // Verify checksum.
        val md = MessageDigest.getInstance("SHA-256")
        if (!data.checksum.toByteArray().contentEquals(md.digest(data.words.toByteArray()))) {
            return ResponseEntity(HttpStatus.NOT_ACCEPTABLE)
        }

        // Ignores request if name is too long.
        if (NAME_LENGTH_MAX < data.name.length) {
            return ResponseEntity(HttpStatus.NOT_ACCEPTABLE)
        }

        saveScoreAndFlush(data)

        // Evicts the lowest score(s) that match the IP & Name combination.
        val scoresMatchingIpAndName = scoreRepository.findScoresWithGivenIpAndNameNative(data.ip, data.name)
        evictLowestScoresFrom(scoresMatchingIpAndName, scoresMatchingIpAndName.size - 1)

        // Evicts the lowest score(s) from the IP.
        val scoresMatchingIp = scoreRepository.findScoresWithGivenIpNative(data.ip)
        if (scoresMatchingIp.size <= MAX_SCORES_PER_IP) {
            return ResponseEntity(HttpStatus.ACCEPTED)
        }
        evictLowestScoresFrom(scoresMatchingIp, scoresMatchingIp.size - MAX_SCORES_PER_IP)

        return ResponseEntity(HttpStatus.ACCEPTED)
    }

    @GetMapping(value = ["/test"])
    fun test() {
        var test = PlayerSubmissionData.newBuilder()
        test.setScore(41)
        test.setName("abc")
        test.setIp("192")
        test.setWords(ByteString.copyFromUtf8("words"))
        test.setChecksum(ByteString.copyFromUtf8("checksum"))
        var message = test.build()

        this.updateScore(message)
    }

    fun saveScoreAndFlush(data: PlayerSubmissionData) {
        val ip = Ip(data.ip)
        ipRepository.saveAndFlush(ip)
        val name = Name(data.name, ip)
        nameRepository.saveAndFlush(name)
        val score = Score(data.score, name, OffsetDateTime.now())
        scoreRepository.saveAndFlush(score)
    }

    fun evictLowestScoresFrom(possibleScoresToEvict: List<Score>, numToEvict: Int) {
        if (numToEvict <= 0) return
        val sorted = possibleScoresToEvict.sortedBy { score -> score.score }
        val allScoresToRemove = sorted
            .take(numToEvict)
            .map { score -> score.name_id }
        nameRepository.deleteAllByIdInBatch(allScoresToRemove) // TODO: Assert that it cascades.
    }

    @PutMapping(value = ["/lowest"])
    fun updateLowestLeader() {
        lowestLeaderScoreRepository.save(LowestLeaderScore(50))
    }

    @RequestMapping("/clear")
    fun removeAll() {
        ipRepository.deleteAll()
        nameRepository.deleteAll()
        scoreRepository.deleteAll()
    }
}
