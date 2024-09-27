package de.tutao.tutashared.contacts

import android.provider.ContactsContract
import de.tutao.tutashared.ipc.StructuredAddress
import de.tutao.tutashared.ipc.StructuredContact
import de.tutao.tutashared.ipc.StructuredCustomDate
import de.tutao.tutashared.ipc.StructuredMailAddress
import de.tutao.tutashared.ipc.StructuredMessengerHandle
import de.tutao.tutashared.ipc.StructuredPhoneNumber
import de.tutao.tutashared.ipc.StructuredRelationship
import de.tutao.tutashared.ipc.StructuredWebsite

data class AndroidEmailAddress(
	val address: String,
	val type: Int,
	val customTypeName: String
)

data class AndroidAddress(
	val address: String,
	val type: Int,
	val customTypeName: String
)

data class AndroidPhoneNumber(
	val number: String,
	val type: Int,
	val customTypeName: String
)

data class AndroidWebsite(
	val url: String,
	val type: Int,
	val customTypeName: String
)

data class AndroidRelationship(
	val person: String,
	val type: Int,
	val customTypeName: String
)

data class AndroidCustomDate(
	val dateIso: String,
	val type: Int,
	val customTypeName: String
)

/**
 * Representation of RawContact + ContractsContract.Data from Android.
 */
data class AndroidContact(
	val rawId: Long,
	val sourceId: String?,
	var givenName: String? = null,
	var lastName: String? = null,
	var company: String = "",
	var nickname: String = "",
	var birthday: String? = null,
	val emailAddresses: MutableList<AndroidEmailAddress> = mutableListOf(),
	val phoneNumbers: MutableList<AndroidPhoneNumber> = mutableListOf(),
	val addresses: MutableList<AndroidAddress> = mutableListOf(),
	var isDeleted: Boolean = false,
	var isDirty: Boolean = false,
	var department: String? = null,
	var middleName: String? = null,
	var nameSuffix: String? = null,
	var phoneticFirst: String? = null,
	var phoneticMiddle: String? = null,
	var phoneticLast: String? = null,
	val customDate: MutableList<AndroidCustomDate> = mutableListOf(),
	val websites: MutableList<AndroidWebsite> = mutableListOf(),
	val relationships: MutableList<AndroidRelationship> = mutableListOf(),
	val messengerHandles: List<StructuredMessengerHandle> = listOf(),
	var notes: String = "",
	var title: String = "",
	var role: String = ""
) {
	fun toStructured(): StructuredContact {
		return StructuredContact(
			id = sourceId,
			firstName = givenName ?: "",
			lastName = lastName ?: "",
			nickname = nickname,
			company = company,
			birthday = birthday,
			mailAddresses = emailAddresses.map { it.toStructured() },
			phoneNumbers = phoneNumbers.map { it.toStructured() },
			addresses = addresses.map { it.toStructured() },
			rawId = rawId.toString(),
			department = department,
			middleName = middleName,
			nameSuffix = nameSuffix,
			phoneticFirst = phoneticFirst,
			phoneticMiddle = phoneticMiddle,
			phoneticLast = phoneticLast,
			customDate = customDate.map { it.toStructured() },
			messengerHandles = messengerHandles, // Will be deprecated on Android 15, not worth to implement now
			websites = websites.map { it.toStructured() },
			relationships = relationships.map { it.toStructured() },
			notes = notes,
			title = title,
			role = role
		)
	}
}

fun ContactAddressType.toAndroidType(): Int = when (this) {
	ContactAddressType.PRIVATE -> ContactsContract.CommonDataKinds.Email.TYPE_HOME
	ContactAddressType.WORK -> ContactsContract.CommonDataKinds.Email.TYPE_WORK
	ContactAddressType.OTHER -> ContactsContract.CommonDataKinds.Email.TYPE_OTHER
	ContactAddressType.CUSTOM -> ContactsContract.CommonDataKinds.Email.TYPE_CUSTOM
}

fun ContactPhoneNumberType.toAndroidType(): Int = when (this) {
	ContactPhoneNumberType.PRIVATE -> ContactsContract.CommonDataKinds.Phone.TYPE_HOME
	ContactPhoneNumberType.WORK -> ContactsContract.CommonDataKinds.Phone.TYPE_WORK
	ContactPhoneNumberType.MOBILE -> ContactsContract.CommonDataKinds.Phone.TYPE_MOBILE
	ContactPhoneNumberType.FAX -> ContactsContract.CommonDataKinds.Phone.TYPE_OTHER_FAX
	ContactPhoneNumberType.OTHER -> ContactsContract.CommonDataKinds.Phone.TYPE_OTHER
	ContactPhoneNumberType.CUSTOM -> ContactsContract.CommonDataKinds.Phone.TYPE_CUSTOM
}

fun AndroidEmailAddress.toStructured() = StructuredMailAddress(
	address = address,
	type = addressTypeFromAndroid(type),
	customTypeName = customTypeName
)

fun AndroidPhoneNumber.toStructured() = StructuredPhoneNumber(
	number = number,
	type = phoneNumberTypeFromAndroid(type),
	customTypeName = customTypeName
)

fun ContactRelationshipType.toAndroidType(): Int = when (this) {
	ContactRelationshipType.PARENT -> ContactsContract.CommonDataKinds.Relation.TYPE_PARENT
	ContactRelationshipType.BROTHER -> ContactsContract.CommonDataKinds.Relation.TYPE_BROTHER
	ContactRelationshipType.SISTER -> ContactsContract.CommonDataKinds.Relation.TYPE_SISTER
	ContactRelationshipType.CHILD -> ContactsContract.CommonDataKinds.Relation.TYPE_CHILD
	ContactRelationshipType.FRIEND -> ContactsContract.CommonDataKinds.Relation.TYPE_FRIEND
	ContactRelationshipType.RELATIVE -> ContactsContract.CommonDataKinds.Relation.TYPE_RELATIVE
	ContactRelationshipType.SPOUSE -> ContactsContract.CommonDataKinds.Relation.TYPE_SPOUSE
	ContactRelationshipType.PARTNER -> ContactsContract.CommonDataKinds.Relation.TYPE_PARTNER
	ContactRelationshipType.ASSISTANT -> ContactsContract.CommonDataKinds.Relation.TYPE_ASSISTANT
	ContactRelationshipType.MANAGER -> ContactsContract.CommonDataKinds.Relation.TYPE_MANAGER
	ContactRelationshipType.CUSTOM -> ContactsContract.CommonDataKinds.Relation.TYPE_CUSTOM
	else -> ContactsContract.CommonDataKinds.Relation.TYPE_CUSTOM
}

fun ContactWebsiteType.toAndroidType(): Int = when (this) {
	ContactWebsiteType.PRIVATE -> ContactsContract.CommonDataKinds.Website.TYPE_HOME
	ContactWebsiteType.WORK -> ContactsContract.CommonDataKinds.Website.TYPE_WORK
	ContactWebsiteType.CUSTOM -> ContactsContract.CommonDataKinds.Website.TYPE_CUSTOM
	else -> ContactsContract.CommonDataKinds.Website.TYPE_OTHER
}

fun ContactCustomDateType.toAndroidType(): Int = when (this) {
	ContactCustomDateType.ANNIVERSARY -> ContactsContract.CommonDataKinds.Event.TYPE_ANNIVERSARY
	ContactCustomDateType.CUSTOM -> ContactsContract.CommonDataKinds.Event.TYPE_CUSTOM
	else -> ContactsContract.CommonDataKinds.Event.TYPE_OTHER
}

fun AndroidCustomDate.toStructured() = StructuredCustomDate(
	dateIso = dateIso,
	type = dateTypeFromAndroid(type),
	customTypeName = customTypeName
)

fun AndroidWebsite.toStructured() = StructuredWebsite(
	url = url,
	type = websiteTypeFromAndroid(type),
	customTypeName = customTypeName
)

fun AndroidRelationship.toStructured() = StructuredRelationship(
	person = person,
	type = relationshipTypeFromAndroid(type),
	customTypeName = customTypeName
)

fun relationshipTypeFromAndroid(androidType: Int): ContactRelationshipType = when (androidType) {
	ContactsContract.CommonDataKinds.Relation.TYPE_PARENT -> ContactRelationshipType.PARENT
	ContactsContract.CommonDataKinds.Relation.TYPE_BROTHER -> ContactRelationshipType.BROTHER
	ContactsContract.CommonDataKinds.Relation.TYPE_SISTER -> ContactRelationshipType.SISTER
	ContactsContract.CommonDataKinds.Relation.TYPE_CHILD -> ContactRelationshipType.CHILD
	ContactsContract.CommonDataKinds.Relation.TYPE_FRIEND -> ContactRelationshipType.FRIEND
	ContactsContract.CommonDataKinds.Relation.TYPE_RELATIVE -> ContactRelationshipType.RELATIVE
	ContactsContract.CommonDataKinds.Relation.TYPE_SPOUSE -> ContactRelationshipType.SPOUSE
	ContactsContract.CommonDataKinds.Relation.TYPE_PARTNER -> ContactRelationshipType.PARTNER
	ContactsContract.CommonDataKinds.Relation.TYPE_ASSISTANT -> ContactRelationshipType.ASSISTANT
	ContactsContract.CommonDataKinds.Relation.TYPE_MANAGER -> ContactRelationshipType.MANAGER
	ContactsContract.CommonDataKinds.Relation.TYPE_CUSTOM -> ContactRelationshipType.CUSTOM
	else -> ContactRelationshipType.OTHER
}

fun websiteTypeFromAndroid(androidType: Int): ContactWebsiteType = when (androidType) {
	ContactsContract.CommonDataKinds.Website.TYPE_HOME -> ContactWebsiteType.PRIVATE
	ContactsContract.CommonDataKinds.Website.TYPE_WORK -> ContactWebsiteType.WORK
	ContactsContract.CommonDataKinds.Website.TYPE_CUSTOM -> ContactWebsiteType.CUSTOM
	else -> ContactWebsiteType.WORK
}

fun dateTypeFromAndroid(androidType: Int): ContactCustomDateType = when (androidType) {
	ContactsContract.CommonDataKinds.Event.TYPE_ANNIVERSARY -> ContactCustomDateType.ANNIVERSARY
	ContactsContract.CommonDataKinds.Event.TYPE_CUSTOM -> ContactCustomDateType.CUSTOM
	else -> ContactCustomDateType.OTHER
}

fun addressTypeFromAndroid(androidType: Int): ContactAddressType = when (androidType) {
	ContactsContract.CommonDataKinds.Email.TYPE_HOME -> ContactAddressType.PRIVATE
	ContactsContract.CommonDataKinds.Email.TYPE_WORK -> ContactAddressType.WORK
	ContactsContract.CommonDataKinds.Email.TYPE_CUSTOM -> ContactAddressType.CUSTOM
	ContactsContract.CommonDataKinds.Email.TYPE_OTHER -> ContactAddressType.OTHER
	else -> ContactAddressType.OTHER
}

fun phoneNumberTypeFromAndroid(androidType: Int): ContactPhoneNumberType = when (androidType) {
	ContactsContract.CommonDataKinds.Phone.TYPE_HOME -> ContactPhoneNumberType.PRIVATE
	ContactsContract.CommonDataKinds.Phone.TYPE_WORK -> ContactPhoneNumberType.WORK
	ContactsContract.CommonDataKinds.Phone.TYPE_MOBILE -> ContactPhoneNumberType.MOBILE
	ContactsContract.CommonDataKinds.Phone.TYPE_OTHER_FAX -> ContactPhoneNumberType.FAX
	ContactsContract.CommonDataKinds.Phone.TYPE_OTHER -> ContactPhoneNumberType.OTHER
	ContactsContract.CommonDataKinds.Phone.TYPE_CUSTOM -> ContactPhoneNumberType.CUSTOM
	else -> ContactPhoneNumberType.OTHER
}

fun AndroidAddress.toStructured() = StructuredAddress(
	address = address,
	type = addressTypeFromAndroid(type),
	customTypeName = customTypeName
)