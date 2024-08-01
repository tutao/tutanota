/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


@Serializable
data class StructuredContact(
	val id: String?,
	val firstName: String,
	val lastName: String,
	val nickname: String,
	val company: String,
	val birthday: String?,
	val mailAddresses: List<StructuredMailAddress>,
	val phoneNumbers: List<StructuredPhoneNumber>,
	val addresses: List<StructuredAddress>,
	val rawId: String?,
	val customDate: List<StructuredCustomDate>,
	val department: String?,
	val messengerHandles: List<StructuredMessengerHandle>,
	val middleName: String?,
	val nameSuffix: String?,
	val phoneticFirst: String?,
	val phoneticLast: String?,
	val phoneticMiddle: String?,
	val relationships: List<StructuredRelationship>,
	val websites: List<StructuredWebsite>,
	val notes: String,
	val title: String,
	val role: String,
)
