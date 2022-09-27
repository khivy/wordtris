package khivy.wordtrisserver

import org.hibernate.annotations.OnDelete
import org.hibernate.annotations.OnDeleteAction
import java.time.OffsetDateTime
import javax.persistence.*

@Entity
@Table(name = "scores")
open class Score {
    @EmbeddedId
    open var id: ScoreId? = null

    @MapsId
    @JoinColumns(
        JoinColumn(name = "name", referencedColumnName = "name", nullable = false),
        JoinColumn(name = "ip", referencedColumnName = "ip", nullable = false)
    )
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    open var names: Name? = null

    @Column(name = "created_at")
    open var createdAt: OffsetDateTime? = null
}