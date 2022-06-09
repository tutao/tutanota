/* generated file, don't edit. */


import Foundation

public class FileFacadeReceiveDispatcher {
	let facade: FileFacade
	init(facade: FileFacade) {
		self.facade = facade
	}
	func dispatch(method: String, arg: [String]) async throws -> Encodable {
		switch method {
		case "open":
			let location = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let mimeType = try! JSONDecoder().decode(String.self, from: arg[1].data(using: .utf8)!)
			try await self.facade.open(
				location,
				mimeType
			)
			return NullReturn()
		case "openFileChooser":
			let boundingRect = try! JSONDecoder().decode(IpcClientRect.self, from: arg[0].data(using: .utf8)!)
			return try await self.facade.openFileChooser(
				boundingRect
			)
		case "deleteFile":
			let file = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			try await self.facade.deleteFile(
				file
			)
			return NullReturn()
		case "getName":
			let file = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			return try await self.facade.getName(
				file
			)
		case "getMimeType":
			let file = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			return try await self.facade.getMimeType(
				file
			)
		case "getSize":
			let file = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			return try await self.facade.getSize(
				file
			)
		case "putFileIntoDownloadsFolder":
			let localFileUri = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			return try await self.facade.putFileIntoDownloadsFolder(
				localFileUri
			)
		case "upload":
			let fileUrl = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let targetUrl = try! JSONDecoder().decode(String.self, from: arg[1].data(using: .utf8)!)
			let method = try! JSONDecoder().decode(String.self, from: arg[2].data(using: .utf8)!)
			let headers = try! JSONDecoder().decode([String : String].self, from: arg[3].data(using: .utf8)!)
			return try await self.facade.upload(
				fileUrl,
				targetUrl,
				method,
				headers
			)
		case "download":
			let sourceUrl = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let filename = try! JSONDecoder().decode(String.self, from: arg[1].data(using: .utf8)!)
			let headers = try! JSONDecoder().decode([String : String].self, from: arg[2].data(using: .utf8)!)
			return try await self.facade.download(
				sourceUrl,
				filename,
				headers
			)
		case "hashFile":
			let fileUri = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			return try await self.facade.hashFile(
				fileUri
			)
		case "clearFileData":
			try await self.facade.clearFileData(
			)
			return NullReturn()
		case "joinFiles":
			let filename = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let files = try! JSONDecoder().decode([String].self, from: arg[1].data(using: .utf8)!)
			return try await self.facade.joinFiles(
				filename,
				files
			)
		case "splitFile":
			let fileUri = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let maxChunkSizeBytes = try! JSONDecoder().decode(Int.self, from: arg[1].data(using: .utf8)!)
			return try await self.facade.splitFile(
				fileUri,
				maxChunkSizeBytes
			)
		case "saveDataFile":
			let name = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let dataBase64 = try! JSONDecoder().decode(String.self, from: arg[1].data(using: .utf8)!)
			return try await self.facade.saveDataFile(
				name,
				dataBase64
			)
		case "writeFile":
			let file = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let contentB64 = try! JSONDecoder().decode(String.self, from: arg[1].data(using: .utf8)!)
			try await self.facade.writeFile(
				file,
				contentB64
			)
			return NullReturn()
		case "readFile":
			let file = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			return try await self.facade.readFile(
				file
			)
		default:
			fatalError("licc messed up! \(method)")
		}
	}
}
