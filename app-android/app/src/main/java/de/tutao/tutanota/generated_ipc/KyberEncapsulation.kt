/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import androidx.annotation.Keep
import kotlinx.serialization.Serializable


@Serializable
@Keep
data class KyberEncapsulation(
		val ciphertext: DataWrapper,
		val sharedSecret: DataWrapper,
)

