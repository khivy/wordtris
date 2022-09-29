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
        if (NAME_LENGTH_MAX < data.name.length) {
            return ResponseEntity(HttpStatus.NOT_ACCEPTABLE);
        }

        var ip = Ip(data.ip)
        ipRepository.save(ip)
        var name = Name(data.name, ip)
        nameRepository.save(name)
        var score = Score(data.score, name, OffsetDateTime.now())
        scoreRepository.save(score)
        return ResponseEntity(HttpStatus.ACCEPTED);
    }

    @RequestMapping("/clear")
    fun removeAll() {
        ipRepository.deleteAll()
        nameRepository.deleteAll()
        scoreRepository.deleteAll()
    }
}
