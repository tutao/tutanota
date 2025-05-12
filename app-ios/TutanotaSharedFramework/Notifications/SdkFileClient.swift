import Foundation
import tutasdk

public class SdkFileClient: FileClient {
	public init() {}
	private func writeFile(_ file: String, _ content: Data) async throws {
		let fileURL = URL(fileURLWithPath: file)
		try content.write(to: fileURL, options: .atomic)
	}
	private func readFile(_ path: String) throws -> Data {
		guard let data = try? Data(contentsOf: URL(fileURLWithPath: path)) else { throw FileClientError.NotFound }

		return data
	}
	public func persistContent(name: String, content: Data) async throws {
		guard let supportDir = try? FileUtils.getApplicationSupportFolder() else { throw FileClientError.NotFound }
		let filePath = supportDir.appendingPathComponent(name)
		try await self.writeFile(filePath.path, content)
	}
	public func readContent(name: String) async throws -> Data {
		guard let supportDir = try? FileUtils.getApplicationSupportFolder() else { throw FileClientError.NotFound }
		let filePath = supportDir.appendingPathComponent(name)
		return try self.readFile(filePath.path)
	}
}
