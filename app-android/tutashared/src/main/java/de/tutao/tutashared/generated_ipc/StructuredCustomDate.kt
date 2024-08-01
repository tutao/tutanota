/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


@Serializable
data class StructuredCustomDate(
	val dateIso: String,
	val type: ContactCustomDateType,
	val customTypeName: String,
)
