/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


@Serializable
data class MobilePaymentResult(
	val result: MobilePaymentResultType,
	val transactionID: String?,
	val transactionHash: String?,
)
