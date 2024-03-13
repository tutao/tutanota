import Contacts

enum ContactAddressType: String, Codable {
	case _private = "0"
	case work = "1"
	case other = "2"
	case custom = "3"
}

enum ContactPhoneNumberType: String, Codable {
	case _private = "0"
	case work = "1"
	case mobile = "2"
	case fax = "3"
	case other = "4"
	case custom = "5"
}

enum ContactCustomDateType: String, Codable {
	case anniversary = "0"
	case other = "1"
	case custom = "2"
}

enum ContactMessengerHandleType: String, Codable {
	case signal = "0"
	case whatsapp = "1"
	case telegram = "2"
	case discord = "3"
	case other = "4"
	case custom = "5"
}

enum ContactRelationshipType: String, Codable {
	case parent = "0"
	case brother = "1"
	case sister = "2"
	case child = "3"
	case friend = "4"
	case relative = "5"
	case spouse = "6"
	case partner = "7"
	case assistant = "8"
	case manager = "9"
	case other = "10"
	case custom = "11"
}

enum ContactWebsiteType: String, Codable {
	case _private = "0"
	case work = "1"
	case other = "2"
	case custom = "3"
}

extension StructuredMailAddress: Equatable {
	public static func == (lhs: Self, rhs: Self) -> Bool { lhs.address == rhs.address && lhs.type == rhs.type && lhs.customTypeName == rhs.customTypeName }
}

extension StructuredMailAddress: Hashable {
	public func hash(into hasher: inout Hasher) {
		hasher.combine(address)
		hasher.combine(type)
		hasher.combine(customTypeName)
	}
}

extension StructuredAddress: Hashable {
	public func hash(into hasher: inout Hasher) {
		hasher.combine(address)
		hasher.combine(type)
		hasher.combine(customTypeName)
	}
}

extension StructuredAddress: Equatable {
	public static func == (lhs: Self, rhs: Self) -> Bool { lhs.address == rhs.address && lhs.type == rhs.type && lhs.customTypeName == rhs.customTypeName }
}

extension StructuredPhoneNumber: Hashable {
	public func hash(into hasher: inout Hasher) {
		hasher.combine(number)
		hasher.combine(type)
		hasher.combine(customTypeName)
	}
}

extension StructuredWebsite: Equatable {
	public static func == (lhs: Self, rhs: Self) -> Bool { lhs.type == rhs.type && lhs.customTypeName == rhs.customTypeName && lhs.url == rhs.url }
}

extension StructuredWebsite: Hashable {
	public func hash(into hasher: inout Hasher) {
		hasher.combine(url)
		hasher.combine(type)
		hasher.combine(customTypeName)
	}
}

extension StructuredCustomDate: Equatable {
	public static func == (lhs: Self, rhs: Self) -> Bool { lhs.type == rhs.type && lhs.customTypeName == rhs.customTypeName && lhs.dateIso == rhs.dateIso }
}

extension StructuredCustomDate: Hashable {
	public func hash(into hasher: inout Hasher) {
		hasher.combine(dateIso)
		hasher.combine(type)
		hasher.combine(customTypeName)
	}
}

extension StructuredMessengerHandle: Equatable {
	public static func == (lhs: Self, rhs: Self) -> Bool { lhs.type == rhs.type && lhs.customTypeName == rhs.customTypeName && lhs.handle == rhs.handle }
}

extension StructuredMessengerHandle: Hashable {
	public func hash(into hasher: inout Hasher) {
		hasher.combine(handle)
		hasher.combine(type)
		hasher.combine(customTypeName)
	}
}

extension StructuredRelationship: Equatable {
	public static func == (lhs: Self, rhs: Self) -> Bool { lhs.type == rhs.type && lhs.customTypeName == rhs.customTypeName && lhs.person == rhs.person }
}

extension StructuredPronouns: Equatable {
	public static func == (lhs: Self, rhs: Self) -> Bool { lhs.pronouns == rhs.pronouns && lhs.language == rhs.language }
}

extension StructuredRelationship: Hashable {
	public func hash(into hasher: inout Hasher) {
		hasher.combine(person)
		hasher.combine(type)
		hasher.combine(customTypeName)
	}
}

extension StructuredPhoneNumber: Equatable {
	public static func == (lhs: Self, rhs: Self) -> Bool { lhs.number == rhs.number && lhs.type == rhs.type && lhs.customTypeName == rhs.customTypeName }
}

extension StructuredContact: Equatable {
	public static func == (lhs: Self, rhs: Self) -> Bool {
		lhs.id == rhs.id && lhs.firstName == rhs.firstName && lhs.lastName == rhs.lastName && lhs.nickname == rhs.nickname && lhs.company == rhs.company
			&& lhs.birthday == rhs.birthday && lhs.mailAddresses == rhs.mailAddresses && lhs.phoneNumbers == rhs.phoneNumbers && lhs.addresses == rhs.addresses
			&& lhs.customDate == rhs.customDate && lhs.department == rhs.department && lhs.messengerHandles == rhs.messengerHandles
			&& lhs.middleName == rhs.middleName && lhs.nameSuffix == rhs.nameSuffix && lhs.phoneticFirst == rhs.phoneticFirst
			&& lhs.phoneticLast == rhs.phoneticLast && lhs.phoneticMiddle == rhs.phoneticMiddle && lhs.relationships == rhs.relationships
			&& lhs.websites == rhs.websites && lhs.notes == rhs.notes && lhs.title == rhs.title && lhs.role == rhs.role
	}
}

extension StructuredContact: Hashable {
	public func hash(into hasher: inout Hasher) {
		hasher.combine(id)
		hasher.combine(firstName)
		hasher.combine(lastName)
		hasher.combine(nickname)
		hasher.combine(company)
		hasher.combine(birthday)
		hasher.combine(mailAddresses)
		hasher.combine(phoneNumbers)
		hasher.combine(addresses)
		hasher.combine(customDate)
		hasher.combine(department)
		hasher.combine(messengerHandles)
		hasher.combine(middleName)
		hasher.combine(nameSuffix)
		hasher.combine(phoneticFirst)
		hasher.combine(phoneticLast)
		hasher.combine(phoneticMiddle)
		hasher.combine(relationships)
		hasher.combine(websites)
		hasher.combine(notes)
		hasher.combine(title)
		hasher.combine(role)
	}
}
