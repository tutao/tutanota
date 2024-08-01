/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


@Serializable
data class StructuredPhoneNumber(
	val number: String,
	val type: ContactPhoneNumberType,
	val customTypeName: String,
)
