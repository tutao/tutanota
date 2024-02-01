import Foundation

class IosMobileSystemFacade: MobileSystemFacade {
  private let contactsSynchronization: ContactsSynchronization
  private let contactsSource: ContactsSource
  private let viewController: ViewController

  init(contactsSource: ContactsSource, viewController: ViewController, contactsSynchronization: ContactsSynchronization) {
    self.contactsSource = contactsSource
    self.viewController = viewController
    self.contactsSynchronization = contactsSynchronization
  }

  func syncContacts(_ userId: String, _ contacts: [StructuredContact]) async throws {
    return try await self.contactsSynchronization.syncLocalContacts(contacts, forUsername: userId)
  }

  func deleteContacts(_ userId: String, _ contactId: String?) async throws {
    return try await self.contactsSynchronization.deleteLocalContact(contactId, forUsername: userId)
  }

  func saveContacts(_ userId: String, _ contacts: [StructuredContact]) async throws {
    return try await self.contactsSynchronization.saveLocalContacts(contacts, forUsername: userId)
  }

  func findSuggestions(_ query: String) async throws -> [NativeContact] {
    return try await contactsSource.search(query: query)
  }

  @MainActor
  func openLink(_ uri: String) async throws -> Bool {
    return await withCheckedContinuation({ continuation in
      UIApplication.shared.open(
        URL(string: uri)!,
        options: [:]) { success in
          continuation.resume(returning: success)
      }
    })
  }

  @MainActor
  func shareText(_ text: String, _ title: String) async throws -> Bool {
    // code from here: https://stackoverflow.com/a/35931947
    let activityViewController = UIActivityViewController(activityItems: [ text ], applicationActivities: nil)
    activityViewController.popoverPresentationController?.sourceView = self.viewController.view // so that iPads won't crash

    self.viewController.present(activityViewController, animated: true, completion: nil)
    return true
  }
}
