//
//  Created by Tutao GmbH on 9/16/21.
//

import Foundation

/**
 Functions for working with larger files from Blob Store
 */
class BlobUtil {

  func hashFile(fileUri: String, completion: @escaping ResponseCallback<String>) {
    DispatchQueue.global(qos: .userInitiated).async {
      let url = URL(fileURLWithPath: fileUri)
      let data: Data
      do {
        data = try Data(contentsOf: url)
      } catch {
        completion(.failure(error))
        return
      }
      let hash = TUTCrypto.sha256(data).subdata(in: 0..<6)
      completion(.success(hash.base64EncodedString()))
    }
  }

  func joinFiles(fileName: String, filePathsToJoin: [String], completion: @escaping ResponseCallback<String>) {
    DispatchQueue.global(qos: .userInitiated).async {
      let decryptedDir = try! FileUtils.getDecryptedFolder() as NSString
      let outputFilePath = decryptedDir.appendingPathComponent(fileName)
      let outputFileUri = URL(fileURLWithPath: outputFilePath)

      let createdFile = FileManager.default.createFile(atPath: outputFilePath, contents: nil, attributes: nil)
      guard createdFile else {
        completion(.failure(TUTErrorFactory.createError("Could not create file \(outputFileUri)")))
        return
      }
      let outputFileHandle = try! FileHandle(forWritingTo: outputFileUri)

      for inputFile in filePathsToJoin {
        let fileUri = URL(fileURLWithPath: inputFile)
        do {
          let fileContent = try Data(contentsOf: fileUri)
          outputFileHandle.write(fileContent)
        } catch {
          completion(.failure( error))
          return
        }
      }
      completion(.success(outputFilePath))
    }
  }


  func splitFile(fileUri: String, maxBlobSize: Int, completion: @escaping  ResponseCallback<[String]> ) {
    DispatchQueue.global(qos: .userInitiated).async {
      let fileHandle = FileHandle(forReadingAtPath: fileUri)!
      var result = [String]()
      while true {
        let chunk = fileHandle.readData(ofLength: maxBlobSize)

        if chunk.isEmpty {
          // End of file
          break
        }

        let hash = TUTCrypto.sha256(chunk)
        let outputFileName = "\(TUTEncodingConverter.bytes(toHex: hash.subdata(in: 0..<6))).blob"
        let decryptedDir = try! FileUtils.getDecryptedFolder() as NSString
        let outputPath = decryptedDir.appendingPathComponent(outputFileName)
        let outputUrl = URL(fileURLWithPath: outputPath)
        do {
          try chunk.write(to: outputUrl)
        } catch {
          completion( .failure(error))
          return
        }
        result.append(outputPath)
      }
      completion(.success(result))
    }
  }

}
