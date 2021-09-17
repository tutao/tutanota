import Foundation

let FILES_ERROR_DOMAIN = "tutanota_files"

class FileUtils {
  static func getEncryptedFolder() throws -> String {
    return try Self.makeTempDir(name: "encrypted")
  }
  
  static func getDecryptedFolder() throws -> String {
    return try Self.makeTempDir(name: "decrypted")
  }
  
  static func fileExists(atPath path: String) -> Bool {
    return FileManager.default.fileExists(atPath: path)
  }
  
  static func urlFromPath(path: String) -> URL {
    return URL(fileURLWithPath: path)
  }
  
  static func pathFromUrl(url: URL) -> String {
    return url.path
  }
  
  private static func makeTempDir(name: String) throws -> String {
    let encryptedFolderPath =
    (NSTemporaryDirectory() as NSString).appendingPathComponent(name)
    try FileManager.default.createDirectory(
      atPath: encryptedFolderPath,
      withIntermediateDirectories: true,
      attributes: nil
    )
    return encryptedFolderPath
  }
}

func doCatch(lambda: () throws -> Void) -> Error? {
  do {
    try lambda()
    return nil
  } catch {
    return error
  }
}
