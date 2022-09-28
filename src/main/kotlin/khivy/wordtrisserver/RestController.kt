package khivy.wordtrisserver

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository
import org.springframework.web.bind.annotation.RequestMapping
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
        var ipRaw = "197"
        var ip = Ip(ipRaw)
        ipRepository.save(ip)
        var nameRaw = "John"
        var name = Name(nameRaw, ip)
        var score = Score(97, name, OffsetDateTime.now())
        nameRepository.save(name)
        scoreRepository.save(score)

        // Test diff IPs, same others, insert correctly
        var ipRaw2 = "196"
        var ip2 = Ip(ipRaw2)
        ipRepository.save(ip2)
        var nameRaw2 = "John"
        var name2 = Name(nameRaw2, ip2)
        var score2 = Score(97, name2, OffsetDateTime.now())
        nameRepository.save(name2)
        scoreRepository.save(score2)
        return "Done"
    }

    @RequestMapping("/findallips")
    fun findAllIps() = ipRepository.findAll()

    @RequestMapping("/findallnames")
    fun findAllNames() = nameRepository.findAll()

    @RequestMapping("/findallscores")
    fun findAllScores() = scoreRepository.findAll()

    @RequestMapping("/clear")
    fun removeAll() {
        ipRepository.deleteAll()
        nameRepository.deleteAll()
    }
}

