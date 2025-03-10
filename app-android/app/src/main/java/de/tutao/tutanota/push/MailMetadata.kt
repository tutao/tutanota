package de.tutao.tutanota.push

data class MailMetadata(
	val firstRecipient: SenderRecipient,
	val sender: SenderRecipient,
	val subject: String,
)

data class SenderRecipient(
	val address: String,
	val name: String,
	val contact: String?,
)

