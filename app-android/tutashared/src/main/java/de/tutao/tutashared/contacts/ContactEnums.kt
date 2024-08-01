package de.tutao.tutashared.contacts

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

/** Mirror of ContactCustomDateType from TutanotaConstants */
@Serializable
enum class ContactCustomDateType {
  @SerialName("0")
  ANNIVERSARY,

  @SerialName("1")
  OTHER,

  @SerialName("2")
  CUSTOM,
}

/** Mirror of ContactWebsiteType from TutanotaConstants */
@Serializable
enum class ContactWebsiteType {
  @SerialName("0")
  PRIVATE,

  @SerialName("1")
  WORK,

  @SerialName("2")
  OTHER,

  @SerialName("3")
  CUSTOM,
}

/** Mirror of ContactMessengerHandleType from TutanotaConstants */
@Serializable
enum class ContactMessengerHandleType {
  @SerialName("0")
  SIGNAL,

  @SerialName("1")
  WHATSAPP,

  @SerialName("2")
  TELEGRAM,

  @SerialName("3")
  DISCORD,

  @SerialName("4")
  OTHER,

  @SerialName("5")
  CUSTOM
}

/** Mirror of ContactRelationshipType from TutanotaConstants */
@Serializable
enum class ContactRelationshipType {
  @SerialName("0")
  PARENT,

  @SerialName("1")
  BROTHER,

  @SerialName("2")
  SISTER,

  @SerialName("3")
  CHILD,

  @SerialName("4")
  FRIEND,

  @SerialName("5")
  RELATIVE,

  @SerialName("6")
  SPOUSE,

  @SerialName("7")
  PARTNER,

  @SerialName("8")
  ASSISTANT,

  @SerialName("9")
  MANAGER,

  @SerialName("10")
  OTHER,

  @SerialName("11")
  CUSTOM,
}