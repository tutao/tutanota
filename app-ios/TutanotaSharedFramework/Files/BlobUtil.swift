//
//  Created by Tutao GmbH on 9/16/21.
//

import CryptoKit
import Foundation

/**
 Functions for working with larger files from Blob Store
 */
public class BlobUtil {
	public init() {}
	public func hashFile(fileUri: String) async throws -> String {
		let url = URL(fileURLWithPath: fileUri)
		let data = try Data(contentsOf: url)

		let hash = Data(CryptoKit.SHA256.hash(data: data)).subdata(in: 0..<6)
		return hash.base64EncodedString()
	}

	public func joinFiles(fileName: String, filePathsToJoin: [String]) async throws -> String {
		let decryptedDir = try! FileUtils.getDecryptedFolder() as NSString
		let outputFilePath = decryptedDir.appendingPathComponent(fileName)
		let outputFileUri = URL(fileURLWithPath: outputFilePath)

		let createdFile = FileManager.default.createFile(atPath: outputFilePath, contents: nil, attributes: nil)
		guard createdFile else { throw TUTErrorFactory.createError("Could not create file \(outputFileUri)") }
		let outputFileHandle = try! FileHandle(forWritingTo: outputFileUri)

		for inputFile in filePathsToJoin {
			let fileUri = URL(fileURLWithPath: inputFile)

			let fileContent = try Data(contentsOf: fileUri)
			outputFileHandle.write(fileContent)
		}
		return outputFilePath
	}

	public func splitFile(fileUri: String, maxBlobSize: Int) async throws -> [String] {
		let fileHandle = FileHandle(forReadingAtPath: fileUri)
		if fileHandle == nil { throw TUTErrorFactory.createError("Tried to attach invalid file: \(fileUri)") }

		var result = [String]()
		while true {
			let chunk = fileHandle!.readData(ofLength: maxBlobSize)

			if chunk.isEmpty {
				// End of file
				break
			}

			let hash = Data(CryptoKit.SHA256.hash(data: chunk))
			let outputFileName = "\(TUTEncodingConverter.bytes(toHex: hash.subdata(in: 0..<6))).blob"
			let decryptedDir = try! FileUtils.getDecryptedFolder() as NSString
			let outputPath = decryptedDir.appendingPathComponent(outputFileName)
			let outputUrl = URL(fileURLWithPath: outputPath)
			try chunk.write(to: outputUrl)

			result.append(outputPath)
		}
		return result
	}
}
