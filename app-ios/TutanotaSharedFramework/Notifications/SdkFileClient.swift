import Foundation
import tutasdk

public class SdkFileClient: FileClient {
	public init() {}
	private func writeFile(_ file: String, _ content: Data) async throws {
		let fileURL = URL(fileURLWithPath: file)
		try content.write(to: fileURL, options: .atomic)
	}
	private func readFile(_ path: String) throws -> Data {
		let data = try Data(contentsOf: URL(fileURLWithPath: path))
		return data
	}
	public func persistContent(name: String, content: Data) async throws {
		let supportDir = try FileUtils.getApplicationSupportFolder()
		let filePath = supportDir.appendingPathComponent(name)
		try await self.writeFile(filePath.path, content)
	}
	public func readContent(name: String) async throws -> Data {
		let supportDir = try FileUtils.getApplicationSupportFolder()
		let filePath = supportDir.appendingPathComponent(name)
		return try self.readFile(filePath.path)
	}
}
