/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


@Serializable
data class RsaPublicKey(
	val version: Int,
	val keyLength: Int,
	val modulus: String,
	val publicExponent: Int,
)
