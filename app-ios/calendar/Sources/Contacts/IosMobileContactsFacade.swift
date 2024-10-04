import Contacts
import DictionaryCoding

/// Handles synchronization between contacts in Tuta and contacts on the device.
class IosMobileContactsFacade: MobileContactsFacade {
	private let userDefaults: UserDefaults
	private let ERROR_DOMAIN = "de.tutao.calendar.ContactFacade"

	init(userDefault: UserDefaults) { self.userDefaults = userDefault }

	func findSuggestions(_ query: String) async throws -> [ContactSuggestion] {
		try await acquireContactsPermission()
		return try self.queryContactSuggestions(query: query, upTo: 10)
	}

	private func enumerateContactsInContactStore(
		_ contactStore: CNContactStore,
		with fetchRequest: CNContactFetchRequest,
		usingBlock block: (CNContact, UnsafeMutablePointer<ObjCBool>) -> Void
	) throws {
		do { try contactStore.enumerateContacts(with: fetchRequest, usingBlock: block) } catch {
			throw ContactStoreError(message: "Could not enumerate contacts", underlyingError: error)
		}
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
		try self.enumerateContactsInContactStore(contactsStore, with: request) { contact, stopPointer in
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

	func saveContacts(_ username: String, _ contacts: [StructuredContact]) async throws {
		throw TUTErrorFactory.createError(withDomain: ERROR_DOMAIN, message: "Contact sync isn't available on Tuta Calendar")
	}

	func syncContacts(_ username: String, _ contacts: [StructuredContact]) async throws -> ContactSyncResult {
		throw TUTErrorFactory.createError(withDomain: ERROR_DOMAIN, message: "Contact sync isn't available on Tuta Calendar")
	}

	func getContactBooks() async throws -> [ContactBook] {
		throw TUTErrorFactory.createError(withDomain: ERROR_DOMAIN, message: "Contact import isn't available on Tuta Calendar")
	}

	func getContactsInContactBook(_ containerId: String, _ username: String) async throws -> [StructuredContact] {
		throw TUTErrorFactory.createError(withDomain: ERROR_DOMAIN, message: "Contact import isn't Not available on Tuta Calendar")
	}

	func deleteContacts(_ username: String, _ contactId: String?) async throws {
		throw TUTErrorFactory.createError(withDomain: ERROR_DOMAIN, message: "Contact sync isn't available on Tuta Calendar")
	}

	func isLocalStorageAvailable() async throws -> Bool {
		throw TUTErrorFactory.createError(withDomain: ERROR_DOMAIN, message: "Contact sync isn't available on Tuta Calendar")
	}

	func findLocalMatches(_ contacts: [TutanotaSharedFramework.StructuredContact]) async throws -> [String] {
		throw TUTErrorFactory.createError(withDomain: ERROR_DOMAIN, message: "Contact sync isn't available on Tuta Calendar")
	}

	func deleteLocalContacts(_ contacts: [String]) async throws {
		throw TUTErrorFactory.createError(withDomain: ERROR_DOMAIN, message: "Contact sync isn't available on Tuta Calendar")
	}

	func matchStoredContacts(_ username: String, _ contactId: String?) async throws {
		throw TUTErrorFactory.createError(withDomain: ERROR_DOMAIN, message: "Contact sync isn't available on Tuta Calendar")
	}
}
