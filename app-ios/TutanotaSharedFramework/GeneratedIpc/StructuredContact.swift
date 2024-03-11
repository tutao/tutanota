/* generated file, don't edit. */


public struct StructuredContact : Codable {
	public init(
		id: String,
		firstName: String,
		lastName: String,
		nickname: String?,
		company: String,
		birthday: String?,
		mailAddresses: [StructuredMailAddress],
		phoneNumbers: [StructuredPhoneNumber],
		addresses: [StructuredAddress]
	) {
		self.id = id
		self.firstName = firstName
		self.lastName = lastName
		self.nickname = nickname
		self.company = company
		self.birthday = birthday
		self.mailAddresses = mailAddresses
		self.phoneNumbers = phoneNumbers
		self.addresses = addresses
	}
	public let id: String
	public let firstName: String
	public let lastName: String
	public let nickname: String?
	public let company: String
	public let birthday: String?
	public let mailAddresses: [StructuredMailAddress]
	public let phoneNumbers: [StructuredPhoneNumber]
	public let addresses: [StructuredAddress]
}
