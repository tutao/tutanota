/* generated file, don't edit. */


public struct StructuredContact : Codable {
	let id: String
	let name: String
	let nickname: String?
	let company: String
	let birthday: String?
	let mailAddresses: [StructuredMailAddress]
	let phoneNumbers: [StructuredPhoneNumber]
	let addresses: [StructuredAddress]
}
