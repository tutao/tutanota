/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


@Serializable
data class IPCEd25519KeyPair(
	val publicKey: IPCEd25519PublicKey,
	val privateKey: IPCEd25519PrivateKey,
)
