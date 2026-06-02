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
		guard createdFile else { throw FileError(message: "Could not create file \(outputFileUri)") }
		let outputFileHandle = try! FileHandle(forWritingTo: outputFileUri)

		for inputFile in filePathsToJoin {
			let fileUri = URL(fileURLWithPath: inputFile)

			let fileContent = try Data(contentsOf: fileUri)
			outputFileHandle.write(fileContent)
			try FileUtils.delete(file: fileUri)
		}
		return outputFilePath
	}

	public func splitFile(fileUri: String, maxBlobSize: Int) async throws -> [String] {
		let fileHandle = FileHandle(forReadingAtPath: fileUri)
		if fileHandle == nil { throw TUTErrorFactory.createError("Tried to attach invalid file: \(fileUri)") }
		let fileInfo = try getFileInfo(fileUri: URL(string: fileUri)!)
		let fileSize = fileInfo.size

		var chunkUris = [String]()
		var currentOffset: Int64 = 0
		while currentOffset < fileSize {
			let start = currentOffset
			let length = (start + Int64(maxBlobSize) > fileSize) ? fileSize - start : Int64(maxBlobSize)
			let chunkUri = try await self.tempFs.createFileChunkUri(fileUri: fileUri, start: start, length: length).absoluteString
			chunkUris.append(chunkUri)
			currentOffset = start + length
		}
		return chunkUris
	}
}
