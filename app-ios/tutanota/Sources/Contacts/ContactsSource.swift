//
//  ContactsSource.swift
//  tutanota
//
//  Created by Tutao GmbH on 10/21/21.
//  Copyright © 2021 Tutao GmbH. All rights reserved.
//

import Foundation
import Contacts
import UIKit

let CONTACTS_ERROR_DOMAIN = "Contacts"

struct ContactResult : Codable {
  let name: String
  let mailAddress: String
}

class ContactsSource {
  func search(query: String, completion: @escaping ResponseCallback<[ContactResult]>) {
    let status = CNContactStore.authorizationStatus(for: .contacts)
    switch status {
    case .authorized:
      self.doSearch(query: query, completion: completion)
    case .denied, .restricted:
      completion(.success([]))
    case .notDetermined:
      CNContactStore().requestAccess(for: .contacts) { granted, error in
        if granted {
          self.doSearch(query: query, completion: completion)
        } else {
          completion(.success([]))
        }
      }
    @unknown default:
      TUTSLog("Unknown auth status: \(status)")
      completion(.success([]))
    }
  }
  
  private func doSearch(query: String, completion: @escaping ResponseCallback<[ContactResult]>) {
    do {
      let contacts = try self.queryContacts(query: query, upTo: 10)
      completion(.success(contacts))
    } catch {
      completion(.failure(error))
    }
  }
  
  private func queryContacts(query: String, upTo: Int) throws -> [ContactResult] {
    let contactsStore = CNContactStore()
    let keysToFetch: [CNKeyDescriptor] = [
      CNContactEmailAddressesKey as NSString, // only NSString is CNKeyDescriptor
      CNContactFormatter.descriptorForRequiredKeys(for: .fullName)
    ]
    let request = CNContactFetchRequest(keysToFetch: keysToFetch)
    var result = [ContactResult]()
    // This method is synchronous. Enumeration prevents having all accounts in memory at once.
    // We are doing the search manually because we can only use predicates from CNContact+Predicates.h
    // and there's no predicate for the e-mail. Thanks, Apple.
    try contactsStore.enumerateContacts(with: request) { contact, stopPointer in
      let name: String = CNContactFormatter.string(from: contact, style: .fullName) ?? ""
      let matchesName = name.range(of: query, options: .caseInsensitive) != nil
      for address in contact.emailAddresses {
        let addressString = address.value as String
        if matchesName || addressString.range(of: query, options: .caseInsensitive) != nil {
          result.append(ContactResult(name: name, mailAddress: addressString))
        }
        if result.count > upTo {
          stopPointer.initialize(to: true)
        }
      }
    }
    return result
  }
}
