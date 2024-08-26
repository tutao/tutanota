import Contacts
import Foundation

struct UserContactMapping: Codable {
	let username: String
	var systemGroupIdentifier: String
	var localContactIdentifierToServerId: [String: String]
	var localContactIdentifierToHash: [String: UInt32]
	/// Whether we use Swift's built-in Hasher that is seeded randomly or our own hashing that is stable between runs
	var stableHash: Bool?
}

/// Used to perform operations on an iOS contact list while keeping track of the links to the server contacts
class UserContactList {
	private let nativeContactStoreFacade: NativeContactStoreFacade
	private var mappingData: UserContactMapping
	private let container: String

	init(nativeContactStoreFacade: NativeContactStoreFacade, username: String, mappingData: UserContactMapping?, stableHash: Bool? = nil) throws {
		self.nativeContactStoreFacade = nativeContactStoreFacade
		self.container = nativeContactStoreFacade.getLocalContainer()
		// If mapping data is provided, we are likely reinstantiating an existing contact list
		// so there is no need for a new group
		if let mappingData {
			self.mappingData = mappingData
		} else {
			let group = try nativeContactStoreFacade.createCNGroup(username: username)
			self.mappingData = UserContactMapping(
				username: username,
				systemGroupIdentifier: group.identifier,
				localContactIdentifierToServerId: [:],
				localContactIdentifierToHash: [:],
				stableHash: stableHash
			)
		}
	}

	func contains(nativeContactId: String) -> Bool { self.mappingData.localContactIdentifierToHash[nativeContactId] != nil }

	/// Returns the mapping between the iOS contact IDs and the Tuta server IDs
	func getMapping() -> UserContactMapping { mappingData }

	/// Returns all of the contacts inside the contact list
	func getAllContacts() throws -> [CNContact] { try nativeContactStoreFacade.getAllContacts(inGroup: getTutaContactGroup(), withSorting: nil) }

	/// Appends a one or more contacts to the contact list provided that the contacts have Tuta server IDs
	func insert(contacts: [StructuredContact]) throws {
		let contactGroup = try self.getTutaContactGroup()

		// We need store mapping from our contact id to native contact id but we get it only after actually saving the contacts,
		// so until we execute the save request we keep track of the mapping
		var insertedContacts = [(NativeMutableContact, StructuredContact)]()
		for newContact in contacts {
			if let contactId = newContact.id {
				let nativeContact = NativeMutableContact(newContactWithServerId: contactId, container: self.container)
				nativeContact.updateContactWithData(newContact)
				insertedContacts.append((nativeContact, newContact))

				mappingData.localContactIdentifierToServerId[nativeContact.contact.identifier] = newContact.id
				mappingData.localContactIdentifierToHash[nativeContact.contact.identifier] = newContact.stableHash()
			}
		}

		try nativeContactStoreFacade.insert(contacts: insertedContacts.map { $0.0 }, toGroup: contactGroup)
	}

	/// Modifies the data of an existing contact in the contact list
	func update(contacts: [(NativeMutableContact, StructuredContact)]) throws {
		var mutableContacts = [NativeMutableContact]()
		for (nativeMutableContact, serverContact) in contacts {
			mappingData.localContactIdentifierToHash[nativeMutableContact.contact.identifier] = serverContact.stableHash()
			nativeMutableContact.updateContactWithData(serverContact)
			mutableContacts.append(nativeMutableContact)
		}
		try nativeContactStoreFacade.update(contacts: mutableContacts)
	}

	/// Removes one or more contacts in the contact list
	func delete(contactsWithServerIDs serverIdsToDelete: [String]) throws {
		// we now need to create a request to remove all contacts from the user that match an id in idsToRemove
		// it is OK if we are missing some contacts, as they are likely already deleted
		var serverIdToLocalIdentifier = [String: String]()
		// doing it manually in case we have duplicates (which isn't good but might happen)
		for (localIdentifier, serverId) in mappingData.localContactIdentifierToServerId { serverIdToLocalIdentifier[serverId] = localIdentifier }

		let localAndServerIds = serverIdsToDelete.map { (serverId: $0, localIdentifier: serverIdToLocalIdentifier[$0]) }

		// Delete the contacts from the iOS contact store
		let nativeIdentifiersToRemove = localAndServerIds.compactMap { $0.localIdentifier }
		try nativeContactStoreFacade.delete(localContacts: nativeIdentifiersToRemove)

		// Erasing the mapping between the local iOS IDs and the Tuta server IDs
		for (localIdentifier, _) in localAndServerIds {
			mappingData.localContactIdentifierToServerId.removeValue(forKey: localIdentifier)
			mappingData.localContactIdentifierToHash.removeValue(forKey: localIdentifier)
		}
	}

	/// Gets the Tuta contact group, creating it if it does not exist.
	func getTutaContactGroup() throws -> CNGroup {
		if let group = try nativeContactStoreFacade.loadCNGroup(withIdentifier: mappingData.systemGroupIdentifier) {
			return group
		} else {
			TUTSLog("can't get tuta contact group \(mappingData.username) from native: likely deleted by user")

			let newGroup = try nativeContactStoreFacade.createCNGroup(username: mappingData.username)

			// update mapping right away so that everyone down the road will be using an updated version
			mappingData.systemGroupIdentifier = newGroup.identifier
			// if the group is not there none of the mapping values make sense anymore
			mappingData.localContactIdentifierToServerId = [:]
			mappingData.localContactIdentifierToHash = [:]

			// save the mapping right away so that if something later fails we won't have a dangling group
			//			tutaContactFacade.saveMapping(self)
			return newGroup
		}
	}
}
