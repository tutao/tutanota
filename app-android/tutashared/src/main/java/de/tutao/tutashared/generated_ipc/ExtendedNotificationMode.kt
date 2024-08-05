/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

@Serializable
enum class ExtendedNotificationMode(val value: String) {
	@SerialName("0")
	NO_SENDER_OR_SUBJECT("0"),
	
	@SerialName("1")
	ONLY_SENDER("1"),
	
	@SerialName("2")
	SENDER_AND_SUBJECT("2");
	
	companion object {
		 fun fromValue(
			value: String,
		): ExtendedNotificationMode?
			= when (value) {
			"0" -> NO_SENDER_OR_SUBJECT
			"1" -> ONLY_SENDER
			"2" -> SENDER_AND_SUBJECT
			else -> null
		}
	}
}
