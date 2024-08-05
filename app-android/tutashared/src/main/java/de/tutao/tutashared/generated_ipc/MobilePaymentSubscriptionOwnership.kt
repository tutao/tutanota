/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

@Serializable
enum class MobilePaymentSubscriptionOwnership(val value: String) {
	@SerialName("0")
	OWNER("0"),
	
	@SerialName("1")
	NOT_OWNER("1"),
	
	@SerialName("2")
	NO_SUBSCRIPTION("2");
	
	companion object {
		 fun fromValue(
			value: String,
		): MobilePaymentSubscriptionOwnership?
			= when (value) {
			"0" -> OWNER
			"1" -> NOT_OWNER
			"2" -> NO_SUBSCRIPTION
			else -> null
		}
	}
}
