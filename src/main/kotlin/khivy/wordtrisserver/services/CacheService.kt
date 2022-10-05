package khivy.wordtrisserver.services

import khivy.wordtrisserver.datamodel.Score
import khivy.wordtrisserver.services.score.DataService
import khivy.wordtrisserver.setup.MAX_LEADERS_ON_BOARD
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.stereotype.Service

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