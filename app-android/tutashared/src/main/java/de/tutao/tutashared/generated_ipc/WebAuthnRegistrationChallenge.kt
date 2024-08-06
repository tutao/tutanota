/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


@Serializable
data class WebAuthnRegistrationChallenge(
	val challenge: DataWrapper,
	val userId: String,
	val name: String,
	val displayName: String,
	val domain: String,
)
