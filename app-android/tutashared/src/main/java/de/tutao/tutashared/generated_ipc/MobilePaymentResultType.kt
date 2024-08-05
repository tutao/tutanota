/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

@Serializable
enum class MobilePaymentResultType(val value: String) {
	@SerialName("0")
	SUCCESS("0"),
	
	@SerialName("1")
	CANCELLED("1"),
	
	@SerialName("2")
	PENDING("2");
	
	companion object {
		 fun fromValue(
			value: String,
		): MobilePaymentResultType?
			= when (value) {
			"0" -> SUCCESS
			"1" -> CANCELLED
			"2" -> PENDING
			else -> null
		}
	}
}
