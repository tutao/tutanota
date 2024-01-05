/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import androidx.annotation.Keep
import kotlinx.serialization.*
import kotlinx.serialization.json.*


@Serializable
@Keep
data class KyberKeyPair(
	val publicKey: KyberPublicKey,
	val privateKey: KyberPrivateKey,
)
