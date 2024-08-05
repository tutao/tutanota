/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

@Serializable
enum class PermissionType(val value: String) {
	@SerialName("0")
	CONTACTS("0"),
	
	@SerialName("1")
	IGNORE_BATTERY_OPTIMIZATION("1"),
	
	@SerialName("2")
	NOTIFICATION("2");
	
	companion object {
		 fun fromValue(
			value: String,
		): PermissionType?
			= when (value) {
			"0" -> CONTACTS
			"1" -> IGNORE_BATTERY_OPTIMIZATION
			"2" -> NOTIFICATION
			else -> null
		}
	}
}
