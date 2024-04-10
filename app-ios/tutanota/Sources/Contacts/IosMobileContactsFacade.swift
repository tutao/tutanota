import Contacts
import DictionaryCoding

// Maps a Tuta ID to a native or structured contact
private typealias TutaToNativeContactIdentifiers = [String: String]
private typealias TutaToNativeContacts = [String: NativeMutableContact]
private typealias TutaToStructuredContacts = [String: StructuredContact]

private let CONTACTS_MAPPINGS = "ContactsMappings"
private let CONTACT_BOOK_ID = "APPLE_DEFAULT"

struct UserContactMapping: Codable {
	let username: String
	var systemGroupIdentifier: String
	var localContactIdentifierToServerId: [String: String]
	var localContactIdentifierToHash: [String: UInt32]
	/// Whether we use Swift's built-in Hasher that is seeded randomly or our own hashing that is stable between runs
	var stableHash: Bool?
}

private let ALL_SUPPORTED_CONTACT_KEYS: [CNKeyDescriptor] =
	[
		CNContactIdentifierKey, CNContactGivenNameKey, CNContactFamilyNameKey, CNContactNicknameKey, CNContactOrganizationNameKey, CNContactBirthdayKey,
		CNContactEmailAddressesKey, CNContactPhoneNumbersKey, CNContactPostalAddressesKey, CNContactDatesKey, CNContactDepartmentNameKey,
		CNContactInstantMessageAddressesKey, CNContactMiddleNameKey, CNContactNameSuffixKey, CNContactPhoneticGivenNameKey, CNContactPhoneticMiddleNameKey,
		CNContactPhoneticFamilyNameKey, CNContactRelationsKey, CNContactUrlAddressesKey, CNContactNamePrefixKey, CNContactJobTitleKey,
	] as [CNKeyDescriptor]

/// Handles synchronization between contacts in Tuta and contacts on the device.
class IosMobileContactsFacade: MobileContactsFacade {
	private let userDefaults: UserDefaults

	init(userDefault: UserDefaults) { self.userDefaults = userDefault }

	func findSuggestions(_ query: String) async throws -> [ContactSuggestion] {
		try await acquireContactsPermission()
		return try self.queryContactSuggestions(query: query, upTo: 10)
	}

	func saveContacts(_ username: String, _ contacts: [StructuredContact]) async throws {
		TUTSLog("MobileContactsFacade: save with \(contacts.count) contacts")
		try await acquireContactsPermission()
		var mapping = try self.getOrCreateMapping(username: username)
		let queryResult = try self.matchStoredContacts(against: contacts, forUser: &mapping)
		// Here is ok to have an equal count of deletedOnDevice and deletedOnServer since not all server contacts and not all local contacts are inside the contacts array
		TUTSLog(
			"Contact SAVE match result: createdOnDevice: \(queryResult.createdOnDevice.count) editedOnDevice: \(queryResult.editedOnDevice.count) deletedOnDevice: \(queryResult.deletedOnDevice.count) newServerContacts: \(queryResult.newServerContacts.count) deletedOnServer: \(queryResult.deletedOnServer.count) existingServerContacts: \(queryResult.existingServerContacts.count) nativeContactWithoutSourceId: \(queryResult.nativeContactWithoutSourceId.count)"
		)
		try self.insert(contacts: queryResult.newServerContacts, forUser: &mapping)
		try self.update(contacts: queryResult.existingServerContacts, forUser: &mapping)
		for unmappedDeviceContact in queryResult.nativeContactWithoutSourceId {
			mapping.localContactIdentifierToServerId[unmappedDeviceContact.contact.identifier] = unmappedDeviceContact.serverId
			mapping.localContactIdentifierToHash[unmappedDeviceContact.localIdentifier] = unmappedDeviceContact.contact
				.toStructuredContact(serverId: unmappedDeviceContact.serverId).stableHash()
		}

		// The hash will not match and that's expected as we already returned it as edited on device in sync,
		// but we need to update those contacts, too, if they are passed to us.
		try self.update(contacts: queryResult.editedOnDevice, forUser: &mapping)

		self.saveMapping(mapping, forUsername: mapping.username)
		TUTSLog("Contact SAVE finished")
	}

	func syncContacts(_ username: String, _ contacts: [StructuredContact]) async throws -> ContactSyncResult {
		TUTSLog("MobileContactsFacade: sync with \(contacts.count) contacts")
		try await acquireContactsPermission()
		var mapping = try self.getOrCreateMapping(username: username)
		let matchResult = try self.matchStoredContacts(against: contacts, forUser: &mapping)
		TUTSLog(
			"Contact SYNC result: createdOnDevice: \(matchResult.createdOnDevice.count) editedOnDevice: \(matchResult.editedOnDevice.count) deletedOnDevice: \(matchResult.deletedOnDevice.count) newServerContacts: \(matchResult.newServerContacts.count) deletedOnServer: \(matchResult.deletedOnServer.count) existingServerContacts: \(matchResult.existingServerContacts.count) nativeContactWithoutSourceId: \(matchResult.nativeContactWithoutSourceId.count)"
		)
		try self.insert(contacts: matchResult.newServerContacts, forUser: &mapping)
		if !matchResult.deletedOnServer.isEmpty { try self.delete(contactsWithServerIDs: matchResult.deletedOnServer, forUser: &mapping) }
		try self.update(contacts: matchResult.existingServerContacts, forUser: &mapping)

		// For sync it normally wouldn't happen that we have a contact without source/server id but for existing contacts without
		// hashes we want to write the hashes on the first run so we reuse this field.
		for unmappedDeviceContact in matchResult.nativeContactWithoutSourceId {
			mapping.localContactIdentifierToServerId[unmappedDeviceContact.contact.identifier] = unmappedDeviceContact.serverId
			mapping.localContactIdentifierToHash[unmappedDeviceContact.localIdentifier] = unmappedDeviceContact.contact
				.toStructuredContact(serverId: unmappedDeviceContact.serverId).stableHash()
		}

		self.saveMapping(mapping, forUsername: mapping.username)
		TUTSLog("Contact SYNC finished")

		return ContactSyncResult(
			createdOnDevice: matchResult.createdOnDevice,
			editedOnDevice: matchResult.editedOnDevice.map { (nativeContact, _) in nativeContact.contact.toStructuredContact(serverId: nativeContact.serverId)
			},
			deletedOnDevice: matchResult.deletedOnDevice
		)
	}

	func getContactBooks() async throws -> [ContactBook] {
		try await acquireContactsPermission()
		// we can't effectively query containers so we just pretend that we have one book
		return [ContactBook(id: CONTACT_BOOK_ID, name: "")]
	}

	func getContactsInContactBook(_ containerId: String, _ username: String) async throws -> [StructuredContact] {
		assert(containerId == CONTACT_BOOK_ID, "Invalid contact book: \(containerId)")
		try await acquireContactsPermission()

		let fetch = CNContactFetchRequest(keysToFetch: ALL_SUPPORTED_CONTACT_KEYS)
		fetch.sortOrder = CNContactSortOrder.givenName

		let store = CNContactStore()
		var addresses = [StructuredContact]()
		let mapping = self.getMapping(username: username)
		try store.enumerateContacts(with: fetch) { (contact, _) in
			if mapping?.localContactIdentifierToHash[contact.identifier] == nil {
				// we don't need (and probably don't have?) a server id in this case
				addresses.append(contact.toStructuredContact(serverId: nil))
			}
		}

		return addresses
	}
	func getStoredTutaContacts(_ username: String) throws -> [CNContact] {
		let store = CNContactStore()
		var mapping = try self.getOrCreateMapping(username: username)
		let tutaGroup = try getTutaContactGroup(forUser: &mapping)
		let fetch = CNContactFetchRequest(keysToFetch: ALL_SUPPORTED_CONTACT_KEYS)
		fetch.predicate = CNContact.predicateForContactsInGroup(withIdentifier: tutaGroup.identifier)
		var contacts = [CNContact]()
		try store.enumerateContacts(with: fetch) { (contact, _) in contacts.append(contact) }
		return contacts
	}

	func deleteContacts(_ username: String, _ contactId: String?) async throws {
		try await acquireContactsPermission()

		var mapping = try self.getOrCreateMapping(username: username)

		if let contactId {
			try self.delete(contactsWithServerIDs: [contactId], forUser: &mapping)
			self.saveMapping(mapping, forUsername: username)
		} else {
			let group = try self.getTutaContactGroup(forUser: &mapping)
			try self.deleteAllContacts(forGroup: group)

			let saveRequest = CNSaveRequest()
			saveRequest.delete(group.mutableCopy() as! CNMutableGroup)
			let store = CNContactStore()
			try store.execute(saveRequest)

			self.deleteMapping(forUsername: username)
		}
	}

	/// Query the local container, ignoring the user's choices for the default contacts location.
	/// This prevent other apps, as Gmail or even iCloud, from 'stealing' and moving our contacts to their lists.
	private lazy var localContainer: String = {
		let store = CNContactStore()
		let defaultContainer = store.defaultContainerIdentifier()

		do {
			let containers = try store.containers(matching: nil)

			// Apple allow just ONE local container, so we can query for the first and unique one
			let localContainer = containers.first(where: { $0.type == CNContainerType.local })

			return localContainer?.identifier ?? defaultContainer
		} catch {
			TUTSLog("Failed to get local container, using default")
			return defaultContainer
		}
	}()

	private func insert(contacts: [StructuredContact], forUser user: inout UserContactMapping) throws {
		let store = CNContactStore()
		let saveRequest = CNSaveRequest()
		let contactGroup = try getTutaContactGroup(forUser: &user)

		// We need store mapping from our contact id to native contact id but we get it only after actually saving the contacts,
		// so until we execute the save request we keep track of the mapping
		var insertedContacts = [(NativeMutableContact, StructuredContact)]()

		for newContact in contacts {
			if let contactId = newContact.id {
				let nativeContact = NativeMutableContact(newContactWithServerId: contactId, container: localContainer)
				nativeContact.updateContactWithData(newContact)
				saveRequest.add(nativeContact.contact, toContainerWithIdentifier: localContainer)
				saveRequest.addMember(nativeContact.contact, to: contactGroup)
				insertedContacts.append((nativeContact, newContact))
			}
		}

		do { try store.execute(saveRequest) } catch { throw ContactStoreError(message: "Could not insert contacts", underlyingError: error) }

		for (nativeContact, structuredContact) in insertedContacts {
			user.localContactIdentifierToServerId[nativeContact.contact.identifier] = structuredContact.id
			user.localContactIdentifierToHash[nativeContact.contact.identifier] = structuredContact.stableHash()
		}
	}

	private func update(contacts: [(NativeMutableContact, StructuredContact)], forUser user: inout UserContactMapping) throws {
		let store = CNContactStore()
		let saveRequest = CNSaveRequest()

		for (nativeMutableContact, serverContact) in contacts {
			nativeMutableContact.updateContactWithData(serverContact)
			saveRequest.update(nativeMutableContact.contact)
			user.localContactIdentifierToHash[nativeMutableContact.contact.identifier] = serverContact.stableHash()
		}

		do { try store.execute(saveRequest) } catch { throw ContactStoreError(message: "Could not update contacts", underlyingError: error) }
	}

	private func delete(contactsWithServerIDs serverIdsToDelete: [String], forUser user: inout UserContactMapping) throws {
		// we now need to create a request to remove all contacts from the user that match an id in idsToRemove
		// it is OK if we are missing some contacts, as they are likely already deleted
		let store = CNContactStore()
		let fetch = CNContactFetchRequest(keysToFetch: [CNContactIdentifierKey] as [CNKeyDescriptor])

		var serverIdToLocalIdentifier = [String: String]()
		// doing it manually in case we have duplicates (which isn't good but migth happen)
		for (localIdentifier, serverId) in user.localContactIdentifierToServerId { serverIdToLocalIdentifier[serverId] = localIdentifier }

		let localAndServerIds = serverIdsToDelete.map { (serverId: $0, localIdentifier: serverIdToLocalIdentifier[$0]) }

		let nativeIdentifiersToRemove = localAndServerIds.compactMap { $0.localIdentifier }
		fetch.predicate = CNContact.predicateForContacts(withIdentifiers: nativeIdentifiersToRemove)
		let save = CNSaveRequest()

		try store.enumerateContacts(with: fetch) { contact, _ in save.delete(contact.mutableCopy() as! CNMutableContact) }

		for (localIdentifier, _) in localAndServerIds {
			user.localContactIdentifierToServerId.removeValue(forKey: localIdentifier)
			user.localContactIdentifierToHash.removeValue(forKey: localIdentifier)
		}

		try store.execute(save)
	}

	private func deleteAllContacts(forGroup group: CNGroup) throws {

		// we now need to create a request to remove all contacts from the user that match an id in idsToRemove
		// it is OK if we are missing some contacts, as they are likely already deleted
		let store = CNContactStore()
		let fetch = CNContactFetchRequest(keysToFetch: [CNContactIdentifierKey] as [CNKeyDescriptor])

		fetch.predicate = CNContact.predicateForContactsInGroup(withIdentifier: group.identifier)
		let save = CNSaveRequest()

		try store.enumerateContacts(with: fetch) { contact, _ in save.delete(contact.mutableCopy() as! CNMutableContact) }

		try store.execute(save)
	}

	private func matchStoredContacts(against contacts: [StructuredContact], forUser user: inout UserContactMapping) throws -> MatchContactResult {
		// prepare the result
		var queryResult = MatchContactResult()

		let store = CNContactStore()
		let fetch = CNContactFetchRequest(keysToFetch: ALL_SUPPORTED_CONTACT_KEYS)
		let group = try self.getTutaContactGroup(forUser: &user)

		fetch.predicate = CNContact.predicateForContactsInGroup(withIdentifier: group.identifier)

		// Group contacts by id. As we iterate over contacts we will remove the matched one from this dictionary
		var contactsById = Dictionary(uniqueKeysWithValues: contacts.map { ($0.id, $0) })
		// Make a copy, we will remove matched contacts from it. All unmatched ones are assumed to be deleted by user
		var nativeContactIdentifierToHash = user.localContactIdentifierToHash

		// Enumerate all contacts in our group
		try store.enumerateContacts(with: fetch) { nativeContact, _ in
			if let serverContactId = user.localContactIdentifierToServerId[nativeContact.identifier] {
				if let serverContact = contactsById.removeValue(forKey: serverContactId) {
					let structuredNative = nativeContact.toStructuredContact(serverId: serverContactId)
					let nativeMutableContact = NativeMutableContact(existingContact: nativeContact, serverId: serverContactId, container: localContainer)
					let expectedHash = nativeContactIdentifierToHash.removeValue(forKey: nativeContact.identifier)
					// We check for nil so that existing contacts without hashes (from the first version without two-way sync)
					// won't get all updated on the server. We just want to write the mapping on the first run.
					if expectedHash == nil {
						queryResult.nativeContactWithoutSourceId.append(nativeMutableContact)
					} else if structuredNative.stableHash() != expectedHash {
						TUTSLog("MobileContactsFacade: hash mismatch for \(nativeContact.identifier) \(serverContactId)")
						queryResult.editedOnDevice.append((nativeMutableContact, serverContact))
					} else {
						queryResult.existingServerContacts.append((nativeMutableContact, serverContact))
					}
				} else {
					queryResult.deletedOnServer.append(serverContactId)
				}
			} else {
				let serverContactWithMatchingRawId = contacts.first { $0.rawId == nativeContact.identifier }
				if let serverId = serverContactWithMatchingRawId?.id {
					TUTSLog("MobileContactsFacade: Matched contact \(nativeContact.identifier) to server contact \(serverId) by raw id")
					contactsById.removeValue(forKey: serverId)
					queryResult.nativeContactWithoutSourceId.append(
						NativeMutableContact(existingContact: nativeContact, serverId: serverId, container: localContainer)
					)
				} else {
					queryResult.createdOnDevice.append(nativeContact.toStructuredContact(serverId: nil))
				}
			}
		}

		// These ones are deleted from device because we still have hashes for them.
		queryResult.deletedOnDevice = nativeContactIdentifierToHash.keys.compactMap { identifier in user.localContactIdentifierToServerId[identifier] }

		queryResult.newServerContacts = Array(contactsById.values)
		TUTSLog("MobileContactsFacade: New server contacts: \(queryResult.newServerContacts.count)")
		return queryResult
	}

	/// Gets the Tuta contact group, creating it if it does not exist.
	private func getTutaContactGroup(forUser mapping: inout UserContactMapping) throws -> CNGroup {
		let store = CNContactStore()

		let result = try store.groups(matching: CNGroup.predicateForGroups(withIdentifiers: [mapping.systemGroupIdentifier]))
		if !result.isEmpty {
			return result[0]
		} else {
			TUTSLog("can't get tuta contact group \(mapping.username) from native: likely deleted by user")

			let newGroup = try self.createCNGroup(username: mapping.username)

			// update mapping right away so that everyone down the road will be using an updated version
			mapping.systemGroupIdentifier = newGroup.identifier
			// if the group is not there none of the mapping values make sense anymore
			mapping.localContactIdentifierToServerId = [:]
			mapping.localContactIdentifierToHash = [:]

			// save the mapping right away so that if something later fails we won;t have a dangling group
			self.saveMapping(mapping, forUsername: mapping.username)
			return newGroup
		}
	}

	private func getOrCreateMapping(username: String) throws -> UserContactMapping {
		if let mapping = self.getMapping(username: username) {
			return mapping
		} else {
			TUTSLog("MobileContactsFacade: creating new mapping for \(username)")
			let newGroup = try self.createCNGroup(username: username)
			let mapping = UserContactMapping(
				username: username,
				systemGroupIdentifier: newGroup.identifier,
				localContactIdentifierToServerId: [:],
				localContactIdentifierToHash: [:],
				stableHash: true
			)

			self.saveMapping(mapping, forUsername: username)
			return mapping
		}
	}

	private func getMappingsDictionary() -> [String: [String: Any]] {
		self.userDefaults.dictionary(forKey: CONTACTS_MAPPINGS) as! [String: [String: Any]]? ?? [:]

	}

	private func getMapping(username: String) -> UserContactMapping? {
		if var dict = getMappingsDictionary()[username] {
			// migration from the version that didn't have hashes
			if dict["localContactIdentifierToHash"] == nil { dict["localContactIdentifierToHash"] = [String: UInt32]() }
			if dict["stableHash"] == nil {
				TUTSLog("Migrating old unstable hashes")
				// Map old values Int64 to a truncated UInt32 hash
				dict["localContactIdentifierToHash"] = (dict["localContactIdentifierToHash"] as! [String: Int]).mapValues { UInt32($0 & 0xFFFFFFFF) }
				dict["stablehash"] = true
			}
			return try! DictionaryDecoder().decode(UserContactMapping.self, from: dict)
		} else {
			return nil
		}
	}

	private func createCNGroup(username: String) throws -> CNMutableGroup {
		let newGroup = CNMutableGroup()
		newGroup.name = "Tuta \(username)"

		let saveRequest = CNSaveRequest()
		saveRequest.add(newGroup, toContainerWithIdentifier: localContainer)

		do { try CNContactStore().execute(saveRequest) } catch { throw ContactStoreError(message: "Could not create CNGroup", underlyingError: error) }

		return newGroup
	}

	private func saveMapping(_ mapping: UserContactMapping, forUsername username: String) {
		var dict = getMappingsDictionary()
		dict[username] = try! DictionaryEncoder().encode(mapping)
		self.userDefaults.setValue(dict, forKey: CONTACTS_MAPPINGS)
	}

	private func deleteMapping(forUsername username: String) {
		var dict = getMappingsDictionary()
		dict.removeValue(forKey: username)
		self.userDefaults.setValue(dict, forKey: CONTACTS_MAPPINGS)
	}

	private func queryContactSuggestions(query: String, upTo: Int) throws -> [ContactSuggestion] {
		let contactsStore = CNContactStore()
		let keysToFetch: [CNKeyDescriptor] = [
			CNContactEmailAddressesKey as NSString,  // only NSString is CNKeyDescriptor
			CNContactFormatter.descriptorForRequiredKeys(for: .fullName),
		]
		let request = CNContactFetchRequest(keysToFetch: keysToFetch)
		var result = [ContactSuggestion]()
		// This method is synchronous. Enumeration prevents having all accounts in memory at once.
		// We are doing the search manually because we can cannot combine predicates.
		// Alternatively we could query for email and query for name separately and then combine the results
		try contactsStore.enumerateContacts(with: request) { contact, stopPointer in
			let name: String = CNContactFormatter.string(from: contact, style: .fullName) ?? ""
			let matchesName = name.range(of: query, options: .caseInsensitive) != nil
			for address in contact.emailAddresses {
				let addressString = address.value as String
				if matchesName || addressString.range(of: query, options: .caseInsensitive) != nil {
					result.append(ContactSuggestion(name: name, mailAddress: addressString))
				}
				if result.count > upTo { stopPointer.initialize(to: true) }
			}
		}
		return result
	}
}

/// Defines a mutable contact and functionality for commiting the contact into a contact store
private class NativeMutableContact {
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

private enum StructuredMessengerHandleTypeName: String {
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

private extension Hashable {
	func computeHash() -> Int {
		var hasher = Hasher()
		hasher.combine(self)
		return hasher.finalize()
	}
}

private struct MatchContactResult {
	/** do not exist on the device yet but exists on the server */
	var newServerContacts: [StructuredContact] = []
	/** exist on the device and the server and are not marked as dirty */
	var existingServerContacts: [(NativeMutableContact, StructuredContact)] = []
	/** contacts that exist on the device and on the server but we did not map them via sourceId yet */
	var nativeContactWithoutSourceId: [NativeMutableContact] = []
	/** exists on native (and is not marked deleted or dirty) but doesn't exist on the server anymore */
	var deletedOnServer: [String] = []
	/** exist in both but are marked as dirty */
	var editedOnDevice: [(NativeMutableContact, StructuredContact)] = []
	/** exists on the device but not on the server (and marked as dirty) */
	var createdOnDevice: [StructuredContact] = []
	/** exists on the server but marked as deleted (and dirty) on the device */
	var deletedOnDevice: [String] = []
}

private extension DateComponents {
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

private extension Date {
	static func fromIso(_ iso: String) -> Date? {
		let formatter = ISO8601DateFormatter()
		formatter.formatOptions = [.withFullDate]

		return formatter.date(from: iso)
	}
}

private extension NSDateComponents {
	func toIso() -> String { String(format: "%04d-%02d-%02d", year, month, day) }
	static func fromIso(_ iso: String) -> NSDateComponents? {
		guard let date = DateComponents.fromIso(iso) else { return nil }
		return date as NSDateComponents
	}
}

private extension CNContact {
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

/// Calls CNLabeledValue.localizedString, but accepts null values (if so, it returns nil)
private func localizeContactLabel<ValueType>(_ what: CNLabeledValue<ValueType>) -> String? {
	guard let label = what.label else { return nil }
	return type(of: what).localizedString(forLabel: label)
}
