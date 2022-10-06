package khivy.wordtrisserver.web

import PlayerSubmissionDataOuterClass
import com.google.protobuf.ByteString
import io.github.bucket4j.Bandwidth
import io.github.bucket4j.Bucket
import io.github.bucket4j.Refill
import khivy.wordtrisserver.datamodel.Score
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


@RestController
class ScoreController {

    @Autowired
    lateinit var dataService: DataService

    @Autowired
    lateinit var cacheService: CacheService

    @Autowired
    lateinit var profanityFilterService: ProfanityFilterService

    lateinit var bucket: Bucket

    @Autowired
    fun ScoreController() {
        val limit: Bandwidth = Bandwidth.classic(25, Refill.greedy(25, Duration.ofMinutes(1)))
        this.bucket = Bucket.builder()
            .addLimit(limit)
            .build()
    }

    @RequestMapping("/save")
    fun save(): String {
        return "Done"
    }

    @RequestMapping("/findallips")
    fun findAllIps() = dataService.ipRepository.findAll()

    @RequestMapping("/findallnames")
    fun findAllNames() = dataService.nameRepository.findAll()

    @RequestMapping("/findallscores")
    fun findAllScores() = dataService.scoreRepository.findAll()

    @PutMapping(value = ["/submitscore"])
    @ResponseBody
    fun submitScore(@RequestBody data: PlayerSubmissionDataOuterClass.PlayerSubmissionData): ResponseEntity<HttpStatus> {
        if (!bucket.tryConsume(1)) {
            return ResponseEntity(HttpStatus.TOO_MANY_REQUESTS)
        }

        if (profanityFilterService.containsProfanity(data.name)) {
            return ResponseEntity(HttpStatus.PRECONDITION_FAILED)
        }

        // Verify checksum.
        val md = MessageDigest.getInstance("SHA-256")
        val wordsByteArray = data.words.toByteArray()
        if (wordsByteArray.size != data.score || !data.checksum.toByteArray()
                .contentEquals(md.digest(wordsByteArray))
        ) {
            println("Did not accept score. Given hash: ${md.digest(wordsByteArray)}")
            return ResponseEntity(HttpStatus.NOT_ACCEPTABLE)
        }

        // Ignores request if name is too long.
        if (NAME_LENGTH_MAX < data.name.length) {
            return ResponseEntity(HttpStatus.NOT_ACCEPTABLE)
        }

        dataService.saveScoreAndFlush(data)

        // Evicts the lowest score(s) that match the IP & Name combination.
        val scoresMatchingIpAndName = dataService.scoreRepository.findScoresWithGivenIpAndNameNative(data.ip, data.name)
        dataService.evictLowestScoresFromList(scoresMatchingIpAndName, scoresMatchingIpAndName.size - 1)

        // Evicts the lowest score(s) from the IP.
        val scoresMatchingIp = dataService.scoreRepository.findScoresWithGivenIpNative(data.ip)
        if (MAX_SCORES_PER_IP < scoresMatchingIp.size) {
            dataService.evictLowestScoresFromList(scoresMatchingIp, scoresMatchingIp.size - MAX_SCORES_PER_IP)
        }

        // Evict cached leaders if this score is a new leader, so that on the next leaderboard request it is submitted.
        if (cacheService.getLowestLeaderScoreInt() < data.score) {
            cacheService.evictLeaders()
        }

        return ResponseEntity(HttpStatus.ACCEPTED)
    }

    @GetMapping(value = ["/dummyaddscore"])
    fun test() {
        var test = PlayerSubmissionDataOuterClass.PlayerSubmissionData.newBuilder()
        test.setScore(40)
        test.setName("testnew")
        test.setIp("193")
        test.setWords(ByteString.copyFromUtf8("words"))
        test.setChecksum(ByteString.copyFromUtf8("[B@35a374d7"))
        var message = test.build()

        this.submitScore(message)
    }

    @RequestMapping("/getleaders")
    fun getLeaders(): ResponseEntity<List<Score>> {
        if (!bucket.tryConsume(1)) {
            return ResponseEntity(HttpStatus.TOO_MANY_REQUESTS)
        }
        return ResponseEntity(cacheService.getLeaders(), HttpStatus.ACCEPTED)
    }

    @RequestMapping("/evictleaders")
    fun evictLeaders() {
        cacheService.evictLeaders()
    }

    @RequestMapping("/clear")
    fun removeAll() {
        dataService.ipRepository.deleteAll()
        dataService.nameRepository.deleteAll()
        dataService.scoreRepository.deleteAll()
    }
}
