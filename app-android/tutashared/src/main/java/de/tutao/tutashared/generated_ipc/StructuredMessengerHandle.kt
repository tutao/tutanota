/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


@Serializable
data class StructuredMessengerHandle(
	val handle: String,
	val type: ContactMessengerHandleType,
	val customTypeName: String,
)
