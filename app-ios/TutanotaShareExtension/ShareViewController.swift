import Social
import TutanotaSharedFramework
import UIKit
import WebKit

/// annotation is necessary to be able to specify this class in Info.plist as the main UI controller
@objc(ShareViewController) class ShareViewController: UIViewController {

	/// This is the first function that gets called when the extension is selected from the share sheet.
	override func viewDidAppear(_ animated: Bool) {
		super.viewDidAppear(animated)
		guard let items = self.extensionContext?.inputItems as? [NSExtensionItem] else {
			TUTSLog("did not receive input items")
			self.extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
			return
		}

		let flatAttachments: [NSItemProvider] = (items.compactMap { $0.attachments }).flatMap { $0 }

		Task {
			do {
				let loadedAttachments: [SharedItem] = (await flatAttachments.asyncMap { await loadSharedAttachment($0) }).compactMap { $0 }
				var info = SharingInfo(identifier: getUniqueInfoLocation(), text: "", fileUrls: [])

				for attachment in loadedAttachments {
					TUTSLog("attachment type: \(attachment.ident())")
					switch attachment {
					case .fileUrl(ident: _, let content): info.fileUrls.append(content)
					case .image(ident: _, content: let content):
						guard let imageURL = await saveUIImage(subdir: info.identifier, image: content) else {
							TUTSLog("failed to save image, skipping")
							continue
						}
						info.fileUrls.append(imageURL)
					case .text(ident: _, let content): info.text = info.text.appending(content).appending("\n")
					case .contact(ident: _, let content):
						guard let vcardUrl = await saveVCard(subdir: info.identifier, vcardText: content) else {
							TUTSLog("failed to save contact, skipping")
							continue
						}
						info.fileUrls.append(vcardUrl)
					}
				}

				info.fileUrls = try await copyToSharedStorage(subdir: info.identifier, fileUrls: info.fileUrls)
				try writeSharingInfo(info: info, infoLocation: info.identifier)
				openMainAppWithOpenUrl(info.identifier)
			} catch { TUTSLog("Error while sharing: \(error)") }
		}
	}

	/// save a UI image we got shared as a png into shared storage so we can attach it to a mail
	func saveUIImage(subdir: String, image: UIImage) async -> URL? {
		guard let pngData = image.pngData() else {
			TUTSLog("could not get png data from UIImage")
			return nil
		}
		let imageName = generateImageFileName(imageData: pngData)
		return try? writeToSharedStorage(subdir: subdir, name: imageName, content: pngData)
	}

	/// when the IOS contact app shares contact, it gives us the VCARD text. we need to write it to disk to be able to
	/// attach it.
	/// returns the path to the persisted .vcf file containing the vcard
	func saveVCard(subdir: String, vcardText: String) async -> URL? {
		// Note: we could append them and write once at the end, multiple vcards per file are legal.
		guard let convertedData = vcardText.data(using: .utf8) else {
			TUTSLog("could not convert vcard text to utf8")
			return nil
		}
		let vcardName: String = extractFNfrom(vcard: vcardText)
		return try? writeToSharedStorage(subdir: subdir, name: vcardName.appending(".vcf"), content: convertedData)
	}

	private func openMainAppWithOpenUrl(_ infoLocation: String) {
		var components = URLComponents()
		components.scheme = self.selectAppSchema()
		components.host = infoLocation
		self.extensionContext?
			.completeRequest(returningItems: nil) { (_: Bool) in
				guard let url = components.url else {
					TUTSLog("failed to build URL for sharing with \(infoLocation)")
					return
				}
				_ = self.openURL(url)
			}
	}

	private func selectAppSchema() -> String {
		let bundleId = Bundle.main.bundleIdentifier
		if let isCalendarApp = bundleId?.contains("calendar") { return CALENDAR_SHARE_SCHEME }

		return TUTANOTA_SHARE_SCHEME
	}

	@objc func openURL(_ url: URL) -> Bool {
		var responder: UIResponder? = self
		while responder != nil {
			if let application = responder as? UIApplication {
				let result = application.perform(#selector(openURL(_:)), with: url)
				return result != nil
			}
			responder = responder?.next
		}
		return false
	}
}

/// decodes the type of a NSItemProvider and returns the data that can be used to set up sharing that item with the main app
@MainActor func loadSharedAttachment(_ attachment: NSItemProvider) async -> SharedItem? {
	for registeredTypeIdentifier in attachment.registeredTypeIdentifiers {
		if let loadedItem = await loadSharedItemWith(ident: registeredTypeIdentifier, fromAttachment: attachment) { return loadedItem } else { continue }
	}
	return nil
}

/// async version of map, awaiting each async result in the collection
/// before starting on the next one.
fileprivate extension Sequence {
	func asyncMap<T>(_ transform: (Element) async throws -> T) async rethrows -> [T] {
		var values = [T]()

		for element in self { try await values.append(transform(element)) }

		return values
	}
}
