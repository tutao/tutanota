/* generated file, don't edit. */


public struct StructuredContact : Codable {
	let id: String?
	let firstName: String
	let lastName: String
	let nickname: String
	let company: String
	let birthday: String?
	let mailAddresses: [StructuredMailAddress]
	let phoneNumbers: [StructuredPhoneNumber]
	let addresses: [StructuredAddress]
	let rawId: String?
	let customDate: [StructuredCustomDate]
	let department: String?
	let messengerHandles: [StructuredMessengerHandle]
	let middleName: String?
	let nameSuffix: String?
	let phoneticFirst: String?
	let phoneticLast: String?
	let phoneticMiddle: String?
	let relationships: [StructuredRelationship]
	let websites: [StructuredWebsite]
	let notes: String
	let title: String
	let role: String
}
