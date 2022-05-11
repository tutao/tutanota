import Foundation
import MobileCoreServices

class FileFacade {
  private let chooser: TUTFileChooser
  private let viewer: FileViewer

  init(chooser: TUTFileChooser, viewer: FileViewer) {
    self.chooser = chooser
    self.viewer = viewer
  }

  func openFileChooser(anchor: CGRect) async throws -> [String] {
    return try await self.chooser.open(withAnchorRect: anchor)
  }

  func openFile(path: String) async {
    await self.viewer.openFile(path: path)
  }

  func saveDataFile(name: String, data: Data) async throws -> String {
    let decryptedFolder = try FileUtils.getDecryptedFolder()
    let filePath = (decryptedFolder as NSString).appendingPathComponent(name)
    let fileURL = URL(fileURLWithPath: filePath)
    try data.write(to: fileURL, options: .atomic)
    return filePath
  }

  func deleteFile(path: String) async throws {
    try FileManager.default.removeItem(atPath: path)
  }

  func getName(path: String) async throws -> String {
    let fileName = (path as NSString).lastPathComponent
    if FileUtils.fileExists(atPath: path) {
      return fileName
    } else {
      throw TUTErrorFactory.createError(
        withDomain: FILES_ERROR_DOMAIN,
        message: "File does not exists"
      )
    }
  }

  func getMimeType(path: String) async throws -> String {
    return self.getFileMIMEType(path: path) ?? "application/octet-stream"
  }

  func getSize(path: String) async throws -> UInt64 {
    let attrs = try FileManager.default.attributesOfItem(atPath: path)
    return attrs[.size] as! UInt64
  }

  func uploadFile(
    atPath path: String,
    toUrl url: String,
    method: String,
    withHeaders headers: [String : String]) async throws -> DataTaskResponse {
      // async upload is iOS 15+
      return try await withCheckedThrowingContinuation { continuation in
        let url1 = URL(string: url)!
        var request = URLRequest(url: url1)
        request.httpMethod = method
        request.setValue("application/octet-stream", forHTTPHeaderField: "Content-Type")
        request.allHTTPHeaderFields = headers

        // session has a default request timeout of 60 seconds for new data (configuration.timeoutIntervalForRequest)
        // the overall timeout for the task (w retries) is 7 days (configuration.timeoutIntervalForResource)
        let session = URLSession(configuration: .ephemeral)

        let fileUrl = URL(fileURLWithPath: path)
        let task = session.uploadTask(with: request, fromFile: fileUrl) { data, response, error in
          if let error = error {
            continuation.resume(with: .failure(error))
            return
          }
          let httpResponse = response as! HTTPURLResponse
          let base64Response = data?.base64EncodedString()
          let apiResponse = DataTaskResponse(httpResponse: httpResponse, responseBody: base64Response)

          continuation.resume(with: .success(apiResponse))
        }
        task.resume()
      }
    }

  func downloadFile(
    fromUrl url: String,
    forName fileName: String,
    withHeaders headers: [String : String]) async throws -> DataTaskResponse {
      return try await withCheckedThrowingContinuation { continuation in
        DispatchQueue.global(qos: .default).async {
          let url1 = URL(string: url)!
          var request = URLRequest(url: url1)
          request.httpMethod = "GET"
          request.allHTTPHeaderFields = headers

          let session = URLSession(configuration: .ephemeral)
          let task = session.dataTask(with: request) { data, response, error in
            if let error = error {
              continuation.resume(with: .failure(error))
              return
            }
            let httpResponse = response as! HTTPURLResponse
            let encryptedFileUri: String?
            if httpResponse.statusCode == 200 {
              do {
                encryptedFileUri = try self.writeEncryptedFile(fileName: fileName, data: data!)
              } catch {
                continuation.resume(with: .failure(error))
                return
              }
            } else {
              encryptedFileUri = nil
            }
            let responseDict = DataTaskResponse(httpResponse: httpResponse, encryptedFileUri: encryptedFileUri)
            continuation.resume(with: .success(responseDict))
          }
          task.resume()
        }
      }
    }

  func clearFileData() async throws {
    let _ = await (
      try self.clearDirectory(folderPath: FileUtils.getEncryptedFolder()),
      try self.clearDirectory(folderPath: FileUtils.getDecryptedFolder()),
      try self.clearDirectory(folderPath: NSTemporaryDirectory())
    )
  }

  private func clearDirectory(folderPath: String) async throws {
    let fileManager = FileManager.default
    let folderUrl = URL(fileURLWithPath: folderPath)
    let files = try fileManager.contentsOfDirectory(at: folderUrl, includingPropertiesForKeys: nil, options: [])
    for file in files {
      if !file.hasDirectoryPath {
        try fileManager.removeItem(at: file)
      }
    }
  }

  private func getFileMIMEType(path: String) -> String? {
    // UTType is only available since iOS 15.
    // We take retainedValue because both functions create new object and we
    // are responsible for deallocating them.
    // see https://developer.apple.com/documentation/swift/imported_c_and_objective-c_apis/working_with_core_foundation_types
    // see https://developer.apple.com/library/archive/documentation/CoreFoundation/Conceptual/CFMemoryMgmt/Concepts/Ownership.html#//apple_ref/doc/uid/20001148
    let UTI = UTTypeCreatePreferredIdentifierForTag(
      kUTTagClassFilenameExtension,
      (path as NSString).pathExtension as CFString,
      nil
    )!.takeRetainedValue()
    let MIMEUTI = UTTypeCopyPreferredTagWithClass(UTI, kUTTagClassMIMEType)?.takeRetainedValue()
    return MIMEUTI as String?
  }

  private func writeEncryptedFile(fileName: String, data: Data) throws -> String {
    let encryptedPath = try FileUtils.getEncryptedFolder()
    let filePath = (encryptedPath as NSString).appendingPathComponent(fileName)
    try data.write(to: URL(fileURLWithPath: filePath), options: .atomicWrite)
    return filePath
  }
}

/// Data from Upload/Download tasks
struct DataTaskResponse {
  let statusCode: Int
  let errorId: String?
  let precondition: String?
  let suspensionTime: String?
  let encryptedFileUri: String?
  let responseBody: String?
}

extension DataTaskResponse : Codable {}

extension DataTaskResponse {
  init(httpResponse: HTTPURLResponse, encryptedFileUri: String?) {
    self.init(
      statusCode: httpResponse.statusCode,
      errorId: httpResponse.valueForHeaderField("Error-Id"),
      precondition: httpResponse.valueForHeaderField("Precondition"),
      suspensionTime: httpResponse.valueForHeaderField("Retry-After") ?? httpResponse.valueForHeaderField("Suspension-Time"),
      encryptedFileUri: encryptedFileUri,
      responseBody: nil
    )
  }

  init(httpResponse: HTTPURLResponse, responseBody: String?) {
    self.init(
      statusCode: httpResponse.statusCode,
      errorId: httpResponse.valueForHeaderField("Error-Id"),
      precondition: httpResponse.valueForHeaderField("Precondition"),
      suspensionTime: httpResponse.valueForHeaderField("Retry-After") ?? httpResponse.valueForHeaderField("Suspension-Time"),
      encryptedFileUri:nil,
      responseBody: responseBody
    )
  }

}



/// Reading header fields from HTTPURLResponse.allHeaderFields is case-sensitive, it is a bug: https://bugs.swift.org/browse/SR-2429
/// From iOS13 we have a method to read headers case-insensitively: HTTPURLResponse.value(forHTTPHeaderField:)
/// For older iOS we use this NSDictionary cast workaround as suggested by a commenter in the bug report.
public extension HTTPURLResponse {
    func valueForHeaderField(_ headerField: String) -> String? {
        if #available(iOS 13.0, *) {
            return value(forHTTPHeaderField: headerField)
        } else {
            return (allHeaderFields as NSDictionary)[headerField] as? String
        }
    }
}


