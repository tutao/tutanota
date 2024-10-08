/* generated file, don't edit. */


import Foundation

public class FileFacadeReceiveDispatcher {
	let facade: FileFacade
	init(facade: FileFacade) {
		self.facade = facade
	}
	public func dispatch(method: String, arg: [String]) async throws -> String {
		switch method {
		case "open":
			let location = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let mimeType = try! JSONDecoder().decode(String.self, from: arg[1].data(using: .utf8)!)
			try await self.facade.open(
				location,
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
		case "deleteFile":
			let file = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			try await self.facade.deleteFile(
				file
			)
			return "null"
		case "getName":
			let file = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let result = try await self.facade.getName(
				file
			)
			return toJson(result)
		case "getMimeType":
			let file = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let result = try await self.facade.getMimeType(
				file
			)
			return toJson(result)
		case "getSize":
			let file = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let result = try await self.facade.getSize(
				file
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
			let result = try await self.facade.upload(
				fileUrl,
				targetUrl,
				method,
				headers
			)
			return toJson(result)
		case "download":
			let sourceUrl = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let filename = try! JSONDecoder().decode(String.self, from: arg[1].data(using: .utf8)!)
			let headers = try! JSONDecoder().decode([String : String].self, from: arg[2].data(using: .utf8)!)
			let result = try await self.facade.download(
				sourceUrl,
				filename,
				headers
			)
			return toJson(result)
		case "hashFile":
			let fileUri = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let result = try await self.facade.hashFile(
				fileUri
			)
			return toJson(result)
		case "clearFileData":
			try await self.facade.clearFileData(
			)
			return "null"
		case "joinFiles":
			let filename = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let files = try! JSONDecoder().decode([String].self, from: arg[1].data(using: .utf8)!)
			let result = try await self.facade.joinFiles(
				filename,
				files
			)
			return toJson(result)
		case "splitFile":
			let fileUri = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let maxChunkSizeBytes = try! JSONDecoder().decode(Int.self, from: arg[1].data(using: .utf8)!)
			let result = try await self.facade.splitFile(
				fileUri,
				maxChunkSizeBytes
			)
			return toJson(result)
		case "writeDataFile":
			let file = try! JSONDecoder().decode(DataFile.self, from: arg[0].data(using: .utf8)!)
			let result = try await self.facade.writeDataFile(
				file
			)
			return toJson(result)
		case "readDataFile":
			let filePath = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let result = try await self.facade.readDataFile(
				filePath
			)
			return toJson(result)
		default:
			fatalError("licc messed up! \(method)")
		}
	}
}
