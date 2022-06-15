import Foundation
import Contacts

let CONTACTS_ERROR_DOMAIN = "Contacts"

class ContactsSource {
  func search(query: String) async throws -> [NativeContact] {
    let status = CNContactStore.authorizationStatus(for: .contacts)
    switch status {
    case .authorized:
      return try await self.doSearch(query: query)
    case .denied, .restricted:
      return []
    case .notDetermined:
      let granted = try await CNContactStore().requestAccess(for: .contacts)
      if granted {
        return try await self.doSearch(query: query)
      } else {
        return []
      }
    @unknown default:
      TUTSLog("Unknown auth status: \(status)")
      return []
    }
  }
  
  private func doSearch(query: String) async throws -> [NativeContact] {
      return try self.queryContacts(query: query, upTo: 10)
  }
  
  private func queryContacts(query: String, upTo: Int) throws -> [NativeContact] {
    let contactsStore = CNContactStore()
    let keysToFetch: [CNKeyDescriptor] = [
      CNContactEmailAddressesKey as NSString, // only NSString is CNKeyDescriptor
      CNContactFormatter.descriptorForRequiredKeys(for: .fullName)
    ]
    let request = CNContactFetchRequest(keysToFetch: keysToFetch)
    var result = [NativeContact]()
    // This method is synchronous. Enumeration prevents having all accounts in memory at once.
    // We are doing the search manually because we can only use predicates from CNContact+Predicates.h
    // and there's no predicate for the e-mail. Thanks, Apple.
    try contactsStore.enumerateContacts(with: request) { contact, stopPointer in
      let name: String = CNContactFormatter.string(from: contact, style: .fullName) ?? ""
      let matchesName = name.range(of: query, options: .caseInsensitive) != nil
      for address in contact.emailAddresses {
        let addressString = address.value as String
        if matchesName || addressString.range(of: query, options: .caseInsensitive) != nil {
          result.append(NativeContact(name: name, mailAddress: addressString))
        }
        if result.count > upTo {
          stopPointer.initialize(to: true)
        }
      }
    }
    return result
  }
}
