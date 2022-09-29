package khivy.wordtrisserver

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Repository
import org.springframework.web.bind.annotation.*
import org.springframework.web.bind.annotation.RestController
import java.time.OffsetDateTime

@Repository
interface ScoreRepository : CrudRepository<Score, Long> {
    @Query(
        value = """
        SELECT * FROM Score as S
        WHERE name_id IN
            (SELECT name_id
             FROM Name
             WHERE ip_fk = :ip);
    """, nativeQuery = true
    )
    fun findScoresWithGivenIpNative(@Param("ip") ip: String): List<Score>
}

@Repository
interface NameRepository : CrudRepository<Name, Long> {
}

@Repository
interface IpRepository : CrudRepository<Ip, Long> {
}

class PlayerSubmissionData(
    var score: Byte,
    var name: String,
    var ip: String,
    var checksum: String
)

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

        saveScore(data)

        // Evicts the lowest score(s).
        val scoresMatchingIp = scoreRepository.findScoresWithGivenIpNative(data.ip)
        if (scoresMatchingIp.size < MAX_SCORES_PER_IP) {
            saveScore(data)
            return ResponseEntity(HttpStatus.ACCEPTED);
        }
        val scoresMatchingIpSorted = scoresMatchingIp.sortedBy { score -> score.score }
        val allScoresToRemove = scoresMatchingIpSorted
            .take(scoresMatchingIp.size - MAX_SCORES_PER_IP)
            .map { score -> score.name_id }
        nameRepository.deleteAllById(allScoresToRemove) // TODO: Assert that it cascades.

        return ResponseEntity(HttpStatus.ACCEPTED);
    }

    fun saveScore(data: PlayerSubmissionData) {
        val ip = Ip(data.ip)
        ipRepository.save(ip)
        val name = Name(data.name, ip)
        nameRepository.save(name)
        val score = Score(data.score, name, OffsetDateTime.now())
        scoreRepository.save(score)
    }

    @RequestMapping("/clear")
    fun removeAll() {
        ipRepository.deleteAll()
        nameRepository.deleteAll()
        scoreRepository.deleteAll()
    }
}
