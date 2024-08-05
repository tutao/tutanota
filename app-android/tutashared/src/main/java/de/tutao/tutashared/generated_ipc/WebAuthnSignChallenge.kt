/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


@Serializable
data class WebAuthnSignChallenge(
	val challenge: DataWrapper,
	val domain: String,
	val keys: List<WebauthnKeyDescriptor>,
)
