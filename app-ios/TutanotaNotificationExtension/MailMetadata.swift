import Foundation

typealias Base64 = String

/// Part of Mail entity as represented in JSON
struct MailMetadata: Codable {
	let firstRecipient: MailAddress
	let sender: MailAddress
	/// Is needed to only request new information from the server
	let subject: Base64
}

struct MailAddress: Codable {
	let address: String
	let name: Base64
	let contact: String?
}
