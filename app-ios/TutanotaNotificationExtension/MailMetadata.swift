import Foundation

typealias Base64 = String

/// return JSON from /tutanota/mail
struct MailMetadata: Codable {
	let firstRecipient: SenderRecipient
	let sender: SenderRecipient
	/// Is needed to only request new information from the server
	let subject: Base64
}

struct SenderRecipient: Codable {
	let address: String
	let name: Base64
	let contact: String?
}
