/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


@Serializable
data class RsaPublicKey(
	val version: Long,
	val keyLength: Long,
	val modulus: String,
	val publicExponent: Long,
)
