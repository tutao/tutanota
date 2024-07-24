import Foundation
import QuickLook
import UIKit

class FileViewer {
	private let viewController: UIViewController
	/** We need to hold a reference to current preview otherwise it deallocs too early. Previewer does not retain delegates. */
	private var currentPreview: Delegate?

	init(viewController: UIViewController) { self.viewController = viewController }

	@MainActor func openFile(path: String) async {
		let previewController = QLPreviewController()

		let fileUrl = URL(fileURLWithPath: path)
		return await withCheckedContinuation { continuation in
			let delegate = Delegate(fileUrl: fileUrl) {
				// Remove the reference to break retain cycle
				self.currentPreview = nil
				continuation.resume()
			}
			self.currentPreview = delegate
			previewController.dataSource = delegate
			previewController.delegate = delegate
			self.viewController.present(previewController, animated: true, completion: nil)
		}
	}
}

private class Delegate: NSObject, UIDocumentInteractionControllerDelegate, QLPreviewControllerDataSource, QLPreviewControllerDelegate {
	let fileUrl: URL
	let completionHandler: () -> Void

	init(fileUrl: URL, completionHandler: @escaping () -> Void) {
		self.fileUrl = fileUrl
		self.completionHandler = completionHandler
	}

	func numberOfPreviewItems(in controller: QLPreviewController) -> Int { 1 }

	func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> QLPreviewItem { fileUrl as NSURL }

	func previewControllerDidDismiss(_ controller: QLPreviewController) { completionHandler() }

	func previewController(_ controller: QLPreviewController, shouldOpen url: URL, for item: QLPreviewItem) -> Bool { true }
}
