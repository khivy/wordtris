package khivy.wordtrisserver

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class WordtrisServerApplication

fun main(args: Array<String>) {
	runApplication<WordtrisServerApplication>(*args)
}
