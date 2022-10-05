package khivy.wordtrisserver.rest

import PlayerSubmissionDataOuterClass.PlayerSubmissionData
import com.google.protobuf.ByteString
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.bind.annotation.RestController
import java.security.MessageDigest
import java.time.OffsetDateTime
import khivy.wordtrisserver.datamodel.*
import khivy.wordtrisserver.setup.*
import khivy.wordtrisserver.repositories.ip.IpRepository
import khivy.wordtrisserver.repositories.name.NameRepository
import khivy.wordtrisserver.repositories.score.ScoreRepository
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.stereotype.Service


@Service
class DataService {
    @Autowired
    lateinit var scoreRepository: ScoreRepository

    @Autowired
    lateinit var nameRepository: NameRepository

    @Autowired
    lateinit var ipRepository: IpRepository

    fun saveScoreAndFlush(data: PlayerSubmissionData) {
        val ip = Ip(data.ip)
        ipRepository.saveAndFlush(ip)
        val name = Name(data.name, ip)
        nameRepository.saveAndFlush(name)
        val score = Score(data.score, name, OffsetDateTime.now())
        scoreRepository.saveAndFlush(score)
    }

    fun evictLowestScoresFromList(possibleScoresToEvict: List<Score>, numToEvict: Int) {
        if (numToEvict <= 0) return
        val sorted = possibleScoresToEvict.sortedBy { score -> score.score }
        val allScoresToRemove = sorted
            .take(numToEvict)
            .map { score -> score.name_id }
        nameRepository.deleteAllByIdInBatch(allScoresToRemove) // TODO: Assert that it cascades.
    }
}

@Service
class CacheService {

    @Autowired
    lateinit var dataService: DataService

    @Cacheable("leaders")
    fun getLeaders(): List<Score> {
        return dataService.scoreRepository.findLeadersNative(MAX_LEADERS_ON_BOARD)
    }

    @CacheEvict("leaders")
    fun evictLeaders() {}

    fun getLowestLeaderScoreInt(): Int {
        val leaders = getLeaders()
        return if (leaders.size < MAX_LEADERS_ON_BOARD) {
            0
        } else {
            getLeaders().reduce{ a, b -> if (a.score < b.score) a else b }.score
        }
    }
}

@RestController
class RestController {

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
    fun submitScore(@RequestBody data: PlayerSubmissionData): ResponseEntity<HttpStatus> {
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
        var test = PlayerSubmissionData.newBuilder()
        test.setScore(40)
        test.setName("testnew")
        test.setIp("193")
        test.setWords(ByteString.copyFromUtf8("words"))
        test.setChecksum(ByteString.copyFromUtf8("[B@35a374d7"))
        var message = test.build()

        this.submitScore(message)
    }

    @RequestMapping("/getleaders")
    fun getLeaders() {
        cacheService.getLeaders()
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
