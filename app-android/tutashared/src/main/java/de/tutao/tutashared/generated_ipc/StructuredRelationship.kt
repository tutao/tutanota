/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


@Serializable
data class StructuredRelationship(
	val person: String,
	val type: ContactRelationshipType,
	val customTypeName: String,
)
