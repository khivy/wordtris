package khivy.wordtrisserver.repositories.ip

import org.springframework.stereotype.Repository
import org.springframework.data.jpa.repository.JpaRepository
import khivy.wordtrisserver.datamodel.*

@Repository
interface IpRepository : JpaRepository<Ip, Long> {
}
