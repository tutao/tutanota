import Contacts
import Foundation

extension CNContact {
	func toStructuredContact(serverId: String?) -> StructuredContact {
		StructuredContact(
			id: serverId,
			firstName: givenName,
			lastName: familyName,
			nickname: nickname,
			company: organizationName,
			birthday: birthday?.toIso(),
			mailAddresses: emailAddresses.map { $0.toStructuredMailAddress() },
			phoneNumbers: phoneNumbers.map { $0.toStructuredPhoneNumber() },
			addresses: postalAddresses.map { $0.toStructuredAddress() },
			rawId: identifier,
			customDate: dates.map { $0.toStructuredCustomDate() },
			department: departmentName,
			messengerHandles: instantMessageAddresses.map { $0.toStructuredMessengerHandle() },
			middleName: middleName,
			nameSuffix: nameSuffix,
			phoneticFirst: phoneticGivenName,
			phoneticLast: phoneticFamilyName,
			phoneticMiddle: phoneticMiddleName,
			relationships: contactRelations.map { $0.toStructuredRelationship() },
			websites: urlAddresses.map { $0.toStructuredWebsite() },
			notes: "",  // TODO: add when contact notes entitlement is obtained
			title: namePrefix,
			role: jobTitle
		)
	}
}

enum StructuredMessengerHandleTypeName: String {
	case signal = "Signal"
	case whatsapp = "WhatsApp"
	case telegram = "Telegram"
	case discord = "Discord"
}

private extension CNLabeledValue<CNInstantMessageAddress> {
	func toStructuredMessengerHandle() -> StructuredMessengerHandle {
		let (type, label): (ContactMessengerHandleType, String?) =
			switch self.value.service {
			case StructuredMessengerHandleTypeName.signal.rawValue: (.signal, nil)
			case StructuredMessengerHandleTypeName.whatsapp.rawValue: (.whatsapp, nil)
			case StructuredMessengerHandleTypeName.telegram.rawValue: (.telegram, nil)
			case StructuredMessengerHandleTypeName.discord.rawValue: (.discord, nil)
			default: (.custom, Self.localizedString(forLabel: self.value.service))
			}
		return StructuredMessengerHandle(handle: value.username, type: type, customTypeName: label ?? "")
	}
}

private extension CNLabeledValue<CNContactRelation> {
	func toStructuredRelationship() -> StructuredRelationship {
		let (type, label): (ContactRelationshipType, String?) =
			switch self.label {
			case CNLabelContactRelationParent: (.parent, nil)
			case CNLabelContactRelationBrother: (.brother, nil)
			case CNLabelContactRelationSister: (.sister, nil)
			case CNLabelContactRelationChild: (.child, nil)
			case CNLabelContactRelationFriend: (.friend, nil)
			case CNLabelContactRelationSpouse: (.spouse, nil)
			case CNLabelContactRelationPartner: (.partner, nil)
			case CNLabelContactRelationAssistant: (.assistant, nil)
			case CNLabelContactRelationManager: (.manager, nil)
			case CNLabelOther: (.other, nil)
			default: (.custom, localizeContactLabel(self))
			}
		return StructuredRelationship(person: value.name, type: type, customTypeName: label ?? "")
	}
}

private extension CNLabeledValue<NSDateComponents> {
	func toStructuredCustomDate() -> StructuredCustomDate {
		let (type, label): (ContactCustomDateType, String?) =
			switch self.label {
			case CNLabelDateAnniversary: (.anniversary, nil)
			case CNLabelOther: (.other, nil)
			default: (.custom, localizeContactLabel(self))
			}
		return StructuredCustomDate(dateIso: value.toIso(), type: type, customTypeName: label ?? "")
	}
}

private extension CNLabeledValue<CNPhoneNumber> {
	func toStructuredPhoneNumber() -> StructuredPhoneNumber {
		let (type, label): (ContactPhoneNumberType, String?) =
			switch self.label {
			case CNLabelHome: (._private, nil)
			case CNLabelWork: (.work, nil)
			case CNLabelPhoneNumberMobile: (.mobile, nil)
			case CNLabelPhoneNumberOtherFax: (.fax, nil)
			case CNLabelOther: (.other, nil)
			default: (.custom, localizeContactLabel(self))
			}
		return StructuredPhoneNumber(number: self.value.stringValue, type: type, customTypeName: label ?? "")
	}
}

private extension CNLabeledValue<NSString> {
	func toStructuredMailAddress() -> StructuredMailAddress {
		let (type, label): (ContactAddressType, String?) =
			switch self.label {
			case CNLabelHome: (._private, nil)
			case CNLabelWork: (.work, nil)
			case CNLabelOther: (.other, nil)
			default: (.custom, localizeContactLabel(self))
			}
		return StructuredMailAddress(address: self.value as String, type: type, customTypeName: label ?? "")
	}
	func toStructuredWebsite() -> StructuredWebsite {
		let (type, label): (ContactWebsiteType, String?) =
			switch self.label {
			case CNLabelHome: (._private, nil)
			case CNLabelWork: (.work, nil)
			case CNLabelOther: (.other, nil)
			default: (.custom, localizeContactLabel(self))
			}
		return StructuredWebsite(url: self.value as String, type: type, customTypeName: label ?? "")
	}
}

private extension CNLabeledValue<CNPostalAddress> {
	func toStructuredAddress() -> StructuredAddress {
		let (type, label): (ContactAddressType, String?) =
			switch self.label {
			case CNLabelHome: (._private, nil)
			case CNLabelWork: (.work, nil)
			case CNLabelOther: (.other, nil)
			default: (.custom, localizeContactLabel(self))
			}
		let address = CNPostalAddressFormatter().string(from: self.value)
		return StructuredAddress(address: address, type: type, customTypeName: label ?? "")
	}
}

extension DateComponents {
	func toIso() -> String? {
		if let year, let month, let day {
			String(format: "%04d-%02d-%02d", year, month, day)
		} else if let month, let day {
			String(format: "--%02d-%02d", month, day)
		} else {
			nil
		}
	}
	static func fromIso(_ iso: String) -> DateComponents? {
		guard let date = Date.fromIso(iso) else { return nil }
		return Calendar(identifier: Calendar.Identifier.gregorian).dateComponents([.year, .day, .month], from: date)
	}
}

extension Date {
	static func fromIso(_ iso: String) -> Date? {
		let formatter = ISO8601DateFormatter()
		formatter.formatOptions = [.withFullDate]

		return formatter.date(from: iso)
	}
}

extension NSDateComponents {
	func toIso() -> String { String(format: "%04d-%02d-%02d", year, month, day) }
	static func fromIso(_ iso: String) -> NSDateComponents? {
		guard let date = DateComponents.fromIso(iso) else { return nil }
		return date as NSDateComponents
	}
}

/// Calls CNLabeledValue.localizedString, but accepts null values (if so, it returns nil)
func localizeContactLabel<ValueType>(_ what: CNLabeledValue<ValueType>) -> String? {
	guard let label = what.label else { return nil }
	return type(of: what).localizedString(forLabel: label)
}

internal extension StructuredContact {
	/// Return true if this contact is a duplicate of another structured contact, or similar enough to be considered one.
	func isDuplicateOfStructuredContact(_ contact: StructuredContact) throws -> Bool {
		// If we have generated Ids for both, we need only check those
		if id != nil && id!.isEmpty && contact.id != nil && contact.id!.isEmpty { return id == contact.id }

		// If we have the same identifiers, then they're the same. But if not, it might still be a duplicate.
		if rawId != nil && rawId!.isEmpty && rawId == contact.rawId { return true }
		if firstName != contact.firstName || lastName != contact.lastName { return false }

		return self.stableHashWithoutId() == contact.stableHashWithoutId()
	}
}

private extension StableHashable {
	func stableHash() -> UInt32 {
		var hasher = MurmurHash3.FourBytesHash()
		self.hash(into: &hasher)
		return hasher.digest()
	}
}
