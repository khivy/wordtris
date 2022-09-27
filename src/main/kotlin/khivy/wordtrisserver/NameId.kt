package khivy.wordtrisserver

import org.hibernate.Hibernate
import java.io.Serializable
import java.util.*
import javax.persistence.Column
import javax.persistence.Embeddable
import javax.persistence.Entity

@Embeddable
open class NameId : Serializable {
    @Column(name = "name", nullable = false, length = 25)
    open var name: String? = null

    @Column(name = "ip", columnDefinition = "cidr not null")
    open var ip: Any? = null

    override fun hashCode(): Int = Objects.hash(name, ip)
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other == null || Hibernate.getClass(this) != Hibernate.getClass(other)) return false

        other as NameId

        return name == other.name &&
                ip == other.ip
    }

    companion object {
        private const val serialVersionUID = 3666717413296113154L
    }
}