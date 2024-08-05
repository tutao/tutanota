/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

@Serializable
enum class AppLockMethod(val value: String) {
	@SerialName("0")
	NONE("0"),
	
	@SerialName("1")
	SYSTEM_PASS_OR_BIOMETRICS("1"),
	
	@SerialName("2")
	BIOMETRICS("2");
	
	companion object {
		 fun fromValue(
			value: String,
		): AppLockMethod?
			= when (value) {
			"0" -> NONE
			"1" -> SYSTEM_PASS_OR_BIOMETRICS
			"2" -> BIOMETRICS
			else -> null
		}
	}
}
