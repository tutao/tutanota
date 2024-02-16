/* generated file, don't edit. */


public struct StructuredContact : Codable {
	let id: String?
	let firstName: String
	let lastName: String
	let nickname: String?
	let company: String
	let birthday: String?
	let mailAddresses: [StructuredMailAddress]
	let phoneNumbers: [StructuredPhoneNumber]
	let addresses: [StructuredAddress]
	let rawId: String?
	let deleted: Bool
}
