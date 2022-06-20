/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


@Serializable
data class RsaKeyPair(
	val publicKey: RsaPublicKey,
	val privateKey: RsaPrivateKey,
)
