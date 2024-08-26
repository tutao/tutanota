import Contacts
import Foundation

/// Defines a mutable contact and functionality for commiting the contact into a contact store
class NativeMutableContact {
	var contact: CNMutableContact
	let serverId: String
	let isNewContact: Bool
	let originalHashValue: Int?
	let localContainer: String

	var localIdentifier: String { get { contact.identifier } }

	init(existingContact: CNContact, serverId: String, container: String) {
		self.contact = existingContact.mutableCopy() as! CNMutableContact
		self.serverId = serverId
		self.isNewContact = false
		self.originalHashValue = existingContact.hash
		self.localContainer = container
	}

	init(newContactWithServerId serverId: String, container: String) {
		self.contact = CNMutableContact()
		self.serverId = serverId
		self.isNewContact = true
		self.originalHashValue = nil
		self.localContainer = container
	}

	func updateContactWithData(_ data: StructuredContact) {
		var customDates = [CNLabeledValue<NSDateComponents>]()
		for date in data.customDate {
			guard let parsed = date.toLabeledValue() else { continue }
			customDates.append(parsed)
		}

		self.contact.givenName = data.firstName
		self.contact.familyName = data.lastName
		self.contact.nickname = data.nickname
		self.contact.organizationName = data.company
		self.contact.emailAddresses = data.mailAddresses.map { address in address.toLabeledValue() }
		self.contact.phoneNumbers = data.phoneNumbers.map { number in number.toLabeledValue() }
		self.contact.postalAddresses = data.addresses.map { address in address.toLabeledValue() }
		self.contact.dates = customDates
		self.contact.departmentName = data.department ?? ""
		self.contact.instantMessageAddresses = data.messengerHandles.map { $0.toLabeledValue() }
		self.contact.middleName = data.middleName ?? ""
		self.contact.nameSuffix = data.nameSuffix ?? ""
		self.contact.phoneticGivenName = data.phoneticFirst ?? ""
		self.contact.phoneticFamilyName = data.phoneticLast ?? ""
		self.contact.phoneticMiddleName = data.phoneticMiddle ?? ""
		self.contact.contactRelations = data.relationships.map { $0.toLabeledValue() }
		self.contact.urlAddresses = data.websites.map { $0.toLabeledValue() }
		// self.contact.note = data.notes  // TODO: get the entitlement for this
		self.contact.namePrefix = data.title
		self.contact.jobTitle = data.role

		if let birthday = data.birthday { self.contact.birthday = DateComponents.fromIso(birthday) } else { self.contact.birthday = nil }
	}
}

private extension StructuredMailAddress {
	func toLabeledValue() -> CNLabeledValue<NSString> {
		let label =
			switch self.type {
			case ._private: CNLabelHome
			case .work: CNLabelWork
			case .custom: self.customTypeName
			default: CNLabelOther
			}
		return CNLabeledValue(label: label, value: self.address as NSString)
	}
}

private extension StructuredPhoneNumber {
	func toLabeledValue() -> CNLabeledValue<CNPhoneNumber> {
		let label =
			switch self.type {
			case ._private: CNLabelHome
			case .work: CNLabelWork
			case .mobile: CNLabelPhoneNumberMobile
			case .fax: CNLabelPhoneNumberOtherFax
			case .custom: self.customTypeName
			case .other: CNLabelOther
			}
		let number = CNPhoneNumber(stringValue: self.number)
		return CNLabeledValue(label: label, value: number)
	}
}

private extension StructuredRelationship {
	func toLabeledValue() -> CNLabeledValue<CNContactRelation> {
		let label =
			switch self.type {
			case .parent: CNLabelContactRelationParent
			case .brother: CNLabelContactRelationBrother
			case .sister: CNLabelContactRelationSister
			case .child: CNLabelContactRelationChild
			case .friend: CNLabelContactRelationFriend
			case .spouse: CNLabelContactRelationSpouse
			case .partner: CNLabelContactRelationPartner
			case .assistant: CNLabelContactRelationAssistant
			case .manager: CNLabelContactRelationManager
			case .other: CNLabelOther
			case .custom: self.customTypeName
			case .relative: CNLabelOther
			}

		return CNLabeledValue(label: label, value: CNContactRelation(name: person))
	}
}

private extension StructuredMessengerHandle {
	func toLabeledValue() -> CNLabeledValue<CNInstantMessageAddress> {
		let label =
			switch self.type {
			case .signal: StructuredMessengerHandleTypeName.signal.rawValue
			case .whatsapp: StructuredMessengerHandleTypeName.whatsapp.rawValue
			case .telegram: StructuredMessengerHandleTypeName.telegram.rawValue
			case .discord: StructuredMessengerHandleTypeName.discord.rawValue
			case .custom: self.customTypeName
			case .other: CNLabelOther
			}
		return CNLabeledValue(label: CNLabelOther, value: CNInstantMessageAddress(username: handle, service: label))
	}
}

private extension StructuredCustomDate {
	func toLabeledValue() -> CNLabeledValue<NSDateComponents>? {
		guard let date = NSDateComponents.fromIso(self.dateIso) else { return nil }
		let label =
			switch self.type {
			case .anniversary: CNLabelDateAnniversary
			case .other: CNLabelOther
			case .custom: self.customTypeName
			}
		return CNLabeledValue(label: label, value: date)
	}
}

private extension StructuredAddress {
	func toLabeledValue() -> CNLabeledValue<CNPostalAddress> {
		let label =
			switch self.type {
			case ._private: CNLabelHome
			case .work: CNLabelWork
			case .custom: self.customTypeName
			case .other: CNLabelOther
			}
		let address = CNMutablePostalAddress()
		// Contacts framework operates on structured addresses but that's not how we store them on the server
		// and that's not how it works in many parts of the world either.
		address.street = self.address
		return CNLabeledValue(label: label, value: address)
	}
}

private extension StructuredWebsite {
	func toLabeledValue() -> CNLabeledValue<NSString> {
		let label =
			switch self.type {
			case ._private: CNLabelHome
			case .work: CNLabelWork
			case .custom: self.customTypeName
			case .other: CNLabelOther
			}
		return CNLabeledValue(label: label, value: url as NSString)
	}
}
