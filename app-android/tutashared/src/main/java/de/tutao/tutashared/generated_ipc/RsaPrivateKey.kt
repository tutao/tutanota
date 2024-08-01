/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


@Serializable
data class RsaPrivateKey(
	val version: Int,
	val keyLength: Int,
	val modulus: String,
	val privateExponent: String,
	val primeP: String,
	val primeQ: String,
	val primeExponentP: String,
	val primeExponentQ: String,
	val crtCoefficient: String,
)
