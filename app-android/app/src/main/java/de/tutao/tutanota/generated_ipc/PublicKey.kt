/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


@Serializable
data class PublicKey(
	val version: Int,
	val keyLength: Int,
	val modulus: String,
	val publicExponent: Int,
)
