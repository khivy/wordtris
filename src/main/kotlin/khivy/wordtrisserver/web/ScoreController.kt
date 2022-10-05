package khivy.wordtrisserver.web

import com.google.protobuf.ByteString
import khivy.wordtrisserver.datamodel.Score
import khivy.wordtrisserver.services.CacheService
import khivy.wordtrisserver.services.score.DataService
import khivy.wordtrisserver.setup.MAX_SCORES_PER_IP
import khivy.wordtrisserver.setup.NAME_LENGTH_MAX
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.security.MessageDigest

@RestController
class ScoreController {

    @Autowired
    lateinit var dataService: DataService

    @Autowired
    lateinit var cacheService: CacheService

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
        // Verify checksum.
        val md = MessageDigest.getInstance("SHA-256")
        val wordsByteArray = data.words.toByteArray()
        if (wordsByteArray.size != data.score || !data.checksum.toByteArray().contentEquals(md.digest(wordsByteArray))) {
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
    fun getLeaders(): List<Score> {
        return cacheService.getLeaders()
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