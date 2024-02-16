package de.tutao.tutanota.contacts

import android.provider.ContactsContract
import de.tutao.tutanota.ipc.StructuredAddress
import de.tutao.tutanota.ipc.StructuredContact
import de.tutao.tutanota.ipc.StructuredMailAddress
import de.tutao.tutanota.ipc.StructuredPhoneNumber

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

/**
 * Representation of RawContact + ContractsContract.Data from Android.
 */
data class AndroidContact(
  val rawId: Long,
  val sourceId: String?,
  var givenName: String? = null,
  var lastName: String? = null,
  var company: String = "",
  var nickname: String? = null,
  var birthday: String? = null,
  val emailAddresses: MutableList<AndroidEmailAddress> = mutableListOf(),
  val phoneNumbers: MutableList<AndroidPhoneNumber> = mutableListOf(),
  val addresses: MutableList<AndroidAddress> = mutableListOf(),
  var isDeleted: Boolean = false,
  var isDirty: Boolean = false
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
			deleted = isDeleted
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