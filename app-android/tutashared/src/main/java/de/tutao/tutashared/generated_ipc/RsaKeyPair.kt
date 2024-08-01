/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


@Serializable
data class RsaKeyPair(
	val publicKey: RsaPublicKey,
	val privateKey: RsaPrivateKey,
)
