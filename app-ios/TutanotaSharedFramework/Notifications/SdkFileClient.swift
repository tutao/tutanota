import Foundation
import tutasdk

public class SdkFileClient: FileClient {
	public init() {}
	// If anything is injected into RustSdk,
	// all of the interaction with that component should always return error compatible to rust's
	// Result::E type. Throwing any other class of Error, uniffi wont be able to convert to Rust Error type
	// and thread will panic in uniffi layer
	private func mapExceptionToError(e: Error) -> FileClientError {
		// currently we are not aware of all the exception thrown and we also do not need specific info for FileClient,
		// Improvement idea would be to check `e` and convert it to correct error type
		// See: SdkFileClient.kt ( kotlin )
		TUTSLog("Exception in SdkFileClient: \(e). Assuming .Unknown")
		return FileClientError.Unknown
	}

	public func persistContent(name: String, content: Data) async throws {
		do {
			let supportDir = try FileUtils.getApplicationSupportFolder()
			let filePath = supportDir.appendingPathComponent(name)
			let fileUrl = URL(fileURLWithPath: filePath.path)
			try content.write(to: fileUrl, options: .atomic)
		} catch { throw mapExceptionToError(e: error) }
	}

	public func readContent(name: String) async throws -> Data {
		do {
			let supportDir = try FileUtils.getApplicationSupportFolder()
			let filePath = supportDir.appendingPathComponent(name)
			let fileUrl = URL(fileURLWithPath: filePath.path)
			return try Data(contentsOf: fileUrl)
		} catch { throw mapExceptionToError(e: error) }
	}
}
