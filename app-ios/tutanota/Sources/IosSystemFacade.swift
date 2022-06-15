import Foundation

class IosSystemFacade : SystemFacade {
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
  
  /// - Returns path to the generated logfile
  func getLog() async throws -> String {
    let entries = TUTLogger.sharedInstance().entries()
    let directory = try FileUtils.getDecryptedFolder()
    let directoryUrl = URL(fileURLWithPath: directory)
    let fileName = "\(Date().timeIntervalSince1970)_device_tutanota.log"
    let fileUrl = directoryUrl.appendingPathComponent(fileName, isDirectory: false)
    let stringContent = entries.joined(separator: "\n")
    let bytes = stringContent.data(using: .utf8)!
    try bytes.write(to: fileUrl, options: .atomic)
    return fileUrl.path
  }
}
