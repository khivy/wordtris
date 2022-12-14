package khivy.wordtrisserver.web

import PlayerSubmissionDataOuterClass
import io.github.bucket4j.Bandwidth
import io.github.bucket4j.Bucket
import io.github.bucket4j.Refill
import khivy.wordtrisserver.services.CacheService
import khivy.wordtrisserver.services.ProfanityFilterService
import khivy.wordtrisserver.services.score.DataService
import khivy.wordtrisserver.setup.MAX_SCORES_PER_IP
import khivy.wordtrisserver.setup.NAME_LENGTH_MAX
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.security.MessageDigest
import java.time.Duration
import javax.servlet.http.HttpServletRequest


@RestController
@CrossOrigin(origins = ["*"])
class ScoreController {

    @Autowired
    lateinit var dataService: DataService

    @Autowired
    lateinit var cacheService: CacheService

    @Autowired
    lateinit var profanityFilterService: ProfanityFilterService

    lateinit var submitScoreBucket: Bucket
    lateinit var getLeaderboardBucket: Bucket
    lateinit var getPlayerScoreBucket: Bucket

    @Autowired
    fun ScoreController() {
        val submitScoreLimit: Bandwidth = Bandwidth.classic(8, Refill.greedy(8, Duration.ofMinutes(1)))
        this.submitScoreBucket = Bucket.builder()
            .addLimit(submitScoreLimit)
            .build()

        val getLeaderboardLimit: Bandwidth = Bandwidth.classic(20, Refill.greedy(20, Duration.ofMinutes(1)))
        this.getLeaderboardBucket = Bucket.builder()
            .addLimit(getLeaderboardLimit)
            .build()

        val getPlayerScoreLimit: Bandwidth = Bandwidth.classic(20, Refill.greedy(20, Duration.ofMinutes(1)))
        this.getPlayerScoreBucket = Bucket.builder()
            .addLimit(getPlayerScoreLimit)
            .build()
    }

    @PutMapping(value = ["/submitscore"], consumes = ["application/x-protobuf"])
    @ResponseBody
    fun submitScore(@RequestBody body: PlayerSubmissionDataOuterClass.PlayerSubmissionData, request: HttpServletRequest): ResponseEntity<HttpStatus> {

        if (!submitScoreBucket.tryConsume(1)) {
            return ResponseEntity(HttpStatus.TOO_MANY_REQUESTS)
        }

        if (profanityFilterService.containsProfanity(body.name)) {
            return ResponseEntity(HttpStatus.PRECONDITION_FAILED)
        }

        // Verify checksum.
        val md = MessageDigest.getInstance("SHA-256")
        val theirChecksum = body.checksum.toByteArray()
        val myChecksum = md.digest(body.wordsList.joinTo(StringBuilder(), separator = " ").toString().toByteArray())
        if (body.wordsList.size != body.score || !myChecksum.contentEquals(theirChecksum)) {
            println("""Did not accept score:
                |Either given checksum: ${theirChecksum.contentHashCode()}!=${myChecksum.contentHashCode()}
                |or given score: ${body.score}!=${body.wordsList.size}
            """.trimMargin())
            return ResponseEntity(HttpStatus.NOT_ACCEPTABLE)
        }

        // Ignores request if name is too long.
        if (NAME_LENGTH_MAX < body.name.length) {
            return ResponseEntity(HttpStatus.NOT_ACCEPTABLE)
        }

        dataService.saveScoreAndFlush(request.remoteAddr, body)

        // Evicts the lowest score(s) that match the IP & Name combination.
        val scoresMatchingIpAndName = dataService.scoreRepository.findScoresWithGivenIpAndNameNative(request.remoteAddr, body.name)
        dataService.evictLowestScoresFromList(scoresMatchingIpAndName, scoresMatchingIpAndName.size - 1)

        // Evicts the lowest score(s) from the IP.
        val scoresMatchingIp = dataService.scoreRepository.findScoresWithGivenIpNative(request.remoteAddr)
        if (MAX_SCORES_PER_IP < scoresMatchingIp.size) {
            dataService.evictLowestScoresFromList(scoresMatchingIp, scoresMatchingIp.size - MAX_SCORES_PER_IP)
        }

        // Evict cached leaders if this score is a new leader, so that on the next leaderboard request it is submitted.
        if (cacheService.getLowestLeaderScoreInt() < body.score) {
            cacheService.evictLeaders()
        }

        return ResponseEntity(HttpStatus.ACCEPTED)
    }

    data class LeaderboardResponse(
        val score: Int,
        val name: String,
    )

    @RequestMapping("/leaderboard")
    @ResponseBody
    fun getLeaderboard(): ResponseEntity<List<LeaderboardResponse>> {
        if (!getLeaderboardBucket.tryConsume(1)) {
            return ResponseEntity(HttpStatus.TOO_MANY_REQUESTS)
        }

        val body = cacheService.getLeaders().map{ LeaderboardResponse(it.score, it.name_fk.name) }
        return ResponseEntity(body, HttpStatus.ACCEPTED)
    }

    data class PlayerScoreResponse(
        val score: Int,
    )

    @RequestMapping("/score")
    @ResponseBody
    fun getPlayerScore(request: HttpServletRequest): ResponseEntity<List<PlayerScoreResponse>> {
        if (!getPlayerScoreBucket.tryConsume(1)) {
            return ResponseEntity(HttpStatus.TOO_MANY_REQUESTS)
        }

        val body = dataService.scoreRepository.findScoresWithGivenIpNative(request.remoteAddr).map{ PlayerScoreResponse(it.score) }
        return ResponseEntity(body, HttpStatus.ACCEPTED)
    }
}
