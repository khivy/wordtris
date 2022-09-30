package khivy.wordtrisserver

import PlayerSubmissionDataKt
import PlayerSubmissionDataOuterClass.PlayerSubmissionData
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Repository
import org.springframework.web.bind.annotation.*
import org.springframework.web.bind.annotation.RestController
import java.time.OffsetDateTime

@Repository
interface ScoreRepository : JpaRepository<Score, Long> {
    @Query(
        value = """
        SELECT * FROM Score
        WHERE name_id IN
            (SELECT id
             FROM Name
             WHERE ip_fk = :ip);
    """, nativeQuery = true
    )
    fun findScoresWithGivenIpNative(@Param("ip") ip: String): List<Score>

    @Query(
        value = """
        SELECT * FROM Score
        WHERE name_id IN
            (SELECT id
             FROM Name
             WHERE ip_fk = :ip
             AND name = :name);
    """, nativeQuery = true
    )
    fun findScoresWithGivenIpAndNameNative(@Param("ip") ip: String, @Param("name") name: String): List<Score>
}

@Repository
interface NameRepository : JpaRepository<Name, Long> {
}

@Repository
interface IpRepository : JpaRepository<Ip, Long> {
}

@RestController
class RestController {

    @Autowired
    lateinit var scoreRepository: ScoreRepository

    @Autowired
    lateinit var nameRepository: NameRepository

    @Autowired
    lateinit var ipRepository: IpRepository

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
        // Ignores request if name is too long.
        if (NAME_LENGTH_MAX < data.name.length) {
            return ResponseEntity(HttpStatus.NOT_ACCEPTABLE);
        }

        saveScoreAndFlush(data)

        // Evicts the lowest score(s) that match the IP & Name combination.
        val scoresMatchingIpAndName = scoreRepository.findScoresWithGivenIpAndNameNative(data.ip, data.name)
        evictLowestScoresFrom(scoresMatchingIpAndName, scoresMatchingIpAndName.size - 1)

        // Evicts the lowest score(s) from the IP.
        val scoresMatchingIp = scoreRepository.findScoresWithGivenIpNative(data.ip)
        if (scoresMatchingIp.size <= MAX_SCORES_PER_IP) {
            return ResponseEntity(HttpStatus.ACCEPTED);
        }
        evictLowestScoresFrom(scoresMatchingIp, scoresMatchingIp.size - MAX_SCORES_PER_IP)

        return ResponseEntity(HttpStatus.ACCEPTED);
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

    @RequestMapping("/clear")
    fun removeAll() {
        ipRepository.deleteAll()
        nameRepository.deleteAll()
        scoreRepository.deleteAll()
    }
}
