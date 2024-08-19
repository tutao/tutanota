import Foundation
import RegexBuilder
import UIKit

public let TUTANOTA_SHARE_SCHEME = "tutashare"
public let CALENDAR_SHARE_SCHEME = "tutacalshare"

/// this gets shared to the main app and contains all the info
/// to create a new mail & the cleanup
public struct SharingInfo: Codable {
	/// this is the key that the information is stored under in the
	/// UserDefaults and on disk
	public var identifier: String
	/// body text of new mail
	public var text: String
	/// files to attach
	public var fileUrls: [URL]

	public init(identifier: String, text: String, fileUrls: [URL]) {
		self.identifier = identifier
		self.text = text
		self.fileUrls = fileUrls
	}
}

/// different errors that can happen when trying to load, convert and write
/// shared items to the app group storage
public enum SharingError: Error {
	case failedToLoad
	case failedToWrite
	case failedToRead
}

/// different types of items are shared under different names
/// ident identifies the type, content the associated data
public enum SharedItem {
	case fileUrl(ident: String, content: URL)
	case image(ident: String, content: UIImage)
	case text(ident: String, content: String)
	case contact(ident: String, content: String)

	public func ident() -> String {
		switch self {
		case .fileUrl(ident: let ident, content: _), .text(ident: let ident, content: _), .contact(ident: let ident, content: _),
			.image(ident: let ident, content: _):
			return ident
		}
	}
}

/// there is a bunch of uniform type identifiers that can be set by the sharing app. it's not clear what's available,
/// but there are some constants defined available with "import UniformTypeIdentifiers".
/// note that these are mentioned explicitly in the info.plist of the extension
@MainActor public func loadSharedItemWith(ident: String, fromAttachment: NSItemProvider) async -> SharedItem? {
	switch ident {
	case "public.image"  // shared from e.g. Signal, no URL but image data
	: return await load(item: fromAttachment, ident: ident, andConvertWith: codingToImage)
	case "public.url",  // shared image from safari, shared link, shared pdf...
		"public.plain-text"  // shared from Notes, safari
		:
		return await load(item: fromAttachment, ident: ident, andConvertWith: codingToText)
	case "public.vcard"  // shared from contacts
	: return await load(item: fromAttachment, ident: ident, andConvertWith: codingToVCard)
	default: return await load(item: fromAttachment, ident: ident, andConvertWith: codingToUrl)
	}
}

@MainActor private func load(item attachment: NSItemProvider, ident: String, andConvertWith converter: (String, NSSecureCoding) -> SharedItem?) async
	-> SharedItem?
{
	guard let coding = try? await attachment.loadItem(forTypeIdentifier: ident, options: nil) else {
		TUTSLog("failed to load secure coding for \(ident)")
		return nil
	}
	return converter(ident, coding)
}

/// write a single file to a subdirectory in the shared storage of the app group
public func writeToSharedStorage(subdir: String, name: String, content: Data) throws -> URL {
	guard let sharedURL = try? FileUtils.ensureSharedStorage(inSubdir: subdir) else {
		TUTSLog("failed to ensure sharing directory for this request")
		throw SharingError.failedToWrite
	}

	let fileURL: URL = sharedURL.appendingPathComponent(name)
	do { try content.write(to: fileURL) } catch {
		TUTSLog("error writing file \(error)")
		throw SharingError.failedToWrite
	}
	return fileURL
}

/// take a list of file URLs (including file:// protocol) and copy them to the app group's storage
/// returning a new list of URLs pointing to the new locations
/// file URLs pointing to directories lead to zipped directories and are appended to the list
/// any files or directories that fail to be copied are ignored and omitted from the return value
public func copyToSharedStorage(subdir: String, fileUrls: [URL]) async throws -> [URL] {
	var newLocations: [URL] = []
	for fileUrl in fileUrls {
		let isDirectory: Bool = (try? fileUrl.resourceValues(forKeys: [.isDirectoryKey]))?.isDirectory == true
		if isDirectory {
			guard let newLocation = zipSharedStorageFile(fileUrl: fileUrl, subdir: subdir) else { continue }
			newLocations.append(newLocation)
		} else {
			guard let contentData = try? Data(contentsOf: fileUrl) else {
				TUTSLog("could not read file at \(fileUrl) to share")
				continue
			}
			let fileName = fileUrl.lastPathComponent
			guard let newLocation = try? writeToSharedStorage(subdir: subdir, name: fileName, content: contentData) else {
				TUTSLog("could not copy file at \(fileUrl) to share")
				continue
			}
			newLocations.append(newLocation)
		}
	}

	return newLocations
}

func zipSharedStorageFile(fileUrl: URL, subdir: String) -> URL? {
	var returnURL: URL?
	var error: NSError?
	NSFileCoordinator()
		.coordinate(readingItemAt: fileUrl, options: [.forUploading], error: &error) { (zipUrl) in
			guard let contentData = try? Data(contentsOf: zipUrl) else {
				TUTSLog("could not read directory at \(zipUrl) to share")
				return
			}
			let fileName = zipUrl.lastPathComponent
			guard let writeURL = try? writeToSharedStorage(subdir: subdir, name: fileName, content: contentData) else {
				TUTSLog("could not copy directory at \(zipUrl) to share")
				return
			}
			returnURL = writeURL
		}
	if error != nil { TUTSLog("could not read directory at \(fileUrl) to share due to \(error!)") }
	return returnURL
}

/// write the text and file paths for this share request to shared UserDefaults
public func writeSharingInfo(info: SharingInfo, infoLocation: String) throws {
	let encoder = JSONEncoder()
	encoder.outputFormatting = .prettyPrinted
	let jsonData = try encoder.encode(info)
	let defaults = try getSharedDefaults()
	defaults.set(jsonData, forKey: infoLocation)
}

/// read the information needed to create a mail editor from a share request
/// from the shared UserDefaults
public func readSharingInfo(infoLocation: String) -> SharingInfo? {
	guard let defaults = try? getSharedDefaults() else { return nil }
	defer { defaults.removeObject(forKey: infoLocation) }
	guard let data: Data = defaults.value(forKey: infoLocation) as! Data? else {
		TUTSLog("there are no sharingInfos to be found at \(infoLocation)")
		return nil
	}
	do { return try JSONDecoder().decode(SharingInfo.self, from: data) } catch {
		TUTSLog("could not decode sharingInfo from UserDefaults: \(error)")
		return nil
	}
}

private func getSharedDefaults() throws -> UserDefaults {
	let appGroupName = getAppGroupName()
	guard let defaults = UserDefaults(suiteName: appGroupName) else {
		let msg = "failed to get shared user defaults with suite \(appGroupName)"
		TUTSLog(msg)
		throw TUTErrorFactory.createError(msg)
	}

	return defaults
}

/// get a reasonably unique identifier for a sharing reuest to pass to the main app
public func getUniqueInfoLocation() -> String {

	// returns a timestamp derived from the kernel's monotonic clock in microseconds.
	// start time is arbitrary, does not increment while system is asleep.
	// may return duplicate values if the kernel time is reset (reboot?)
	let divisor: UInt64 = 1000
	let timestamp = clock_gettime_nsec_np(CLOCK_UPTIME_RAW) / divisor

	return String(timestamp)
}

func codingToUrl(_ ident: String, _ coding: NSSecureCoding) -> SharedItem? {
	guard let decodedURL: URL = (coding as? URL) ?? ((coding as? NSURL) as? URL) else {
		TUTSLog("could not convert coding \(String(describing: coding)) to URL")
		return nil
	}
	return .fileUrl(ident: ident, content: decodedURL)
}

func codingToImage(_ ident: String, _ coding: NSSecureCoding) -> SharedItem? {
	guard let uiImage = coding as? UIImage else {
		TUTSLog("could not convert coding to UIImage: \(String(describing: coding))")
		return nil
	}

	return .image(ident: ident, content: uiImage)
}

private func codingToText(_ ident: String, _ coding: NSSecureCoding) -> SharedItem? {
	guard let decodedText = coding as? String ?? (coding as? URL)?.absoluteString else {
		TUTSLog("could not convert coding \(String(describing: coding)) to String")
		return nil
	}

	return .text(ident: ident, content: decodedText)
}

private func codingToVCard(_ ident: String, _ coding: NSSecureCoding) -> SharedItem? {
	guard let vcardData = coding as? Data, let vcardString = String(data: vcardData, encoding: .utf8) else {
		TUTSLog("could not convert vcard to data: \(String(describing: coding))")
		return nil
	}

	return .contact(ident: ident, content: vcardString)
}

public func getAppGroupName() -> String {
	let bundleId = Bundle.main.bundleIdentifier
	let correctedBundleId = bundleId?.replacingOccurrences(of: "." + (Bundle.main.executableURL?.lastPathComponent ?? ""), with: "") ?? ""
	let groupName = "group." + correctedBundleId
	return groupName
}
