/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


@Serializable
data class StructuredContact(
	val id: String?,
	val firstName: String,
	val lastName: String,
	val nickname: String?,
	val company: String,
	val birthday: String?,
	val mailAddresses: List<StructuredMailAddress>,
	val phoneNumbers: List<StructuredPhoneNumber>,
	val addresses: List<StructuredAddress>,
	val rawId: String?,
)
