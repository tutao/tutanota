package de.tutao.tutashared

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class CredentialType {
	@SerialName("internal")
	INTERNAL,

	@SerialName("external")
	EXTERNAL,
}