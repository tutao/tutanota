import Foundation
import UIKit
import QuickLook

class FileViewer {
  private let viewController: UIViewController
  /** We need to hold a reference to current preview otherwise it deallocs too early. Previewer does not retain delegates. */
  private var currentPreview: Delegate? = nil
  
  init(viewController: UIViewController) {
    self.viewController = viewController
  }
  
  func openFile(path: String, completion: @escaping () -> Void) {
    let previewController = QLPreviewController()
    
    let fileUrl = FileUtils.urlFromPath(path: path)
    DispatchQueue.main.async {
      let delegate = Delegate(fileUrl: fileUrl) {
        // Remove the reference to break retain cycle
        self.currentPreview = nil
        completion()
      }
      self.currentPreview = delegate
      previewController.dataSource = delegate
      previewController.delegate = delegate
      self.viewController.present(previewController, animated: true, completion: nil)
    }
  }
}

fileprivate class Delegate : NSObject,
                 UIDocumentInteractionControllerDelegate,
                 QLPreviewControllerDataSource,
                 QLPreviewControllerDelegate {
  let fileUrl: URL
  let completionHandler: () -> Void
  
  init(fileUrl: URL, completionHandler: @escaping () -> Void) {
    self.fileUrl = fileUrl
    self.completionHandler = completionHandler
  }
  
  deinit {
    TUTSLog("Viewer delegate deinit")
  }
  
  func numberOfPreviewItems(in controller: QLPreviewController) -> Int {
    return 1
  }
  
  func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> QLPreviewItem {
    return fileUrl as NSURL
  }
  
  func previewControllerDidDismiss(_ controller: QLPreviewController) {
    completionHandler()
  }
  
  func previewController(_ controller: QLPreviewController, shouldOpen url: URL, for item: QLPreviewItem) -> Bool {
    return true
  }
}
