package khivy.wordtrisserver.repositories.name

import org.springframework.stereotype.Repository
import org.springframework.data.jpa.repository.JpaRepository
import khivy.wordtrisserver.datamodel.*


@Repository
interface NameRepository : JpaRepository<Name, Long> {
}