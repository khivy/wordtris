package khivy.wordtrisserver

import java.util.concurrent.atomic.AtomicLong;
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.boot.runApplication


@SpringBootApplication
class WordtrisServerApplication() {

    class Greeting(var id: Long, val content: String) {
    }

    @RestController
    class GreetingController {

        companion object {
            val template: String = "Hello, %s!";
        }

        var counter = AtomicLong();

        @GetMapping("/greeting")
        fun greeting(@RequestParam(value = "name", defaultValue = "World") name: String): Greeting {
            return Greeting(counter.incrementAndGet(), String.format(template, name));
        }
    }
}

fun main(args: Array<String>) {
    runApplication<WordtrisServerApplication>(*args)
}
