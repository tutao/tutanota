import Contacts
import DictionaryCoding

// Maps a Tuta ID to a native or structured contact
private typealias TutaToNativeContactIdentifiers = [String: String]
private typealias TutaToNativeContacts = [String: NativeMutableContact]
private typealias TutaToStructuredContacts = [String: StructuredContact]

private let CONTACTS_MAPPINGS = "ContactsMappings"

struct UserContactMapping : Codable {
  let username: String
  var systemGroupIdentifier: String
  var localContactIdentifierToServerId: [String : String]
}


private let ALL_SUPPORTED_CONTACT_KEYS: [CNKeyDescriptor] = [
  CNContactIdentifierKey,
  CNContactGivenNameKey,
  CNContactFamilyNameKey,
  CNContactNicknameKey,
  CNContactOrganizationNameKey,
  CNContactBirthdayKey,
  CNContactEmailAddressesKey,
  CNContactPhoneNumbersKey,
  CNContactPostalAddressesKey
] as [CNKeyDescriptor]

/// Handles synchronization between contacts in Tuta and contacts on the device.
class ContactsSynchronization {
  private let userDefaults: UserDefaults
  
  init(userDefault: UserDefaults) {
    self.userDefaults = userDefault
  }
  
  /// Resync all locally stored contacts for the user with the new list.
  ///
  /// Parameters:
  /// - `contacts` defines the contacts to sync. All contacts not in this list will be erased.
  /// - `forUsername` denotes the user to modify.
  func syncLocalContacts(_ contacts: [StructuredContact], forUsername username: String) async throws {
    // get local contacts
    // save new ones
    // update existing ones
    // delete old ones
    var mapping = try self.getOrCreateMapping(username: username)
    let matchResult = try self.matchStoredContacts(against: contacts, forUser: &mapping)
    try self.insert(contacts: matchResult.newContacts, forUser: &mapping)
    try self.update(contacts: matchResult.matchedStoredContacts, forUser: &mapping)
    if !matchResult.unmatchedStoredContacts.isEmpty {
      try self.delete(contactsWithLocalIdentifiers: matchResult.unmatchedStoredContacts, forUser: &mapping)
    }
    
    self.saveMapping(mapping, forUsername: mapping.username)
  }
  
  /// Update locally stored contacts for the user with the list.
  ///
  /// Parameters:
  /// - `contacts` defines the contacts to modify. Contacts not in this list will not be altered.
  /// - `forUsername` denotes the user to modify.
  func saveLocalContacts(_ contacts: [StructuredContact], forUsername username: String) async throws {
    var mapping = try self.getOrCreateMapping(username: username)
    let queryResult = try self.matchStoredContacts(against: contacts, forUser: &mapping)
    try self.insert(contacts: queryResult.newContacts, forUser: &mapping)
    try self.update(contacts: queryResult.matchedStoredContacts, forUser: &mapping)
    
    self.saveMapping(mapping, forUsername: mapping.username)
  }
  
  /// Remove one or all contacts from an user.
  ///
  /// Parameters:
  /// - `contactId` defines the contact to remove.
  /// - `forUsername` denotes the user to modify.
  func deleteLocalContact(_ contactId: String?, forUsername username: String) async throws {
    guard await requestAuthorizationForContacts() else { return }
    var mapping = try self.getOrCreateMapping(username: username)
    
    if let contactId {
      if let localIdentifier = mapping.localContactIdentifierToServerId.first(where: { localIdentifier, serverId in serverId == contactId })?.key {
        try self.delete(contactsWithLocalIdentifiers: [localIdentifier], forUser: &mapping)
        self.saveMapping(mapping, forUsername: username)
      }
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
      let localContainer = containers.first(where: {$0.type == CNContainerType.local})
      
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
    var tutaContactToNativeContact = [String : NativeMutableContact]()
    
    for newContact in contacts {
      let nativeContact = NativeMutableContact(newContactWithId: newContact.id, container: self.localContainer)
      nativeContact.updateContactWithData(newContact)
      saveRequest.add(nativeContact.contact, toContainerWithIdentifier: self.localContainer)
      saveRequest.addMember(nativeContact.contact, to: contactGroup)
      tutaContactToNativeContact[newContact.id] = nativeContact
    }
    
    try store.execute(saveRequest)
    
    for (tutaContactId, nativeContact) in tutaContactToNativeContact {
      user.localContactIdentifierToServerId[nativeContact.contact.identifier] = tutaContactId
    }
  }
  
  private func update(contacts: [(StructuredContact, NativeMutableContact)], forUser user: inout UserContactMapping) throws {
    let store = CNContactStore()
    let saveRequest = CNSaveRequest()
    
    for (serverContact, nativeMutableContact) in contacts {
      nativeMutableContact.updateContactWithData(serverContact)
      saveRequest.update(nativeMutableContact.contact)
    }
    
    try store.execute(saveRequest)
  }
  
  private func delete(contactsWithLocalIdentifiers localIdentifiersToDelete: [String], forUser user: inout UserContactMapping) throws {
    // we now need to create a request to remove all contacts from the user that match an id in idsToRemove
    // it is OK if we are missing some contacts, as they are likely already deleted
    let store = CNContactStore()
    let fetch = CNContactFetchRequest(keysToFetch: [CNContactIdentifierKey] as [CNKeyDescriptor])
    
    let nativeIdentifiersToRemove = localIdentifiersToDelete
    fetch.predicate = CNContact.predicateForContacts(withIdentifiers: nativeIdentifiersToRemove)
    let save = CNSaveRequest()
    
    try store.enumerateContacts(with: fetch) { contact, stopPointer in
      save.delete(contact.mutableCopy() as! CNMutableContact)
      user.localContactIdentifierToServerId.removeValue(forKey: contact.identifier)
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
    
    try store.enumerateContacts(with: fetch) { contact, stopPointer in
      save.delete(contact.mutableCopy() as! CNMutableContact)
    }
    
    try store.execute(save)
  }
  
  private func matchStoredContacts(against contacts: [StructuredContact], forUser user: inout UserContactMapping) throws -> ContactMatchResult {
    // prepare the result
    var queryResult = ContactMatchResult(newContacts: [], matchedStoredContacts: [], unmatchedStoredContacts: [])
    
    let store = CNContactStore()
    let fetch = CNContactFetchRequest(keysToFetch: ALL_SUPPORTED_CONTACT_KEYS)
    let group = try self.getTutaContactGroup(forUser: &user)
    
    fetch.predicate = CNContact.predicateForContactsInGroup(withIdentifier: group.identifier)
    
    // Group contacts by id. As we iterate over contacts we will remove the matched one from this dictionary
    var contactsById = Dictionary(uniqueKeysWithValues: contacts.map { ($0.id, $0) })
    
    // Enumerate all contacts in our group
    try store.enumerateContacts(with: fetch) { nativeContact, stopPointer in
      if let tutaContactId = user.localContactIdentifierToServerId[nativeContact.identifier], let tutaContact = contactsById.removeValue(forKey: tutaContactId) {
        let nativeMutableContact = NativeMutableContact(existingContact: nativeContact.mutableCopy() as! CNMutableContact, withId: tutaContactId, container: self.localContainer)
        queryResult.matchedStoredContacts.append((tutaContact, nativeMutableContact))
      } else {
        queryResult.unmatchedStoredContacts.append(nativeContact.identifier)
      }
    }
    
    queryResult.newContacts = Array(contactsById.values)
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
      
      // save the mapping right away so that if something later fails we won;t have a dangling group
      self.saveMapping(mapping, forUsername: mapping.username)
      return newGroup
    }
  }
  
  private func getOrCreateMapping(username: String) throws -> UserContactMapping {
    if let mapping = self.getMapping(username: username) {
      return mapping
    } else {
      let newGroup = try self.createCNGroup(username: username)
      let mapping = UserContactMapping(username: username, systemGroupIdentifier: newGroup.identifier, localContactIdentifierToServerId: [:])
      
      self.saveMapping(mapping, forUsername: username)
      return mapping
    }
  }
  
  private func getMappingsDictionary() -> [String: [String:Any]] {
    return self.userDefaults.dictionary(forKey: CONTACTS_MAPPINGS) as! [String: [String:Any]]? ?? [:]
    
  }
 
  private func getMapping(username: String) -> UserContactMapping? {
    if let dict = getMappingsDictionary()[username] {
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
    
    try CNContactStore().execute(saveRequest)
    
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
}

/// Defines a mutable contact and functionality for commiting the contact into a contact store
private class NativeMutableContact {
  var contact: CNMutableContact
  let id: String
  let isNewContact: Bool
  let originalHashValue: Int?
  let localContainer: String

  init(existingContact: CNMutableContact, withId: String, container: String) {
    self.contact = existingContact
    self.id = withId
    self.isNewContact = false
    self.originalHashValue = existingContact.hash
    self.localContainer = container
  }

  init(newContactWithId contactId: String, container: String) {
    self.contact = CNMutableContact()
    self.id = contactId
    self.isNewContact = true
    self.originalHashValue = nil
    self.localContainer = container
  }

  func updateContactWithData(_ data: StructuredContact) {
    self.contact.givenName = data.firstName
    self.contact.familyName = data.lastName
    self.contact.nickname = data.nickname ?? ""
    self.contact.organizationName = data.company

    if data.birthday == nil {
      self.contact.birthday = nil
    } else {
      let date = ISO8601DateFormatter().date(from: data.birthday!)
      if date != nil {
        self.contact.birthday = Calendar(identifier: Calendar.Identifier.gregorian).dateComponents(in: TimeZone(abbreviation: "UTC")!, from: date!)
      } else {
        self.contact.birthday = nil
      }
    }

    self.contact.emailAddresses = data.mailAddresses.map { address in CNLabeledValue(label: address.type.toCNLabel(), value: address.address as NSString) }
    self.contact.phoneNumbers = data.phoneNumbers.map { number in CNLabeledValue( label: number.type.toCNLabel(), value: CNPhoneNumber(stringValue: number.number)) }

    // can't do postal addresses without parsing them
    self.contact.postalAddresses = []
  }
}

extension NativeMutableContact: Equatable {
  static func == (lhs: NativeMutableContact, rhs: NativeMutableContact) -> Bool {
    return lhs.id == rhs.id && lhs.contact == rhs.contact && lhs.isNewContact == rhs.isNewContact
  }
}

extension NativeMutableContact: Hashable {
  func hash(into hasher: inout Hasher) {
    hasher.combine(self.id)
  }
}

fileprivate struct ContactMatchResult {
  var newContacts: [StructuredContact]
  var matchedStoredContacts: [(StructuredContact, NativeMutableContact)]
  var unmatchedStoredContacts: [String]
}
