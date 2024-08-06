/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


/**
 * Result of Webauthn registration with hardware key.
 */
@Serializable
data class WebAuthnRegistrationResult(
	val rpId: String,
	val rawId: DataWrapper,
	val attestationObject: DataWrapper,
)
