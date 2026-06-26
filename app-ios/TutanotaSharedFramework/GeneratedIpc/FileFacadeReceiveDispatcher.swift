/* generated file, don't edit. */


import Foundation

public final class FileFacadeReceiveDispatcher: Sendable {
	let facade: any FileFacade
	init(facade: any FileFacade) {
		self.facade = facade
	}
	public func dispatch(method: String, arg: [String]) async throws -> String {
		switch method {
		case "open":
			let fileUrl = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let mimeType = try! JSONDecoder().decode(String.self, from: arg[1].data(using: .utf8)!)
			try await self.facade.open(
				fileUrl,
				mimeType
			)
			return "null"
		case "openFileChooser":
			let boundingRect = try! JSONDecoder().decode(IpcClientRect.self, from: arg[0].data(using: .utf8)!)
			let filter = try! JSONDecoder().decode([String]?.self, from: arg[1].data(using: .utf8)!)
			let isFileOnly = try! JSONDecoder().decode(Bool?.self, from: arg[2].data(using: .utf8)!)
			let result = try await self.facade.openFileChooser(
				boundingRect,
				filter,
				isFileOnly
			)
			return toJson(result)
		case "openFolderChooser":
			let result = try await self.facade.openFolderChooser(
			)
			return toJson(result)
		case "openMacImportFileChooser":
			let result = try await self.facade.openMacImportFileChooser(
			)
			return toJson(result)
		case "deleteFile":
			let fileUrl = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			try await self.facade.deleteFile(
				fileUrl
			)
			return "null"
		case "getName":
			let fileUrl = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let result = try await self.facade.getName(
				fileUrl
			)
			return toJson(result)
		case "getMimeType":
			let fileUrl = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let result = try await self.facade.getMimeType(
				fileUrl
			)
			return toJson(result)
		case "getSize":
			let fileUrl = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let result = try await self.facade.getSize(
				fileUrl
			)
			return toJson(result)
		case "putFileIntoDownloadsFolder":
			let localFileUri = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let fileNameToUse = try! JSONDecoder().decode(String.self, from: arg[1].data(using: .utf8)!)
			let result = try await self.facade.putFileIntoDownloadsFolder(
				localFileUri,
				fileNameToUse
			)
			return toJson(result)
		case "upload":
			let fileUrl = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let targetUrl = try! JSONDecoder().decode(String.self, from: arg[1].data(using: .utf8)!)
			let method = try! JSONDecoder().decode(String.self, from: arg[2].data(using: .utf8)!)
			let headers = try! JSONDecoder().decode([String : String].self, from: arg[3].data(using: .utf8)!)
			let fileId = try! JSONDecoder().decode(String.self, from: arg[4].data(using: .utf8)!)
			let result = try await self.facade.upload(
				fileUrl,
				targetUrl,
				method,
				headers,
				fileId
			)
			return toJson(result)
		case "abortUpload":
			let fileId = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			try await self.facade.abortUpload(
				fileId
			)
			return "null"
		case "download":
			let sourceUrl = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let filename = try! JSONDecoder().decode(String.self, from: arg[1].data(using: .utf8)!)
			let headers = try! JSONDecoder().decode([String : String].self, from: arg[2].data(using: .utf8)!)
			let fileId = try! JSONDecoder().decode(String.self, from: arg[3].data(using: .utf8)!)
			let result = try await self.facade.download(
				sourceUrl,
				filename,
				headers,
				fileId
			)
			return toJson(result)
		case "abortDownload":
			let fileId = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			try await self.facade.abortDownload(
				fileId
			)
			return "null"
		case "hashFile":
			let fileUrl = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let result = try await self.facade.hashFile(
				fileUrl
			)
			return toJson(result)
		case "clearFileData":
			try await self.facade.clearFileData(
			)
			return "null"
		case "joinFiles":
			let filename = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let filePartsUrls = try! JSONDecoder().decode([String].self, from: arg[1].data(using: .utf8)!)
			let result = try await self.facade.joinFiles(
				filename,
				filePartsUrls
			)
			return toJson(result)
		case "openFileForReading":
			let fileUrl = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let result = try await self.facade.openFileForReading(
				fileUrl
			)
			return toJson(result)
		case "closeFile":
			let streamUrl = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			try await self.facade.closeFile(
				streamUrl
			)
			return "null"
		case "readChunk":
			let streamUrl = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let maxChunkSize = try! JSONDecoder().decode(Int.self, from: arg[1].data(using: .utf8)!)
			let result = try await self.facade.readChunk(
				streamUrl,
				maxChunkSize
			)
			return toJson(result)
		case "writeTempDataFile":
			let file = try! JSONDecoder().decode(DataFile.self, from: arg[0].data(using: .utf8)!)
			let result = try await self.facade.writeTempDataFile(
				file
			)
			return toJson(result)
		case "writeToAppDir":
			let content = try! JSONDecoder().decode(DataWrapper.self, from: arg[0].data(using: .utf8)!)
			let name = try! JSONDecoder().decode(String.self, from: arg[1].data(using: .utf8)!)
			try await self.facade.writeToAppDir(
				content,
				name
			)
			return "null"
		case "readFromAppDir":
			let name = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let result = try await self.facade.readFromAppDir(
				name
			)
			return toJson(result)
		case "deleteFromAppDir":
			let name = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			try await self.facade.deleteFromAppDir(
				name
			)
			return "null"
		case "readDataFile":
			let fileUrl = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let result = try await self.facade.readDataFile(
				fileUrl
			)
			return toJson(result)
		case "readDirectory":
			let directoryUrl = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let result = try await self.facade.readDirectory(
				directoryUrl
			)
			return toJson(result)
		default:
			fatalError("licc messed up! \(method)")
		}
	}
}
