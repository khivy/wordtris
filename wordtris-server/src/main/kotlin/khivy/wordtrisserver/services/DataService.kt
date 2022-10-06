package khivy.wordtrisserver.services.score

import org.springframework.beans.factory.annotation.Autowired
import java.time.OffsetDateTime
import khivy.wordtrisserver.datamodel.*
import khivy.wordtrisserver.repositories.ip.IpRepository
import khivy.wordtrisserver.repositories.name.NameRepository
import khivy.wordtrisserver.repositories.score.ScoreRepository
import org.springframework.stereotype.Service


@Service
class DataService {
    @Autowired
    lateinit var scoreRepository: ScoreRepository

    @Autowired
    lateinit var nameRepository: NameRepository

    @Autowired
    lateinit var ipRepository: IpRepository

    fun saveScoreAndFlush(data: PlayerSubmissionDataOuterClass.PlayerSubmissionData) {
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

