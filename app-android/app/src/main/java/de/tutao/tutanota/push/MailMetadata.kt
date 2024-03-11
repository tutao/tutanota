package de.tutao.tutanota.push

import kotlinx.serialization.Serializable

@Serializable
data class MailMetadata(
	val firstRecipient: SenderRecipient,
	val sender: SenderRecipient,
	val subject: String,
)

@Serializable
data class SenderRecipient(
	val address: String,
	val name: String,
	val contact: String?,
)

