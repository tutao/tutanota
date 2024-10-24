package de.tutao.tutanota.push

import de.tutao.tutasdk.IdTupleGenerated
import kotlinx.serialization.Serializable

@Serializable
data class NotificationInfo(
		val mailAddress: String,
		val userId: String,
		val mailId: IdTupleWrapper?,
)

@Serializable
data class IdTupleWrapper(
		val listId: String,
		val listElementId: String,
)

// The name is to avoid confusion between `tutasdk.IdTuple` and `tutanota.IdTuple`
fun IdTupleWrapper.toSdkIdTupleGenerated(): IdTupleGenerated {
	return IdTupleGenerated(
			this.listId,
			this.listElementId
	)
}
