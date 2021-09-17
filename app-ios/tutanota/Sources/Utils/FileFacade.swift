import Foundation
import MobileCoreServices

class FileFacade {
  private let chooser: TUTFileChooser
  private let viewer: FileViewer
  
  init(chooser: TUTFileChooser, viewer: FileViewer) {
    self.chooser = chooser
    self.viewer = viewer
  }
  
  func openFileChooser(anchor: CGRect, completion: @escaping ResponseCallback<[String]>) {
    self.chooser.open(withAnchorRect: anchor, completion: completion)
  }
  
  func openFile(path: String, completion: @escaping () -> Void) {
    self.viewer.openFile(path: path, completion: completion)
  }
  
  func openFile(name: String, data: Data, completion: @escaping  (Error?) -> Void) {
    do {
      let decryptedFolder = try FileUtils.getDecryptedFolder()
      let filePath = (decryptedFolder as NSString).appendingPathComponent(name)
      let fileURL = FileUtils.urlFromPath(path: filePath)
      try data.write(to: fileURL, options: .atomic)
      self.openFile(path: filePath) {
        let deleteError = doCatch {
          try FileManager.default.removeItem(atPath: filePath)
        }
        completion(deleteError)
      }
    } catch {
      completion(error)
    }
  }
  
  func deleteFile(path: String, completion: @escaping (Error?) -> Void) {
    DispatchQueue.global(qos: .default).async {
      let error = doCatch {
        try FileManager.default.removeItem(atPath: path)
      }
      completion(error)
    }
  }
  
  func getName(path: String, completion: @escaping ResponseCallback<String>) {
    DispatchQueue.global(qos: .default).async {
      let fileName = (path as NSString).lastPathComponent
      if FileUtils.fileExists(atPath: path) {
        completion(.success(fileName))
      } else {
        let error = TUTErrorFactory.createError(
          withDomain: FILES_ERROR_DOMAIN,
          message: "File does not exists"
        )
        completion(.failure(error))
      }
    }
  }
  
  func getMimeType(path: String, completion: @escaping ResponseCallback<String>) {
    DispatchQueue.global(qos: .default).async {
      let mimeType = self.getFileMIMEType(path: path) ?? "application/octet-stream"
      completion(.success(mimeType))
    }
  }
  
  func getSize(path: String, completion: @escaping ResponseCallback<UInt64>) {
    DispatchQueue.global(qos: .default).async {
      do {
        let attrs = try FileManager.default.attributesOfItem(atPath: path)
        completion(.success((attrs[.size] as! UInt64)))
      } catch {
        completion(.failure(error))
      }
    }
  }
  
  func uploadFile(
    atPath path: String,
    toUrl url: String,
    withHeaders headers: [String : String],
    completion: @escaping ResponseCallback<DataTaskResponse>
  ) {
    DispatchQueue.global(qos: .default).async {
      let url = URL(string: url)!
      var request = URLRequest(url: url)
      request.httpMethod = "PUT"
      request.setValue("application/octet-stream", forHTTPHeaderField: "Content-Type")
      request.allHTTPHeaderFields = headers
      
      let session = URLSession(configuration: .ephemeral)
      
      let fileUrl = FileUtils.urlFromPath(path: path)
      let task = session.uploadTask(with: request, fromFile: fileUrl) { data, response, error in
        if let error = error {
          completion(.failure(error))
          return
        }
        let httpResponse = response as! HTTPURLResponse
        let apiResponse = DataTaskResponse(httpResponse: httpResponse, encryptedFileUri: nil)
        completion(.success(apiResponse))
      }
      task.resume()
    }
  }
  
  func downloadFile(
    fromUrl url: String,
    forName fileName: String,
    withHeaders headers: [String : String],
    completion: @escaping ResponseCallback<DataTaskResponse>
  ) {
    DispatchQueue.global(qos: .default).async {
      let url = URL(string: url)!
      var request = URLRequest(url: url)
      request.httpMethod = "GET"
      request.allHTTPHeaderFields = headers
      
      let session = URLSession(configuration: .ephemeral)
      let task = session.dataTask(with: request) { data, response, error in
        if let error = error {
          completion(.failure(error))
          return
        }
        let httpResponse = response as! HTTPURLResponse
        let encryptedFileUri: String?
        if httpResponse.statusCode == 200 {
          do {
            encryptedFileUri = try self.writeEncryptedFile(fileName: fileName, data: data!)
          } catch {
            completion(.failure(error))
            return
          }
        } else {
          encryptedFileUri = nil
        }
        let responseDict = DataTaskResponse(httpResponse: httpResponse, encryptedFileUri: encryptedFileUri)
        completion(.success(responseDict))
      }
      task.resume()
    }
  }
  
  func clearFileData(completion: @escaping (Error?) -> Void) {
    DispatchQueue.global(qos: .default).async {
      let error = doCatch {
        try self.clearDirectory(folderPath: FileUtils.getEncryptedFolder())
        try self.clearDirectory(folderPath: FileUtils.getDecryptedFolder())
        try self.clearDirectory(folderPath: NSTemporaryDirectory())
      }
      completion(error)
    }
  }
  
  private func clearDirectory(folderPath: String) throws {
    let fileManager = FileManager.default
    let folderUrl = FileUtils.urlFromPath(path: folderPath)
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
    try data.write(to: FileUtils.urlFromPath(path: filePath), options: .atomicWrite)
    return filePath
  }
}

/// Data from Upload/Download tasks
struct DataTaskResponse {
  let statusCode: Int
  let errorId: String?
  let preconditionHeader: String?
  let time: String?
  let encryptedFileUri: String?
}

extension DataTaskResponse : Codable {}

extension DataTaskResponse {
  init(httpResponse: HTTPURLResponse, encryptedFileUri: String?) {
    self.init(
      statusCode: httpResponse.statusCode,
      errorId: httpResponse.allHeaderFields["Error-Id"] as! String?,
      preconditionHeader: httpResponse.allHeaderFields["Precondition"] as! String?,
      time:
        httpResponse.allHeaderFields["Retry-After"] as! String? ?? httpResponse.allHeaderFields["Suspention-Time"] as! String?,
      encryptedFileUri: encryptedFileUri
    )
  }
}
