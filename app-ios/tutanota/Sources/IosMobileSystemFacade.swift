import Foundation

class IosMobileSystemFacade : MobileSystemFacade {
  private let contactsSource: ContactsSource
  
  init(contactsSource: ContactsSource) {
    self.contactsSource = contactsSource
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
  
  func shareText(_ text: String, _ title: String) async throws -> Bool {
    fatalError("Not implemented on this platform")
  }
}
