package khivy.wordtrisserver

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.concurrent.atomic.AtomicLong

@SpringBootApplication
class WordtrisServerApplication() {
}

fun main(args: Array<String>) {
    runApplication<WordtrisServerApplication>(*args)
}
