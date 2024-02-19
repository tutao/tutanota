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

extension StructuredPhoneNumber: Equatable {
	public static func == (lhs: Self, rhs: Self) -> Bool { lhs.number == rhs.number && lhs.type == rhs.type && lhs.customTypeName == rhs.customTypeName }
}

extension StructuredContact: Equatable {
	public static func == (lhs: Self, rhs: Self) -> Bool {
		lhs.id == rhs.id && lhs.firstName == rhs.firstName && lhs.lastName == rhs.lastName && lhs.nickname == rhs.nickname && lhs.company == rhs.company
			&& lhs.birthday == rhs.birthday && lhs.mailAddresses == rhs.mailAddresses && lhs.phoneNumbers == rhs.phoneNumbers && lhs.addresses == rhs.addresses
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
	}
}
