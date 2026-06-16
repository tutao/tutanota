//
//  Created by Tutao GmbH on 9/16/21.
//

import CryptoKit
import Foundation

/**
 Functions for working with larger files from Blob Store
 */
public class BlobUtil {
	let tempFs: TempFs
	public init(tempFs: TempFs) { self.tempFs = tempFs }
	public func hashFile(fileUri: String) async throws -> String {
		let data = try await self.tempFs.readAsData(uri: fileUri)

		let hash = Data(CryptoKit.SHA256.hash(data: data)).subdata(in: 0..<6)
		return hash.base64EncodedString()
	}

	public func joinFiles(fileName: String, fileUrlsToJoin: [String]) async throws -> String {
		let decryptedDir = try! FileUtils.getDecryptedFolder() as NSString
		let outputFilePath = decryptedDir.appendingPathComponent(fileName)
		let outputFileUri = URL(fileURLWithPath: outputFilePath)

		let createdFile = FileManager.default.createFile(atPath: outputFilePath, contents: nil, attributes: nil)
		guard createdFile else { throw FileError(message: "Could not create file \(outputFileUri)") }
		let outputFileHandle = try! FileHandle(forWritingTo: outputFileUri)

		for inputFile in fileUrlsToJoin {
			let fileUri = URL(string: inputFile)!

			let fileContent = try await self.tempFs.readAsData(uri: inputFile)
			outputFileHandle.write(fileContent)
			try FileUtils.delete(file: fileUri)
		}
		return URL(fileURLWithPath: outputFilePath).absoluteString
	}
}
