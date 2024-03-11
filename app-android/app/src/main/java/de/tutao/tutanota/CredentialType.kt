package de.tutao.tutanota

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class CredentialType {
	@SerialName("internal")
	INTERNAL,

	@SerialName("external")
	EXTERNAL,
}