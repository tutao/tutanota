/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


/**
 * Result of Webauthn authentication with hardware key.
 */
@Serializable
data class WebAuthnSignResult(
	val rawId: DataWrapper,
	val clientDataJSON: DataWrapper,
	val signature: DataWrapper,
	val authenticatorData: DataWrapper,
)
