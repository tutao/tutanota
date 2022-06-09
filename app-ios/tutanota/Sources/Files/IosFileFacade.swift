import Foundation
import MobileCoreServices

class IosFileFacade : FileFacade {
  func writeFile(_ file: String, _ contentB64: String) async throws {
    let fileURL = URL(fileURLWithPath: file)
    let data = Data(base64Encoded: contentB64)!
    try data.write(to: fileURL, options: .atomic)
  }
  
  func readFile(_ file: String) async throws -> String {
    let data = try Data(contentsOf: URL(string: file)!)
    return data.base64EncodedString()
  }
  
  let chooser: TUTFileChooser
  let viewer: FileViewer
  
  init(
    chooser: TUTFileChooser,
    viewer: FileViewer
  ) {
    self.chooser = chooser
    self.viewer = viewer
  }
  
  func open(_ location: String, _ mimeType: String) async throws {
      await self.viewer.openFile(path: location)
  }
  
  func openFileChooser(_ boundingRect: IpcClientRect) async throws -> [String] {
    let anchor = CGRect(x: boundingRect.x, y: boundingRect.y, width: boundingRect.width, height: boundingRect.height)
    return try await self.chooser.open(withAnchorRect: anchor)
  }
 
  func deleteFile(_ file: String) async throws {
      try FileManager.default.removeItem(atPath: file)
  }
  
  func getName(_ file: String) async throws -> String {
    let fileName = (file as NSString).lastPathComponent
    if FileUtils.fileExists(atPath: file) {
      return fileName
    } else {
      throw TUTErrorFactory.createError(
        withDomain: FILES_ERROR_DOMAIN,
        message: "File does not exists"
      )
    }
  }
  
  func getMimeType(_ file: String) async throws -> String {
      return getFileMIMEType(path: file) ?? "application/octet-stream"
  }
  
  func getSize(_ file: String) async throws -> Int {
    let attrs = try FileManager.default.attributesOfItem(atPath: file)
    let size = attrs[.size] as! UInt64
    // Technically we shouldn't do this but we are always running on 64bit devices and
    // max Int64 number (even signed) is pretty huge so this is safe.
    // If we somehow overflow we will actually crash.
    return Int(size)
  }
  
  func putFileIntoDownloadsFolder(_ localFileUri: String) async throws -> String {
    fatalError("TODO")
  }
  
  func upload(_ sourceFileUrl: String, _ remoteUrl: String, _ method: String, _ headers: [String : String]) async throws -> UploadTaskResponse {
    // async upload is iOS 15+
    return try await withCheckedThrowingContinuation { continuation in
      var request = URLRequest(url: URL(string: remoteUrl)!)
      request.httpMethod = method
      request.setValue("application/octet-stream", forHTTPHeaderField: "Content-Type")
      request.allHTTPHeaderFields = headers

      // session has a default request timeout of 60 seconds for new data (configuration.timeoutIntervalForRequest)
      // the overall timeout for the task (w retries) is 7 days (configuration.timeoutIntervalForResource)
      let session = URLSession(configuration: .ephemeral)

      let task = session.uploadTask(with: request, fromFile: URL(fileURLWithPath: sourceFileUrl)) { data, response, error in
        if let error = error {
          continuation.resume(with: .failure(error))
          return
        }
        let httpResponse = response as! HTTPURLResponse
        let base64Response = data!.base64EncodedString()
        let apiResponse = UploadTaskResponse(httpResponse: httpResponse, responseBody: base64Response)

        continuation.resume(with: .success(apiResponse))
      }
      task.resume()
    }
  }
  
  func download(_ sourceUrl: String, _ filename: String, _ headers: [String : String]) async throws -> DownloadTaskResponse {
        return try await withCheckedThrowingContinuation { continuation in
          DispatchQueue.global(qos: .default).async {
            let url1 = URL(string: sourceUrl)!
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
                  encryptedFileUri = try self.writeEncryptedFile(fileName: filename, data: data!)
                } catch {
                  continuation.resume(with: .failure(error))
                  return
                }
              } else {
                encryptedFileUri = nil
              }
              let responseDict = DownloadTaskResponse(httpResponse: httpResponse, encryptedFileUri: encryptedFileUri)
              continuation.resume(with: .success(responseDict))
            }
            task.resume()
          }
        }
      }

    private func writeEncryptedFile(fileName: String, data: Data) throws -> String {
      let encryptedPath = try FileUtils.getEncryptedFolder()
      let filePath = (encryptedPath as NSString).appendingPathComponent(fileName)
      try data.write(to: URL(fileURLWithPath: filePath), options: .atomicWrite)
      return filePath
    }
  func hashFile(_ fileUri: String) async throws -> String {
    return try await BlobUtil().hashFile(fileUri: fileUri)
  }
  
  func clearFileData() async throws {
    let _ = await (
      try self.clearDirectory(folderPath: FileUtils.getEncryptedFolder()),
      try self.clearDirectory(folderPath: FileUtils.getDecryptedFolder()),
      try self.clearDirectory(folderPath: NSTemporaryDirectory())
    )
  }
  
  func joinFiles(_ filename: String, _ files: [String]) async throws -> String {
    return try await BlobUtil().joinFiles(fileName: filename, filePathsToJoin: files)
  }
  
  func splitFile(_ fileUri: String, _ maxChunkSizeBytes: Int) async throws -> [String] {
    return try await BlobUtil().splitFile(fileUri: fileUri, maxBlobSize: maxChunkSizeBytes)
  }
  
  func saveDataFile(_ name: String, _ dataBase64: String) async throws -> String {
    let decryptedFolder = try FileUtils.getDecryptedFolder()
    let filePath = (decryptedFolder as NSString).appendingPathComponent(name)
    try await self.writeFile(filePath, dataBase64)
    return filePath
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
}

extension UploadTaskResponse {
  init(httpResponse: HTTPURLResponse, responseBody: String) {
    self.init(
      statusCode: httpResponse.statusCode,
      errorId: httpResponse.valueForHeaderField("Error-Id"),
      precondition: httpResponse.valueForHeaderField("Precondition"),
      suspensionTime: httpResponse.valueForHeaderField("Retry-After") ?? httpResponse.valueForHeaderField("Suspension-Time"),
      responseBody: responseBody
    )
  }
}

extension DownloadTaskResponse {
  init(httpResponse: HTTPURLResponse, encryptedFileUri: String?) {
    self.init(
      statusCode: httpResponse.statusCode,
      errorId: httpResponse.valueForHeaderField("Error-Id"),
      precondition: httpResponse.valueForHeaderField("Precondition"),
      suspensionTime: httpResponse.valueForHeaderField("Retry-After") ?? httpResponse.valueForHeaderField("Suspension-Time"),
      encryptedFileUri: encryptedFileUri
    )
  }
}

fileprivate func getFileMIMEType(path: String) -> String? {
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
