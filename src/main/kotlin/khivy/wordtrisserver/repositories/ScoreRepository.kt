package khivy.wordtrisserver.repositories.score

import org.springframework.stereotype.Repository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import khivy.wordtrisserver.datamodel.*
import org.springframework.web.bind.annotation.PutMapping


@Repository
interface ScoreRepository : JpaRepository<Score, Long> {
    @Query(
        value = """
        SELECT * FROM Score
        WHERE name_id IN
            (SELECT id
             FROM Name
             WHERE ip_fk = :ip);
    """, nativeQuery = true
    )
    fun findScoresWithGivenIpNative(@Param("ip") ip: String): List<Score>

    @Query(
        value = """
        SELECT * FROM Score
        WHERE name_id IN
            (SELECT id
             FROM Name
             WHERE ip_fk = :ip
             AND name = :name);
    """, nativeQuery = true
    )
    fun findScoresWithGivenIpAndNameNative(@Param("ip") ip: String, @Param("name") name: String): List<Score>

    @Query(
        value = """
        SELECT *
        FROM score
        ORDER BY score DESC
        LIMIT :amount;
    """, nativeQuery = true
    )
    fun findLeadersNative(@Param("amount") amount: Int): List<Score>
}

