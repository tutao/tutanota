/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


@Serializable
data class StructuredWebsite(
	val url: String,
	val type: ContactWebsiteType,
	val customTypeName: String,
)
