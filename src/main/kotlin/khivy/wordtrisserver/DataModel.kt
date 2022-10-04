package khivy.wordtrisserver.datamodel

import org.hibernate.annotations.OnDelete
import org.hibernate.annotations.OnDeleteAction
import java.time.OffsetDateTime
import javax.persistence.*
import java.io.Serializable
import khivy.wordtrisserver.setup.*


@Entity
data class Ip(
    @Id
    @Column(nullable = false)
    val ip: String
) {
    @OneToMany(mappedBy = "ip_fk")
    private var names: MutableSet<Name> = mutableSetOf()
}

@Entity
data class Score (
    var score: Int,
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @MapsId
    @JoinColumn(name = "name_id")
    val name_fk: Name,
    @Column(name = "created_at")
    var created_at: OffsetDateTime
) {
    @Id
    @Column(name = "name_id")
    var name_id: Long = 0
}

@Entity
data class Name(
    @Column(name = "name", nullable = false, length = NAME_LENGTH_MAX)
    val name: String,
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "ip_fk", nullable = false)
    val ip_fk: Ip,
) {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id")
    var id: Long = 0

    @OneToOne(mappedBy = "name_fk", cascade = [CascadeType.ALL])
    @PrimaryKeyJoinColumn
    private var score: Score? = null
}


@Entity
data class LowestLeaderScore(
    @Id
    val score: Int,
) : Serializable {
}