import Contacts
import Foundation

private let ALL_SUPPORTED_CONTACT_KEYS: [CNKeyDescriptor] =
	[
		CNContactIdentifierKey, CNContactGivenNameKey, CNContactFamilyNameKey, CNContactNicknameKey, CNContactOrganizationNameKey, CNContactBirthdayKey,
		CNContactEmailAddressesKey, CNContactPhoneNumbersKey, CNContactPostalAddressesKey, CNContactDatesKey, CNContactDepartmentNameKey,
		CNContactInstantMessageAddressesKey, CNContactMiddleNameKey, CNContactNameSuffixKey, CNContactPhoneticGivenNameKey, CNContactPhoneticMiddleNameKey,
		CNContactPhoneticFamilyNameKey, CNContactRelationsKey, CNContactUrlAddressesKey, CNContactNamePrefixKey, CNContactJobTitleKey,
	] as [CNKeyDescriptor]

/// Provides a simplified interface for the iOS Contacts framework
class NativeContactStoreFacade {

	/// Query the local container, ignoring the user's choices for the default contacts location.
	/// This prevent other apps, as Gmail or even iCloud, from 'stealing' and moving our contacts to their lists.
	/// Container can change at runtime because of the system sync settings.
	func getLocalContainer() -> String {
		let store = CNContactStore()
		let defaultContainer = store.defaultContainerIdentifier()

		do {
			let containers = try store.containers(matching: nil)
			TUTSLog("Contact containers: \(containers.map { "\($0.name) \($0.type) \($0.type.rawValue)" }.joined(separator: ","))")

			// Apple allow just ONE local container, so we can query for the first and unique one
			let localContainer = containers.first(where: { $0.type == CNContainerType.local })

			return localContainer?.identifier ?? defaultContainer
		} catch {
			TUTSLog("Failed to get local container, using default")
			return defaultContainer
		}
	}

	/// Returns whether the local contact container is available
	func isLocalStorageAvailable() -> Bool {
		let store = CNContactStore()

		do {
			let containers = try store.containers(matching: nil)

			// Apple allow just ONE local container, so we can query for the first and unique one
			return containers.contains(where: { $0.type == CNContainerType.local })
		} catch {
			TUTSLog("Failed to fetch containers: \(error)")
			return false
		}
	}

	/// Creates a contact group named for the Tuta app
	func createCNGroup(username: String) throws -> CNMutableGroup {
		let localContainer = self.getLocalContainer()
		let newGroup = CNMutableGroup()
		newGroup.name = "Tuta \(username)"

		let saveRequest = CNSaveRequest()
		saveRequest.add(newGroup, toContainerWithIdentifier: localContainer)

		do { try CNContactStore().execute(saveRequest) } catch { throw ContactStoreError(message: "Could not create CNGroup", underlyingError: error) }

		return newGroup
	}

	/// Returns the contact group with the matching identifier from the iOS contacts
	func loadCNGroup(withIdentifier: String) throws -> CNGroup? {
		let store = CNContactStore()
		let groups = try store.groups(matching: CNGroup.predicateForGroups(withIdentifiers: [withIdentifier]))
		return groups.first
	}

	/// Empties then deletes a contact group from iOS
	func deleteCNGroup(forGroup group: CNGroup) throws {
		// we now need to create a request to remove all contacts from the user that match an id in idsToRemove
		// it is OK if we are missing some contacts, as they are likely already deleted
		let store = CNContactStore()
		let fetch = self.makeContactFetchRequest(forKeys: [CNContactIdentifierKey] as [CNKeyDescriptor])

		fetch.predicate = CNContact.predicateForContactsInGroup(withIdentifier: group.identifier)
		let save = CNSaveRequest()

		try self.enumerateContactsInContactStore(store, with: fetch) { contact, _ in save.delete(contact.mutableCopy() as! CNMutableContact) }

		try store.execute(save)

		// Delete the group itself
		let saveRequest = CNSaveRequest()
		saveRequest.delete(group.mutableCopy() as! CNMutableGroup)
		try store.execute(saveRequest)
	}

	/// Returns all contacts that match a specified query
	func getAllContacts(inGroup group: CNGroup?, withSorting sorting: CNContactSortOrder?) throws -> [CNContact] {
		let store = CNContactStore()
		let fetch = makeContactFetchRequest()
		if let group { fetch.predicate = CNContact.predicateForContactsInGroup(withIdentifier: group.identifier) }
		if let sorting { fetch.sortOrder = sorting }

		var contacts = [CNContact]()
		try self.enumerateContactsInContactStore(store, with: fetch) { contact, _ in contacts.append(contact) }

		return contacts
	}

	/// Returns the full names and email addresses of any contacts that match the name `query` (case insensitive)
	func queryContactSuggestions(query: String, upTo: Int) throws -> [ContactSuggestion] {
		let contactsStore = CNContactStore()
		let keysToFetch: [CNKeyDescriptor] = [
			CNContactEmailAddressesKey as NSString,  // only NSString is CNKeyDescriptor
			CNContactFormatter.descriptorForRequiredKeys(for: .fullName),
		]
		let request = makeContactFetchRequest(forKeys: keysToFetch)
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

	/// Appends one or more contacts to a contact group
	func insert(contacts: [NativeMutableContact], toGroup group: CNGroup) throws {
		let localContainer = self.getLocalContainer()
		let store = CNContactStore()
		let saveRequest = CNSaveRequest()

		for nativeContact in contacts {
			saveRequest.add(nativeContact.contact, toContainerWithIdentifier: localContainer)
			saveRequest.addMember(nativeContact.contact, to: group)
		}

		do { try store.execute(saveRequest) } catch { throw ContactStoreError(message: "Could not insert contacts", underlyingError: error) }
	}

	/// Modifies the data of one or more existing contacts
	func update(contacts: [NativeMutableContact]) throws {
		let store = CNContactStore()
		let saveRequest = CNSaveRequest()

		for nativeMutableContact in contacts { saveRequest.update(nativeMutableContact.contact) }

		do { try store.execute(saveRequest) } catch { throw ContactStoreError(message: "Could not update contacts", underlyingError: error) }
	}

	/// Remove one or more contacts from the contact store via their local iOS contact IDs
	func delete(localContacts nativeIdentifiersToRemove: [String]) throws {
		let store = CNContactStore()
		let fetch = makeContactFetchRequest(forKeys: [CNContactIdentifierKey] as [CNKeyDescriptor])

		fetch.predicate = CNContact.predicateForContacts(withIdentifiers: nativeIdentifiersToRemove)
		let save = CNSaveRequest()

		try self.enumerateContactsInContactStore(store, with: fetch) { contact, _ in save.delete(contact.mutableCopy() as! CNMutableContact) }

		try store.execute(save)
	}

	/// A wrapper around `CNContactStore.enumerateContacts()` that rethrows any errors as `ContactStoreError`s
	private func enumerateContactsInContactStore(
		_ contactStore: CNContactStore,
		with fetchRequest: CNContactFetchRequest,
		usingBlock block: (CNContact, UnsafeMutablePointer<ObjCBool>) -> Void
	) throws {
		do { try contactStore.enumerateContacts(with: fetchRequest, usingBlock: block) } catch {
			throw ContactStoreError(message: "Could not enumerate contacts", underlyingError: error)
		}
	}

	/// Create a fetch request that also loads data for a set of keys on each contact, ensuring that only real, non-unified contacts are pulled from the contact store.
	private func makeContactFetchRequest(forKeys keysToFetch: [CNKeyDescriptor]) -> CNContactFetchRequest {
		let fetchRequest = CNContactFetchRequest(keysToFetch: keysToFetch)
		fetchRequest.unifyResults = false
		return fetchRequest
	}

	/// Create a fetch request that gets all supported keys, ensuring only real, non-unified contacts are pulled from the contact store.
	private func makeContactFetchRequest() -> CNContactFetchRequest { makeContactFetchRequest(forKeys: ALL_SUPPORTED_CONTACT_KEYS) }
}
