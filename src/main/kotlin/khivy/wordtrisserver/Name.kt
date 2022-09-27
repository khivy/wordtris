package khivy.wordtrisserver

import org.hibernate.annotations.OnDelete
import org.hibernate.annotations.OnDeleteAction
import javax.persistence.*

@Entity
@Table(name = "names")
open class Name {
    @EmbeddedId
    open var id: NameId? = null

    @MapsId("ip")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "ip", nullable = false)
    open var ip: Ip? = null
}