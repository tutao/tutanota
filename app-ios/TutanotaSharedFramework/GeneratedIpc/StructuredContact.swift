/* generated file, don't edit. */


public struct StructuredContact : Codable {
	public init(
		id: String?,
		firstName: String,
		lastName: String,
		nickname: String,
		company: String,
		birthday: String?,
		mailAddresses: [StructuredMailAddress],
		phoneNumbers: [StructuredPhoneNumber],
		addresses: [StructuredAddress],
		rawId: String?,
		customDate: [StructuredCustomDate],
		department: String?,
		messengerHandles: [StructuredMessengerHandle],
		middleName: String?,
		nameSuffix: String?,
		phoneticFirst: String?,
		phoneticLast: String?,
		phoneticMiddle: String?,
		relationships: [StructuredRelationship],
		websites: [StructuredWebsite],
		notes: String,
		title: String,
		role: String
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
		self.rawId = rawId
		self.customDate = customDate
		self.department = department
		self.messengerHandles = messengerHandles
		self.middleName = middleName
		self.nameSuffix = nameSuffix
		self.phoneticFirst = phoneticFirst
		self.phoneticLast = phoneticLast
		self.phoneticMiddle = phoneticMiddle
		self.relationships = relationships
		self.websites = websites
		self.notes = notes
		self.title = title
		self.role = role
	}
	public let id: String?
	public let firstName: String
	public let lastName: String
	public let nickname: String
	public let company: String
	public let birthday: String?
	public let mailAddresses: [StructuredMailAddress]
	public let phoneNumbers: [StructuredPhoneNumber]
	public let addresses: [StructuredAddress]
	public let rawId: String?
	public let customDate: [StructuredCustomDate]
	public let department: String?
	public let messengerHandles: [StructuredMessengerHandle]
	public let middleName: String?
	public let nameSuffix: String?
	public let phoneticFirst: String?
	public let phoneticLast: String?
	public let phoneticMiddle: String?
	public let relationships: [StructuredRelationship]
	public let websites: [StructuredWebsite]
	public let notes: String
	public let title: String
	public let role: String
}
