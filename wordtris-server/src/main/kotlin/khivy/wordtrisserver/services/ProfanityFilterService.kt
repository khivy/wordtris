package khivy.wordtrisserver.services

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Service
import org.springframework.util.FileCopyUtils
import java.io.IOException
import java.nio.charset.StandardCharsets
import kotlin.system.exitProcess


@Service
class ProfanityFilterService {

    lateinit var bannedWords: Set<String>

    @Autowired
    fun ProfanityFilterService() {
        var data = ""
        val cpr = ClassPathResource("banned_words.txt")
        try {
            val bdata = FileCopyUtils.copyToByteArray(cpr.inputStream)
            data = String(bdata, StandardCharsets.UTF_8)
        } catch (e: IOException) {
            println("Error: Could not read profanity file. Exiting.")
            exitProcess(1)
        }
        this.bannedWords = data.split('\n').toSet()
    }

    fun containsProfanity(word: String): Boolean {
        for (i in word.indices) {
            for (j in i + 1..word.length) {
                if (word.substring(i, j) in bannedWords) {
                    return true
                }
            }
        }
        return false
    }
}