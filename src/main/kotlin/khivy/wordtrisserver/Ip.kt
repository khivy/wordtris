package khivy.wordtrisserver

import javax.persistence.Column
import javax.persistence.Entity
import javax.persistence.Id
import javax.persistence.Table

@Entity
@Table(name = "ips")
open class Ip {
    @Id
    @Column(name = "ip", columnDefinition = "cidr not null")
    open var id: Any? = null

    //TODO [JPA Buddy] generate columns from DB
}