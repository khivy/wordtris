package khivy.wordtrisserver.services

import io.github.bucket4j.Bandwidth
import io.github.bucket4j.Bucket
import io.github.bucket4j.Refill
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.io.Resource
import org.springframework.core.io.ResourceLoader
import org.springframework.stereotype.Service
import java.time.Duration

@Service
class ProfanityFilterService {

    @Autowired
    private lateinit var resourceLoader: ResourceLoader

    lateinit var bannedWords: Set<String>

    @Autowired
    fun ProfanityFilterService() {
        val fileResource: Resource = resourceLoader.getResource("classpath:banned_words.txt")
        this.bannedWords = fileResource.file.readText().split('\n').toSet()
    }

    fun containsProfanity(word: String): Boolean {
        for (i in word.indices) {
            for (j in i+1..word.length) {
                if (word.substring(i, j) in bannedWords) {
                    return true
                }
            }
        }
        return false
    }
}