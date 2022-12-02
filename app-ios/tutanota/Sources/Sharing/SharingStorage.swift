import Foundation

let TUTANOTA_APP_GROUP = "group.de.tutao.tutanota"
let TUTANOTA_SHARE_SCHEME = "tutashare"

/// this gets shared to the main app and contains all the info
/// to create a new mail & the cleanup
struct SharingInfo: Codable {
  /// this is the key that the information is stored under in the
  /// UserDefaults and on disk
  var timestamp: String
  /// body text of new mail
  var text: String
  /// files to attach
  var fileUrls: [URL]
}

/// different errors that can happen when trying to load, convert and write
/// shared items to the app group storage
enum SharingError: Error {
  case failedToLoad
  case failedToWrite
  case failedToRead
}

/// different types of items are shared under different names
/// ident identifies the type, content the associated data
enum SharedItem {
  case fileUrl(ident: String, content: URL?)
  case image(ident: String, content: UIImage?)
  case text(ident: String, content: String?)
  case contact(ident: String, content: String?)
  
  func ident() -> String {
    switch self {
    case .fileUrl(ident: let ident, content: _), .text(ident: let ident, content: _), .contact(ident: let ident, content: _), .image(ident: let ident, content: _):
      return ident
    }
  }
}

/// there is a bunch of uniform type identifiers that can be set by the sharing app. it's not clear what's available,
/// but there are some constants defined available with "import UniformTypeIdentifiers".
func stringToItemType(ident: String) -> SharedItem? {
  switch ident {
  case
    "public.png", "public.jpeg", "public.tiff", //shared from photos
    "public.file-url" // shared from files
    :
    return .fileUrl(ident: ident, content: nil)
  case
    "public.image" // shared from e.g. Signal, no URL but image data
    :
    return .image(ident: ident, content: nil)
  case
    "public.url", // shared image from safari, shared link, shared pdf...
    "public.plain-text" // shared from Notes, safari
    :
    return .text(ident: ident, content: nil)
  case
    "public.vcard" // shared from contacts
    :
    return .contact(ident: ident, content: nil)
  default:
    return nil
  }
}

/// write a single file to a subdirectory in the shared storage of the app group
func writeToSharedStorage(subdir: String, name: String, content: Data) async throws -> URL {
  return try await withCheckedThrowingContinuation { cont in
    
    guard let sharedURL = try? FileUtils.ensureSharedStorage(inSubdir: subdir) else {
      TUTSLog("failed to ensure sharing directory for this request")
      cont.resume(throwing: SharingError.failedToWrite)
      return
    }
    
    let fileURL: URL = sharedURL.appendingPathComponent(name)
    do {
      try content.write(to: fileURL)
    }
    catch {
      TUTSLog("error writing file \(error)")
      cont.resume(throwing: SharingError.failedToWrite)
      return
    }
    cont.resume(returning: fileURL)
  }
}

/// read a single file from a URL, returning the contents
func readFileContents(path: URL) async throws -> Data {
  return try await withCheckedThrowingContinuation { cont in
    do {
      let data = try Data(contentsOf: path)
      cont.resume(returning: data)
    }
    catch {
      TUTSLog("error reading file: \(error)")
      cont.resume(throwing: SharingError.failedToRead)
    }
  }
}

/// take a list of file URLs (including file:// protocol) and copy them to the app group's storage
/// returning a new list of URLs pointing to the new locations
func copyToSharedStorage(subdir: String, fileUrls: [URL]) async -> [URL] {
  var newLocations: [URL] = []
  for fileUrl in fileUrls {
    guard let contentData = try? await readFileContents(path: fileUrl) else {
      TUTSLog("could not read file at \(fileUrl) to share")
      continue
    }
    let fileName = fileUrl.lastPathComponent
    guard let newLocation = try? await writeToSharedStorage(subdir: subdir, name: fileName, content: contentData) else {
      TUTSLog("could not copy file at \(fileUrl) to share")
      continue
    }
    newLocations.append(newLocation)
  }
  
  return newLocations
}

/// write the text and file paths for this share request to shared UserDefaults
func writeSharingInfo(info: SharingInfo, timestamp: String) throws -> Void {
  let encoder = JSONEncoder()
  encoder.outputFormatting = .prettyPrinted
  let jsonData = try encoder.encode(info)
  let defaults = try getSharedDefaults()
  defaults.set(jsonData, forKey: timestamp)
}

/// read the information needed to create a mail editor from a share request
/// from the shared UserDefaults
func readSharingInfo(timestamp: String) -> SharingInfo? {
  guard let defaults = try? getSharedDefaults() else {
    return nil
  }
  defer {
    defaults.removeObject(forKey: timestamp)
  }
  
  guard let data: Data = defaults.value(forKey: timestamp) as! Data? else {
    TUTSLog("there are no sharingInfos to be found at \(timestamp)")
    return nil
  }
  if let decodedInfo = try? JSONDecoder().decode(SharingInfo.self, from: data) {
    return decodedInfo
  } else{
    TUTSLog("could not decode sharingInfo from UserDefaults")
    return nil
  }
}

fileprivate func getSharedDefaults() throws -> UserDefaults {
  guard let defaults = UserDefaults(suiteName: TUTANOTA_APP_GROUP) else {
    let msg = "failed to get shared user defaults with suite \(TUTANOTA_APP_GROUP)"
    TUTSLog(msg)
    throw TUTErrorFactory.createError(msg)
  }
  
  return defaults
}

/// returns a timestamp derived from the kernel's monotonic clock in microseconds.
/// start time is arbitrary, does not increment while system is asleep.
/// may return duplicate values if the kernel time is reset (reboot?)
func getTimestampMicro() -> UInt64 {
  let divisor: UInt64 = 1000
  return clock_gettime_nsec_np(CLOCK_UPTIME_RAW) / divisor
}

/// get the URL pointing to the shared storage on disk
func sharedDirectoryURL() -> URL {
  let fileManager = FileManager.default
  return fileManager.containerURL(forSecurityApplicationGroupIdentifier: TUTANOTA_APP_GROUP)!
}
