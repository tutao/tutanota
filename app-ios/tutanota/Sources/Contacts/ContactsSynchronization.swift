import Contacts

// Maps a Tuta ID to a native or structured contact
private typealias TutaToNativeContactIdentifiers = Dictionary<String, String>
private typealias TutaToNativeContacts = Dictionary<String, NativeMutableContact>
private typealias TutaToStructuredContacts = Dictionary<String, StructuredContact>

private let CONTACTS_MAPPINGS = "ContactsMappings"
private let TUTA_GROUP_IDENTIFIER = "TutaGroupIdentifier"

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
  init(userPreferencesProvider: UserPreferencesProvider) {
    self.userPreferencesProvider = userPreferencesProvider
  }
  
  let userPreferencesProvider: UserPreferencesProvider
  
  /// Resync all locally stored contacts for the user ID with the new list.
  ///
  /// Parameters:
  /// - `contacts` defines the contacts to sync. All contacts not in this list will be erased.
  /// - `forUserId` denotes the user to modify.
  func syncLocalContacts(_ contacts: [StructuredContact], forUserId userId: String) async throws {
    try await updateLocalContacts(contacts, forUserId: userId, deleteOldContacts: true)
  }
  
  /// Update locally stored contacts for the user ID with the list.
  ///
  /// Parameters:
  /// - `contacts` defines the contacts to modify. Contacts not in this list will not be altered.
  /// - `forUserId` denotes the user to modify.
  func saveLocalContacts(_ contacts: [StructuredContact], forUserId userId: String) async throws {
    try await updateLocalContacts(contacts, forUserId: userId, deleteOldContacts: false)
  }
  
  /// Remove a contact for the user.
  ///
  /// Parameters:
  /// - `contactId` defines the contact to remove.
  /// - `forUserId` denotes the user to modify.
  func deleteLocalContact(_ contactId: String, forUserId userId: String) async throws {
    guard await requestAuthorizationForContacts() else { return }
    let localContacts = getSavedLocalContactsIdentifierMappings(forUserId: userId)
    guard let contactToDelete = localContacts[contactId] else { return }
    try removeNativeContacts([contactId:contactToDelete], forUserId: userId)
  }
  
  private func updateLocalContacts(_ contacts: [StructuredContact], forUserId userId: String, deleteOldContacts delete: Bool) async throws {
    guard await requestAuthorizationForContacts() else { return }
    
    // Load into a hashmap for efficient searching
    let structuredContactsMap: TutaToStructuredContacts = contacts.reduce(into: [:]) { result, contact in
      result[contact.id] = contact
    }
    
    // retrieve contacts; if our new list is empty, this will also clear the locally stored contacts, hence why we check for emptiness after this
    let localContacts = try getSavedLocalContacts(forUserId: userId, withStructuredContacts: structuredContactsMap, deleteOldContacts: delete)
    
    // nothing left to do?
    if contacts.isEmpty {
      return
    }
    
    // initialize new contacts if needed
    var nativeContacts = TutaToNativeContacts()
    var updatingContacts = TutaToNativeContactIdentifiers()
    if contacts.count > localContacts.count {
      for contact in structuredContactsMap {
        if let localContact = localContacts[contact.key] {
          updatingContacts[contact.key] = localContact
        } else {
          nativeContacts[contact.key] = NativeMutableContact(newContactWithId: contact.key)
        }
      }
    } else {
      updatingContacts = localContacts
    }
    
    // now load stored native contacts, and merge them into our map
    var contactsNotFound = [String]()
    let storedNativeContacts = try loadNativeContacts(with: updatingContacts, keysToFetch: ALL_SUPPORTED_CONTACT_KEYS, storeContactsNotFound: &contactsNotFound)
    nativeContacts.merge(storedNativeContacts) { a,_ in a }
    
    // missing some?
    for contact in contactsNotFound {
      nativeContacts[contact] = NativeMutableContact(newContactWithId: contact)
    }
    
    // update contact data
    for contact in contacts {
      nativeContacts[contact.id]!.updateContactWithData(contact)
    }
    
    // finally save
    try saveNativeContacts(nativeContacts, forUserId: userId, deleteOldContacts: delete)
  }
  
  private func getSavedLocalContacts(forUserId userId: String, withStructuredContacts structuredContacts: TutaToStructuredContacts, deleteOldContacts: Bool) throws -> TutaToNativeContactIdentifiers {
    // do nothing if we have no contacts stored
    var localContacts = getSavedLocalContactsIdentifierMappings(forUserId: userId)
    if localContacts.isEmpty {
      return [:]
    }
    
    // remove everything (likely user deletion, or account has no contacts yet), so no need to loop
    if structuredContacts.isEmpty {
      if deleteOldContacts {
        try removeNativeContacts(localContacts, forUserId: userId)
      }
      return [:]
    }
    
    // find everything we have stored that isn't in the new list
    var contactsToRemove: TutaToNativeContactIdentifiers = [:]
    for i in localContacts {
      if structuredContacts[i.key] == nil {
        contactsToRemove[i.key] = i.value
      }
    }
    
    // delete from our map
    if !contactsToRemove.isEmpty {
      for i in contactsToRemove {
        localContacts[i.key] = nil
      }
      if deleteOldContacts {
        try removeNativeContacts(contactsToRemove, forUserId: userId)
      }
    }
    
    return localContacts
  }
  
  
  /// Load all native contacts in the dictionary.
  ///
  /// If there are contacts that were not found, return a map of their IDs.
  private func loadNativeContacts(with contacts: TutaToNativeContactIdentifiers, keysToFetch: [CNKeyDescriptor], storeContactsNotFound: inout [String]) throws -> TutaToNativeContacts {
    var nativeToTutaContactIdentifiers = Dictionary.init(uniqueKeysWithValues: contacts.map { ($1, $0) })
    
    let store = CNContactStore()
    var contacts = TutaToNativeContacts()
    
    let fetch = CNContactFetchRequest(keysToFetch: keysToFetch)
    try store.enumerateContacts(with: fetch) { contact, stopPointer in
      guard let id = nativeToTutaContactIdentifiers.removeValue(forKey: contact.identifier) else { return }
      contacts[id] = NativeMutableContact(existingContact: contact.mutableCopy() as! CNMutableContact, withId: id)
    }
    
    storeContactsNotFound = Array(nativeToTutaContactIdentifiers.values)
    return contacts
  }
  
  private func saveNativeContacts(_ contacts: TutaToNativeContacts, forUserId userId: String, deleteOldContacts delete: Bool) throws {
    let store = CNContactStore()
    let saveRequest = CNSaveRequest()
    let contactGroup = try getTutaContactGroup()
    for contact in contacts {
      contact.value.applyToSaveRequest(request: saveRequest, tutaContactGroup: contactGroup)
    }
    try store.execute(saveRequest)
    
    writeSavedLocalContactsIdentifierMappings(contacts.mapValues { contact in contact.contact.identifier }, forUserId: userId, merge: !delete)
  }
  
  /// Gets the Tuta contact group, creating it if it does not exist.
  private func getTutaContactGroup() throws -> CNGroup {
    let store = CNContactStore()
    if let groupIdentifier = getTutaContactsGroupIdentifier() {
      let result = try store.groups(matching: CNGroup.predicateForGroups(withIdentifiers: [groupIdentifier]))
      if !result.isEmpty {
        return result[0]
      }
      TUTSLog("can't get tuta contact group \(groupIdentifier) from native: likely deleted by user")
    }
    
    let newGroup = CNMutableGroup()
    newGroup.name = "Tuta"
    
    let saveRequest = CNSaveRequest()
    saveRequest.add(newGroup, toContainerWithIdentifier: nil)
    
    try store.execute(saveRequest)
    setTutaContactsGroupIdentifier(newGroup.identifier)
    
    return newGroup
  }
  
  private func removeNativeContacts(_ contacts: TutaToNativeContactIdentifiers, forUserId userId: String) throws {
    var identifiersToRemove = Set(contacts.values)
    
    // we now need to create a request to remove all contacts from the user that match an id in idsToRemove
    // it is OK if we are missing some contacts, as they are likely already deleted
    let store = CNContactStore()
    let fetch = CNContactFetchRequest(keysToFetch: [CNContactIdentifierKey] as [CNKeyDescriptor])
    let save = CNSaveRequest()
    var canDelete = false
    try store.enumerateContacts(with: fetch) { contact, stopPointer in
      guard identifiersToRemove.remove(contact.identifier) != nil else { return }
      save.delete(contact.mutableCopy() as! CNMutableContact)
      canDelete = true
      
      // stop early; nothing left to remove
      if identifiersToRemove.isEmpty {
        stopPointer.initialize(to: true)
      }
    }
    
    // nothing to delete?
    if !canDelete {
      return
    }
    
    try store.execute(save)
    
    var oldIdentifiers = getSavedLocalContactsIdentifierMappings(forUserId: userId)
    for contact in contacts {
      oldIdentifiers[contact.key] = nil
    }
    writeSavedLocalContactsIdentifierMappings(oldIdentifiers, forUserId: userId, merge: false)
  }
  
  private func getContactsMappingsDictionary() -> [String:Any] {
    return self.userPreferencesProvider.getDictionary(forKey: CONTACTS_MAPPINGS) ?? [:]
  }
  
  private func writeContactsMappingsDictionary(_ dictionary: [String:Any]) {
    self.userPreferencesProvider.setValue(dictionary, forKey: CONTACTS_MAPPINGS)
  }
  
  private func getTutaContactsGroupIdentifier() -> String? {
    return getContactsMappingsDictionary()[TUTA_GROUP_IDENTIFIER] as? String
  }
  
  private func setTutaContactsGroupIdentifier(_ identifier: String) {
    var mappings = getContactsMappingsDictionary()
    mappings[TUTA_GROUP_IDENTIFIER] = identifier
    writeContactsMappingsDictionary(mappings)
  }
  
  private func getSavedLocalContactsIdentifierMappings(forUserId userId: String) -> TutaToNativeContactIdentifiers {
    let mappings = getContactsMappingsDictionary()
    let userContacts = (mappings[userId] ?? [:]) as! TutaToNativeContactIdentifiers
    return userContacts
  }
  
  private func writeSavedLocalContactsIdentifierMappings(_ contacts: TutaToNativeContactIdentifiers, forUserId userId: String, merge: Bool) {
    var mappings = getContactsMappingsDictionary()
    
    if merge {
      var currentMappings = (mappings[userId] ?? [:]) as! TutaToNativeContactIdentifiers
      for contact in contacts {
        currentMappings[contact.key] = contact.value
      }
      mappings[userId] = currentMappings
    } else if contacts.isEmpty {
      mappings[userId] = nil
    } else {
      mappings[userId] = contacts
    }
    writeContactsMappingsDictionary(mappings)
  }
}

/// Defines a mutable contact and functionality for commiting the contact into a contact store
private class NativeMutableContact {
  var contact: CNMutableContact
  let id: String
  let isNewContact: Bool
  let originalHashValue: Int?
  
  init(existingContact: CNMutableContact, withId: String) {
    self.contact = existingContact
    self.id = withId
    self.isNewContact = false
    self.originalHashValue = existingContact.hash
  }
  
  init(newContactWithId contactId: String) {
    self.contact = CNMutableContact()
    self.id = contactId
    self.isNewContact = true
    self.originalHashValue = nil
  }
  
  func applyToSaveRequest(request: CNSaveRequest, tutaContactGroup: CNGroup) {
    if self.isNewContact {
      request.add(self.contact, toContainerWithIdentifier: nil)
      request.addMember(self.contact, to: tutaContactGroup)
    } else if self.originalHashValue != self.contact.hash {
      // only update if modified
      request.update(self.contact)
    }
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
    self.contact.phoneNumbers = data.phoneNumbers.map{ number in CNLabeledValue( label: number.type.toCNLabel(), value: CNPhoneNumber(stringValue: number.number)) }
    
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
