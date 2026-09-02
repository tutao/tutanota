/* generated file, don't edit. */


import Foundation

public final class ArchiveDownloaderFacadeReceiveDispatcher: Sendable {
	let facade: any ArchiveDownloaderFacade
	init(facade: any ArchiveDownloaderFacade) {
		self.facade = facade
	}
	public func dispatch(method: String, arg: [String]) async throws -> String {
		switch method {
		case "downloadAndStoreArchive":
			let sourceUrl = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let archiveId = try! JSONDecoder().decode(String.self, from: arg[1].data(using: .utf8)!)
			let typeref = try! JSONDecoder().decode(String.self, from: arg[2].data(using: .utf8)!)
			let modelVersion = try! JSONDecoder().decode(Int.self, from: arg[3].data(using: .utf8)!)
			try await self.facade.downloadAndStoreArchive(
				sourceUrl,
				archiveId,
				typeref,
				modelVersion
			)
			return "null"
		case "abortDownloadAndStoreArchive":
			let archive = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			try await self.facade.abortDownloadAndStoreArchive(
				archive
			)
			return "null"
		case "clearStoredArchives":
			try await self.facade.clearStoredArchives(
			)
			return "null"
		default:
			fatalError("licc messed up! \(method)")
		}
	}
}
