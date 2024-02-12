package de.tutao.tutanota.contacts

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** Mirror of ContactAddressType from TutanotaConstants */
@Serializable
enum class ContactAddressType {
  @SerialName("0")
  PRIVATE,

  @SerialName("1")
  WORK,

  @SerialName("2")
  OTHER,

  @SerialName("3")
  CUSTOM,
}

/** Mirror of ContactPhoneNumberType from TutanotaConstants */
@Serializable
enum class ContactPhoneNumberType {
  @SerialName("0")
  PRIVATE,

  @SerialName("1")
  WORK,

  @SerialName("2")
  MOBILE,

  @SerialName("3")
  FAX,

  @SerialName("4")
  OTHER,

  @SerialName("5")
  CUSTOM,
}