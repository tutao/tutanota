package de.tutao.tutanota.push

import de.tutao.tutasdk.IdTupleGenerated
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonNames

@Serializable
data class NotificationInfo(
	@SerialName("1366")
	val mailAddress: String,
	@SerialName("1368")
	val userId: String,
	@SerialName("2319")
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
