/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

@Serializable
enum class MobilePaymentResultType {
	@SerialName("0")
	SUCCESS,
	
	@SerialName("1")
	CANCELLED,
	
	@SerialName("2")
	PENDING;
}
