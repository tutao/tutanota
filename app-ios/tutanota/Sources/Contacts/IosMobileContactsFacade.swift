import Contacts
import DictionaryCoding

// Maps a Tuta ID to a native or structured contact
private typealias TutaToNativeContactIdentifiers = [String: String]
private typealias TutaToNativeContacts = [String: NativeMutableContact]
private typealias TutaToStructuredContacts = [String: StructuredContact]

private let CONTACT_BOOK_ID = "APPLE_DEFAULT"

/// Handles synchronization between contacts in Tuta and contacts on the device.
final class IosMobileContactsFacade: MobileContactsFacade {
	private let ERROR_DOMAIN = "de.tutao.tutanota.ContactFacade"
	private let contactFacade: TutaContactFacade

	init(userDefaults: any UserPreferencesProvider) { self.contactFacade = TutaContactFacade(userDefaults: userDefaults) }

	func findSuggestions(_ query: String) async throws -> [ContactSuggestion] {
		try await acquireContactsPermission()
		return try contactFacade.queryContactSuggestions(query: query, upTo: 10)
	}

	func getContactBooks() async throws -> [ContactBook] {
		try await acquireContactsPermission()
		// we can't effectively query containers so we just pretend that we have one book
		return [ContactBook(id: CONTACT_BOOK_ID, name: "")]
	}

	func getContactsInContactBook(_ containerId: String, _ username: String) async throws -> [StructuredContact] {
		assert(containerId == CONTACT_BOOK_ID, "Invalid contact book: \(containerId)")
		try await acquireContactsPermission()

		var addresses = [StructuredContact]()
		let contactList = self.contactFacade.getContactList(username: username)
		let mapping = contactList?.getMapping()

		for contact in try self.contactFacade.getAllContacts(withSorting: CNContactSortOrder.givenName) {
			let identifier = contact.rawId!
			if mapping?.localContactIdentifierToHash[identifier] == nil {
				// we don't need (and probably don't have?) a server id in this case
				addresses.append(contact)
			}
		}

		return addresses
	}

	func deleteContacts(_ username: String, _ contactId: String?) async throws {
		try await acquireContactsPermission()

		let mapping = try self.contactFacade.getOrCreateContactList(username: username)
		if let contactId {
			try mapping.delete(contactsWithServerIDs: [contactId])
			self.contactFacade.saveContactList(mapping)
		} else {
			try self.contactFacade.deleteContactList(mapping)
		}
	}

	func findLocalMatches(_ contacts: [StructuredContact]) async throws -> [String] {
		TUTSLog("MobileContactsFacade: searching for duplicates of \(contacts.count) contacts")
		if contacts.isEmpty { return [] }
		try await acquireContactsPermission()
		return try self.contactFacade.findDuplicateLocalContacts(contacts)
	}

	func deleteLocalContacts(_ contacts: [String]) async throws {
		TUTSLog("MobileContactFacade: deleting \(contacts.count) contacts...")
		if contacts.isEmpty { return }
		try await acquireContactsPermission()
		return try self.contactFacade.deleteLocalContacts(contacts)
	}

	func saveContacts(_ username: String, _ contacts: [StructuredContact]) async throws {
		throw TUTErrorFactory.createError(withDomain: ERROR_DOMAIN, message: "Contact sync isn't available on Tuta Mail on iOS")
	}

	func syncContacts(_ username: String, _ contacts: [StructuredContact]) async throws -> ContactSyncResult {
		throw TUTErrorFactory.createError(withDomain: ERROR_DOMAIN, message: "Contact sync isn't available on Tuta Mail on iOS")
	}
}
