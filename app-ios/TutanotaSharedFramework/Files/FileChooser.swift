import Photos
public import PhotosUI
import UIKit

/// Utility class which shows pickers for files.
public class TUTFileChooser: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate, UIPopoverPresentationControllerDelegate,
	UIDocumentPickerDelegate
{
	private let sourceController: UIViewController
	private let imagePickerController: UIImagePickerController
	private let supportedUTIs: [String]
	private var resultHandler: ((sending Result<[String], any Error>) -> Void)?
	private let openSettings: () -> Void

	public init(viewController: UIViewController, openSettings: @escaping () -> Void) {
		supportedUTIs = ["public.content", "public.archive", "public.data"]
		sourceController = viewController
		self.openSettings = openSettings
		imagePickerController = UIImagePickerController()
		super.init()
		imagePickerController.delegate = self
	}

	/// Present a file picker.
	///
	/// - Parameter isFileOnly: if the picker should only allow files and not images/other media
	@MainActor public func open(withAnchorRect anchorRect: CGRect, isFileOnly: Bool) async throws -> [String] {
		if let previousHandler = resultHandler {
			TUTSLog("Another file picker is already open?")
			sourceController.dismiss(animated: true, completion: nil)
			previousHandler(.success([]))
		}

		if isFileOnly {
			// If we only want to browse files, open the file picker directly
			self.showFilePicker()
		} else {
			// Otherwise present a menu with options: camera, photos or picking file
			let controller = UIAlertController(title: nil, message: nil, preferredStyle: .actionSheet)
			controller.addAction(
				UIAlertAction(
					title: translate("TutaoChoosePhotosAction", default: "Photos"),
					style: .default,
					handler: { _ in self.showPhpicker(anchor: anchorRect) }
				)
			)
			if UIImagePickerController.isSourceTypeAvailable(.camera) {
				controller.addAction(
					UIAlertAction(title: translate("TutaoShowCameraAction", default: "Camera"), style: .default, handler: { _ in self.openCamera() })
				)
			}
			// FIXME: translate
			controller.addAction(UIAlertAction(title: "Pick file", style: .default, handler: { _ in self.showFilePicker() }))
			if UIDevice.current.userInterfaceIdiom == .pad {
				controller.modalPresentationStyle = .popover
				let popOverController = controller.popoverPresentationController
				popOverController?.sourceView = self.sourceController.view
				popOverController?.sourceRect = anchorRect
				popOverController?.delegate = self
			}
			sourceController.present(controller, animated: true)
		}
		return try await withCheckedThrowingContinuation { continuation in resultHandler = continuation.resume(with:) }
	}
	private func showFilePicker() {
		let filePicker = UIDocumentPickerViewController(forOpeningContentTypes: [UTType.content, UTType.archive, UTType.data], asCopy: true)
		filePicker.delegate = self
		sourceController.present(filePicker, animated: true)
	}

	private func showPhpicker(anchor: CGRect) {
		var configuration = PHPickerConfiguration(photoLibrary: PHPhotoLibrary.shared())
		configuration.selectionLimit = 0
		configuration.filter = .any(of: [.videos, .images])
		let picker = PHPickerViewController(configuration: configuration)
		picker.delegate = self
		sourceController.present(picker, animated: true, completion: nil)
	}

	private func openCamera() {
		self.imagePickerController.sourceType = .camera
		self.imagePickerController.mediaTypes = UIImagePickerController.availableMediaTypes(for: .camera) ?? []
		self.imagePickerController.modalPresentationStyle = .fullScreen
		self.imagePickerController.allowsEditing = false
		self.imagePickerController.showsCameraControls = true
		self.sourceController.present(self.imagePickerController, animated: true, completion: nil)
	}

	// from UIPopoverPresentationControllerDelegate
	public func popoverPresentationControllerDidDismissPopover(_ popoverPresentationController: UIPopoverPresentationController) { sendResult(filePath: nil) }

	public func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentAt url: URL) {
		copyFileToLocalFolderAndSendResult(srcUrl: url, filename: url.lastPathComponent)
	}

	// from UIDocumentPickerDelegate protocol
	public func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) { sendResult(filePath: nil) }

	// from UIImagePickerControllerDelegate protocol
	public func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
		// we have to copy the file into a folder of this app.
		let targetFolder: String
		do { targetFolder = try FileUtils.getDecryptedFolder() } catch {
			sendError(error: error)
			return
		}
		sourceController.dismiss(
			animated: true,
			completion: { [weak self] in
				guard let self else { return }
				if self.imagePickerController.sourceType == .camera {
					let mediaType = info[UIImagePickerController.InfoKey.mediaType] as! String
					if mediaType == "public.image" {  // Handle a still image capture
						let editedImage = info[UIImagePickerController.InfoKey.editedImage] as? UIImage
						let originalImage = info[UIImagePickerController.InfoKey.originalImage] as? UIImage
						let imageToSave: UIImage = editedImage ?? originalImage!
						let fileName = self.generateFileName(prefixString: "img", withExtension: "jpg")
						let filePath = URL(fileURLWithPath: targetFolder).appendingPathComponent(fileName)
						guard let imageData = imageToSave.jpegData(compressionQuality: 0.9) else {
							self.sendError(error: TUTErrorFactory.createError("Could not get image data from camera image"))
							return
						}
						do { try imageData.write(to: filePath, options: .atomic) } catch {
							self.sendError(error: TUTErrorFactory.createError("failed to save captured image to path \(filePath)"))
							return
						}
						self.sendResult(filePath: filePath.path)
					} else if mediaType == "public.movie" {  // Handle a movie capture
						let videoURL = info[UIImagePickerController.InfoKey.mediaURL] as! URL
						let fileName = self.generateFileName(prefixString: "movie", withExtension: "mp4")
						self.copyFileToLocalFolderAndSendResult(srcUrl: videoURL, filename: fileName)
					} else {
						self.sendError(error: TUTErrorFactory.createError(String(format: "Invalid media type %@", mediaType)))
					}
				}
			}
		)
	}

	// from UIImagePickerControllerDelegate protocol
	public func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
		sourceController.dismiss(animated: true) { [weak self] in self?.sendResult(filePath: nil) }
	}

	private func copyFileToLocalFolderAndSendResult(srcUrl: URL, filename: String) {
		do {
			let targetUrl = try copyToLocalFolder(srcUrl: srcUrl, filename: filename)
			sendResult(filePath: targetUrl.path)
		} catch {
			sendError(error: error)
			return
		}
	}

	nonisolated private func copyToLocalFolder(srcUrl: URL, filename: String) throws -> URL {
		let fileManager = FileManager.default
		let decryptedFolder: String = try FileUtils.getDecryptedFolder()

		// to avoid duplicates but preserve filenames, we can put everything in a subdirectory based on timestamp
		let targetFolder = URL(fileURLWithPath: decryptedFolder).appendingPathComponent(generateFileName(prefixString: "upload", withExtension: nil))
		if !fileManager.fileExists(atPath: targetFolder.path) { try fileManager.createDirectory(at: targetFolder, withIntermediateDirectories: false) }

		let targetUrl = targetFolder.appendingPathComponent(filename)

		// NSFileManager copyItemAtUrl returns an error if the file already exists. so delete it first.
		if fileManager.fileExists(atPath: targetUrl.path) { try? fileManager.removeItem(atPath: targetUrl.path) }

		try fileManager.copyItem(at: srcUrl, to: targetUrl)
		return targetUrl
	}

	nonisolated func generateFileName(prefixString: String, withExtension extensionString: String?) -> String {
		let time = Date()
		let df = DateFormatter()
		df.dateFormat = "hhmmss"
		let timeString = df.string(from: time)

		if let extensionString {
			return String(format: "%@_%@.%@", prefixString, timeString, extensionString)
		} else {
			return String(format: "%@_%@", prefixString, timeString)
		}
	}

	func sendResult(filePath: String?) {
		let paths = filePath.map { [$0] } ?? []
		sendMultipleResults(filePaths: paths)
	}

	func sendMultipleResults(filePaths: [String]) {
		resultHandler?(.success(filePaths))
		resultHandler = nil
	}

	func sendError(error: any Error) {
		resultHandler?(.failure(error))
		resultHandler = nil
	}

	func showPermissionDeniedDialog() {
		// User don't give us permission. Showing alert with redirection to settings
		let permissionTitle = "No permission"
		let permissionInfo = "To grant access you have to modify the permissions for this device"
		let settingsActionLabel = "Settings"
		let cancelActionLabel = "Cancel"

		let alertController = UIAlertController(title: permissionTitle, message: permissionInfo, preferredStyle: .alert)
		let cancelAction = UIAlertAction(title: cancelActionLabel, style: .cancel, handler: nil)
		alertController.addAction(cancelAction)

		let settingsAction = UIAlertAction(title: settingsActionLabel, style: .default) { _ in self.openSettings() }
		alertController.addAction(settingsAction)
		sourceController.present(alertController, animated: true, completion: nil)
		sendResult(filePath: nil)
	}

	/**
     * Replace ".heic" or ".heif" extensions with ".jpeg".
     */
	private func changeExtensionToJpeg(filename: URL) -> URL { filename.deletingPathExtension().appendingPathExtension("jpg") }
}

extension TUTFileChooser: PHPickerViewControllerDelegate {
	/**
        Invoked when user finished picking the files.
     */
	public func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
		picker.dismiss(animated: true, completion: nil)
		Task {
			var urls = [URL]()

			func requestFileOfType(result: PHPickerResult, type: String) async -> URL? {
				if result.itemProvider.hasItemConformingToTypeIdentifier(type) {
					return try? await withCheckedThrowingContinuation { cont in
						result.itemProvider.loadFileRepresentation(forTypeIdentifier: type) { (url, error) in
							if let error {
								cont.resume(throwing: error)
							} else {
								let copyResult = Result { try self.copyToLocalFolder(srcUrl: url!, filename: url!.lastPathComponent) }
								cont.resume(with: copyResult)
							}
						}
					}
				} else {
					return nil
				}
			}
			func getFileCopy(result: PHPickerResult) async -> URL? {
				for type in ["public.jpeg", "public.png", "public.movie"] {
					if let resultUrl = await requestFileOfType(result: result, type: type) { return resultUrl }
				}
				return nil
			}

			for result in results {
				// Try out multiple formats until we get one which is supported.
				// We request jpeg and png instead of public.image to not get .heic
				// if Apple changes their default public.image format
				if let resultUrl = await getFileCopy(result: result) {
					urls.append(resultUrl)
				} else {
					TUTSLog("Could not copy result of unknown type: \(result)")
				}
			}
			self.sendMultipleResults(filePaths: urls.map { $0.path })
		}
	}
}
