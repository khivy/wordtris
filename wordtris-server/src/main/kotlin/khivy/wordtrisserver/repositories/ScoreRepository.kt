package khivy.wordtrisserver.repositories.score

import org.springframework.stereotype.Repository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import khivy.wordtrisserver.datamodel.*


@Repository
interface ScoreRepository : JpaRepository<Score, Long> {
    @Query(
        value = """
            SELECT *
            FROM Score as s, Name as n
            WHERE s.name_id = n.id
            AND n.ip_fk = :ip
    """, nativeQuery = true
    )
    fun findScoresWithGivenIpNative(@Param("ip") ip: String): List<Score>

    @Query(
        value = """
            SELECT *
            FROM Score as s, Name as n
            WHERE s.name_id = n.id
            AND n.ip_fk = :ip
            AND n.name = :name
    """, nativeQuery = true
    )
    fun findScoresWithGivenIpAndNameNative(@Param("ip") ip: String, @Param("name") name: String): List<Score>

    @Query(
        value = """
            SELECT *
            FROM score
            ORDER BY score DESC
            LIMIT :amount
    """, nativeQuery = true
    )
    fun findLeadersNative(@Param("amount") amount: Int): List<Score>
}

