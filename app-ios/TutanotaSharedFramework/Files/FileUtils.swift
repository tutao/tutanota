import Foundation
import UniformTypeIdentifiers

let SHARED_CONTENT_DIRNAME = "shared-content"
let ENCRYPTED_DIRNAME = "encrypted"
let DECRYPTED_DIRNAME = "decrypted"

public class FileUtils {

	/// temporary storage for encrypted files after download or before upload
	/// - Returns path to folder with encrypted content
	public static func getEncryptedFolder() throws -> String { try Self.makeTempDir(name: ENCRYPTED_DIRNAME) }

	/// temporary storage for decrypted files before displaying them or encrypting them
	/// - Returns path to folder with decrypted content
	public static func getDecryptedFolder() throws -> String { try Self.makeTempDir(name: DECRYPTED_DIRNAME) }

	public static func delete(file: URL) throws {
		do { try FileManager.default.removeItem(at: file) } catch {
			if (error as NSError).code == NSFileNoSuchFileError { return printLog("Tried to delete file \(file) that does not exist.") }
			throw FileError(message: "Failed to delete file \(file)", underlyingError: error)
		}
	}

	/// deletes the shared-content folder in the shared app group container recursively,
	/// removing any files that were copied there after bering shared by another app
	public static func deleteSharedStorage() throws {
		let sharedDir = try getAppGroupFolder()
		try FileManager.default.removeItem(at: sharedDir.appendingPathComponent(SHARED_CONTENT_DIRNAME))
		TUTSLog("deleted shared storage")
	}

	/// deletes a specific folder in the shared-content folder in the shared app group container recursively,
	/// removing any files that were copied there after bering shared by another app
	public static func deleteSharedStorage(subDir: String) throws {
		let sharedDir = try getAppGroupFolder()
		let dirToDelete = sharedDir.appendingPathComponent(SHARED_CONTENT_DIRNAME).appendingPathComponent(subDir)
		try FileManager.default.removeItem(atPath: dirToDelete.path)
		TUTSLog("deleted shared storage at \(sharedDir)")
	}
	public static func getApplicationSupportFolder() throws -> URL {
		let appSupportDirURL = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).last
		guard let appSupportDirURL else { throw FileError(message: "could not get application support directory URL") }
		try FileManager.default.createDirectory(at: appSupportDirURL, withIntermediateDirectories: true, attributes: nil)
		return appSupportDirURL
	}

	/// returns a path to a newly created (if nonexsistent) subdirectory in
	/// the shared storage for the app group, shared with the share extension
	static func ensureSharedStorage(inSubdir subdir: String) throws -> URL {
		let sharedDir = try getAppGroupFolder()
		let sharedSubdir = sharedDir.appendingPathComponent(SHARED_CONTENT_DIRNAME).appendingPathComponent(subdir)
		try FileManager.default.createDirectory(atPath: sharedSubdir.path, withIntermediateDirectories: true, attributes: nil)
		return sharedSubdir
	}

	static func getAppGroupFolder() throws -> URL {
		guard let sharedDir = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: getAppGroupName()) else {
			throw FileError(message: "could not get app group shared storage")
		}
		return sharedDir
	}

	/// check if the given path points to a file on the file system.
	/// the path must be an absolute path, not a file URL with file:// protocol.
	public static func fileExists(atPath path: String) -> Bool { FileManager.default.fileExists(atPath: path) }
	public static func fileExists(at url: URL) -> Bool { FileManager.default.fileExists(atPath: url.path(percentEncoded: false)) }

	private static func makeTempDir(name: String) throws -> String {
		let encryptedFolderPath = (NSTemporaryDirectory() as NSString).appendingPathComponent(name)
		try FileManager.default.createDirectory(atPath: encryptedFolderPath, withIntermediateDirectories: true, attributes: nil)
		return encryptedFolderPath
	}
}

public func getFileMIMETypeWithDefault(path: String) -> String { getFileMIMEType(path: path) ?? "application/octet-stream" }

public func getFileMIMEType(path: String) -> String? {
	let fileExtension = URL(fileURLWithPath: path).pathExtension
	return UTType(filenameExtension: fileExtension)?.preferredMIMEType
}

extension URL {
	func queryParameter(_ param: String) -> String? {
		if let components = URLComponents(string: self.absoluteString), let value = components.queryItems?.first(where: { $0.name == param })?.value {
			return value
		} else {
			return nil
		}
	}
	static func from(fileUrl: String) throws -> URL {
		guard let url = URL(string: fileUrl), url.scheme == "file" else { throw FileError(message: "not a file URL: \(fileUrl)") }
		return url
	}
}

func urlFromString(string: String) throws -> URL {
	guard let url = URL(string: string) else { throw FileError(message: "could not build URL object for: \(string)") }
	return url
}

struct FileError: TutanotaError {
	static let name: String = "de.tutao.tutashared.FileError"
	let message: String
	let underlyingError: (any Error)?
	init(message: String) {
		self.message = message
		self.underlyingError = nil
	}
	init(message: String, underlyingError: any Error) {
		self.message = message
		self.underlyingError = underlyingError
	}
}
