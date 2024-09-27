/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


@Serializable
data class KyberEncapsulation(
	val ciphertext: DataWrapper,
	val sharedSecret: DataWrapper,
)
