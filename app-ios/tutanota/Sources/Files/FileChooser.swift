//
//  FileChooser.swift
//  tutanota
//
//  Created by Tutao GmbH on 14.10.20.
//  Copyright © 2020 Tutao GmbH. GPL-3.0-only.
//

import Photos
import PhotosUI
import UIKit

/// Utility class which shows pickers for files.
@objc
class TUTFileChooser: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate,
  UIDocumentMenuDelegate, UIPopoverPresentationControllerDelegate, UIDocumentPickerDelegate
{
  private var sourceController: UIViewController!
  private var cameraImage: UIImage!
  private var photoLibImage: UIImage!
  private var attachmentTypeMenu: UIDocumentMenuViewController!
  private var imagePickerController: UIImagePickerController!
  private var supportedUTIs: [String]
  private var resultHandler: (([String]?, Error?) -> Void)?
  private var popOverPresentationController: UIPopoverPresentationController!

  @objc init(viewController: UIViewController) {

    self.supportedUTIs = ["public.content", "public.archive", "public.data"]
    super.init()
    self.imagePickerController = UIImagePickerController()
    self.sourceController = viewController
    self.cameraImage = TUTFontIconFactory.createFontImage(
      forIconId: TUT_ICON_CAMERA, fontName: "ionicons", size: 34)
    self.photoLibImage = TUTFontIconFactory.createFontImage(
      forIconId: TUT_ICON_FILES, fontName: "ionicons", size: 34)
    self.imagePickerController.delegate = self
  }

  @objc public func open(
    withAnchorRect anchorRect: CGRect,
    completion completionHandler: @escaping ([String]?, Error?) -> Void
  ) {
    if self.resultHandler != nil {
      TUTSLog("Another file picker is already open?")
      completionHandler(nil, TUTErrorFactory.createError("file chooser already open"))
      return
    }
    self.resultHandler = completionHandler

    self.attachmentTypeMenu = UIDocumentMenuViewController(
      documentTypes: self.supportedUTIs, in: .import)
    self.attachmentTypeMenu.delegate = self

    // add menu item for selecting images from photo library.
    // according to developer documentation check if the source type is available first https://developer.apple.com/reference/uikit/uiimagepickercontroller
    if UIImagePickerController.isSourceTypeAvailable(.savedPhotosAlbum) {
      if UIDevice.current.userInterfaceIdiom == UIUserInterfaceIdiom.pad {
        attachmentTypeMenu.modalPresentationStyle = .popover
        popOverPresentationController = attachmentTypeMenu.popoverPresentationController
        popOverPresentationController.permittedArrowDirections = [.up, .down]
        popOverPresentationController.sourceView = sourceController.view
        popOverPresentationController.sourceRect = anchorRect
      }
      let photosLabel = TUTUtils.translate("TutaoChoosePhotosAction", default: "Photos")
      self.attachmentTypeMenu.addOption(
        withTitle: photosLabel, image: self.photoLibImage, order: .first,
        handler: { [weak self] in
          guard let self = self else {
            return
          }

          // No need to ask for permissions with new picker
          if #available(iOS 14.0, *) {
            self.showPhpicker(anchor: anchorRect)
          } else {
            // ask for permission because of changed behaviour in iOS 11
            if PHPhotoLibrary.authorizationStatus() == .notDetermined {
              PHPhotoLibrary.requestAuthorization({ status in
                if status == .authorized {
                  self.showLegacyImagePicker(anchor: anchorRect)
                } else {
                  self.sendResult(filePath: nil)
                }
              })
            } else if PHPhotoLibrary.authorizationStatus() == .authorized {
              self.showLegacyImagePicker(anchor: anchorRect)  // capture the weak reference to avoid reference self
            } else {
              self.showPermissionDeniedDialog()
            }
          }
        })
    }

    // add menu item for opening the camera and take a photo or video.
    // according to developer documentation check if the source type is available first https://developer.apple.com/reference/uikit/uiimagepickercontroller
    if UIImagePickerController.isSourceTypeAvailable(.camera) {
      let cameraLabel = TUTUtils.translate("TutaoShowCameraAction", default: "Camera")
      self.attachmentTypeMenu.addOption(
        withTitle: cameraLabel, image: self.cameraImage, order: .first
      ) { [weak self] in
        self?.openCamera()  // capture the weak reference to avoid refFFFFerence cycle
      }
    }
    self.sourceController.present(self.attachmentTypeMenu, animated: true, completion: nil)
  }

  private func showLegacyImagePicker(anchor: CGRect) {
    DispatchQueue.main.async { [unowned self] in
      self.imagePickerController.sourceType = .savedPhotosAlbum
      self.imagePickerController.mediaTypes =
        UIImagePickerController.availableMediaTypes(for: .savedPhotosAlbum) ?? []
      self.imagePickerController.modalPresentationStyle = .fullScreen
      self.imagePickerController.allowsEditing = false
      if UIDevice.current.userInterfaceIdiom == .pad {
        self.imagePickerController.modalPresentationStyle = .popover
        let popOverController: UIPopoverPresentationController! = self.imagePickerController
          .popoverPresentationController
        popOverController.sourceView = self.sourceController.view
        popOverController.permittedArrowDirections = [.up, .down]
        popOverController.sourceRect = anchor
        popOverController.delegate = self
      }
      self.sourceController.present(self.imagePickerController, animated: true, completion: nil)
    }
  }

  @available(iOS 14.0, *)
  private func showPhpicker(anchor: CGRect) {
    var configuration = PHPickerConfiguration(photoLibrary: PHPhotoLibrary.shared())
    configuration.selectionLimit = 0
    configuration.filter = .any(of: [.videos, .images])
    let picker = PHPickerViewController(configuration: configuration)
    picker.delegate = self
    sourceController.present(picker, animated: true, completion: nil)
  }

  private func openCamera() {
    DispatchQueue.main.async {
      self.imagePickerController.sourceType = .camera
      self.imagePickerController.mediaTypes =
        UIImagePickerController.availableMediaTypes(for: .camera) ?? []
      self.imagePickerController.modalPresentationStyle = .fullScreen
      self.imagePickerController.allowsEditing = false
      self.imagePickerController.showsCameraControls = true
      self.sourceController.present(self.imagePickerController, animated: true, completion: nil)
    }
  }

  // from UIPopoverPresentationControllerDelegate
  func popoverPresentationControllerDidDismissPopover(
    _ popoverPresentationController: UIPopoverPresentationController
  ) {
    self.sendResult(filePath: nil)
  }

  // from UIDocumentMenuDelegate protocol
  func documentMenu(
    _ documentMenu: UIDocumentMenuViewController,
    didPickDocumentPicker documentPicker: UIDocumentPickerViewController
  ) {
    documentPicker.delegate = self
    self.sourceController.present(documentPicker, animated: true, completion: nil)
  }
  // from UIDocumentMenuDelegate protocol
  func documentMenuWasCancelled(documentMenu: UIDocumentMenuViewController!) {
    self.sendResult(filePath: nil)
  }

  // from UIDocumentPickerDelegate protocol
  private func documentPicker(
    controller: UIDocumentPickerViewController!, didPickDocumentAtURL url: URL
  ) {
    self.copyFileToLocalFolderAndSendResult(srcUrl: url, filename: url.lastPathComponent)
  }

  // from UIDocumentPickerDelegate protocol
  func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
    self.sendResult(filePath: nil)
  }

  // from UIImagePickerControllerDelegate protocol
  func imagePickerController(
    _ picker: UIImagePickerController,
    didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]
  ) {
    // we have to copy the file into a folder of this app.
    let targetFolder: String
    do {
      targetFolder = try TUTFileUtil.getDecryptedFolder()
    } catch {
      self.sendError(error: error)
      return
    }

    self.sourceController.dismiss(
      animated: true,
      completion: { [unowned self] in
        if self.imagePickerController.sourceType == .camera {
          let mediaType = info[UIImagePickerController.InfoKey.mediaType] as! String
          if mediaType == "public.image" {  // Handle a still image capture
            var originalImage: UIImage!
            var editedImage: UIImage!
            var imageToSave: UIImage!
            editedImage = info[UIImagePickerController.InfoKey.editedImage] as? UIImage
            originalImage = info[UIImagePickerController.InfoKey.originalImage] as? UIImage
            if editedImage != nil {
              imageToSave = editedImage
            } else {
              imageToSave = originalImage
            }
            let fileName = self.generateFileName(prefixString: "img", withExtension: "jpg")
            let filePath = URL(fileURLWithPath: targetFolder).appendingPathComponent(fileName)
            guard let imageData = imageToSave.jpegData(compressionQuality: 0.9) else {
              self.sendError(
                error: TUTErrorFactory.createError("Could not get image data from camera image"))
              return
            }
            do {
              try imageData.write(to: filePath, options: .atomic)
            } catch {
              self.sendError(
                error: TUTErrorFactory.createError(
                  "failed to save captured image to path \(filePath)"))
              return
            }
          } else if mediaType == "public.movie" {  // Handle a movie capture
            let videoURL = info[UIImagePickerController.InfoKey.mediaURL] as! URL
            let fileName = self.generateFileName(prefixString: "movie", withExtension: "mp4")
            self.copyFileToLocalFolderAndSendResult(srcUrl: videoURL, filename: fileName)
          } else {
            self.sendError(
              error: TUTErrorFactory.createError(String(format: "Invalid media type %@", mediaType))
            )
          }
        } else {
          let srcUrl = info[UIImagePickerController.InfoKey.referenceURL] as! URL

          // retrieve the filename of the image or video
          let result = PHAsset.fetchAssets(withALAssetURLs: [srcUrl], options: nil)

          guard let assetObject = result.firstObject,
            let assetResource = PHAssetResource.assetResources(for: assetObject).first
          else {
            self.sendError(error: TUTErrorFactory.createError("No asset resource for image"))
            return
          }

          let fileName = assetResource.originalFilename
          var filePath = URL(fileURLWithPath: targetFolder).appendingPathComponent(fileName)

          //extracting image from the picker and saving it
          let mediaUrl = info[UIImagePickerController.InfoKey.mediaURL] as? URL
          let mediaType = info[UIImagePickerController.InfoKey.mediaType] as? String
          if mediaType == "public.image" {
            filePath = self.changeExtensionToJpeg(filename: filePath)
            PHImageManager.default().requestImage(
              for: assetObject,
              targetSize: CGSize(
                width: CGFloat(assetObject.pixelWidth), height: CGFloat(assetObject.pixelHeight)),
              contentMode: PHImageContentMode.default,
              options: nil,
              // @escaping (UIImage?, [AnyHashable : Any]?) -> Void) -> PHImageRequestID
              resultHandler: { (result, info) in
                // We are calling this method asynchonously, it may be called with
                // a low-res version of the image the first time
                if (info?[PHImageResultIsDegradedKey as AnyHashable] as? Bool) == .some(true) {
                  return
                }
                guard let result = result else {
                  self.sendError(error: TUTErrorFactory.createError("No asset resource for image"))
                  return
                }

                guard let imageData = result.jpegData(compressionQuality: 1.0) else {
                  self.sendError(
                    error: TUTErrorFactory.createError(
                      "Could not get compressed image from gallery"))
                  return
                }
                do {
                  try imageData.write(to: filePath, options: .atomic)
                } catch {
                  self.sendError(error: error)
                }
                self.sendResult(filePath: filePath.path)
              })
          } else if let mediaUrl = mediaUrl {  // for videos
            self.copyFileToLocalFolderAndSendResult(srcUrl: mediaUrl, filename: fileName)
          } else {
            self.sendError(
              error: TUTErrorFactory.createError(
                "Invalid media type \(String(describing: mediaType))"))
          }
        }
      })
  }

  // from UIImagePickerControllerDelegate protocol
  func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
    self.sourceController.dismiss(animated: true) { [weak self] in
      self?.sendResult(filePath: nil)
    }
  }

  private func copyFileToLocalFolderAndSendResult(srcUrl: URL, filename: String) {
    do {
      let targetUrl = try self.copyToLocalFolder(srcUrl: srcUrl, filename: filename)
      self.sendResult(filePath: targetUrl.absoluteString)
    } catch {
      self.sendError(error: error)
      return
    }
  }

  private func copyToLocalFolder(srcUrl: URL, filename: String) throws -> URL {
    let targetFolder: String
    targetFolder = try TUTFileUtil.getDecryptedFolder()
    let targetUrl = URL(fileURLWithPath: targetFolder).appendingPathComponent(filename)
    let fileManager = FileManager.default
    // NSFileManager copyItemAtUrl returns an error if the file alredy exists. so delete it first.
    if fileManager.fileExists(atPath: targetUrl.path) {
      try fileManager.removeItem(atPath: targetUrl.path)
    }

    try fileManager.copyItem(at: srcUrl, to: targetUrl)
    return targetUrl
  }

  func generateFileName(prefixString: String!, withExtension extensionString: String!) -> String {
    let time = Date()
    let df = DateFormatter()
    df.dateFormat = "hhmmss"
    let timeString = df.string(from: time)
    let fileName = String(format: "%@_%@.%@", prefixString, timeString, extensionString)
    return fileName
  }

  func sendResult(filePath: String?) {
    let paths = filePath.map { [$0] } ?? []
    self.sendMultipleResults(filePaths: paths)
  }

  func sendMultipleResults(filePaths: [String]) {
    self.resultHandler?(filePaths, nil)
    self.resultHandler = nil
  }

  func sendError(error: Error) {
    self.resultHandler?(nil, error)
    self.resultHandler = nil
  }

  func showPermissionDeniedDialog() {
    //User don't give us permission. Showing alert with redirection to settings
    let permissionTitle: String! = "No permission"
    let permissionInfo: String! =
      "To grant access you have to modify the permissions for this device"
    let settingsActionLabel = "Settings"
    let cancelActionLabel = "Cancel"

    let alertController: UIAlertController! = UIAlertController(
      title: permissionTitle, message: permissionInfo, preferredStyle: .alert)
    let cancelAction: UIAlertAction! = UIAlertAction(
      title: cancelActionLabel, style: .cancel, handler: nil)
    alertController.addAction(cancelAction)

    let settingsAction = UIAlertAction(title: settingsActionLabel, style: .default) { _ in
      UIApplication.shared.open(
        URL(string: UIApplication.openSettingsURLString)!, options: [:], completionHandler: nil)
    }
    alertController.addAction(settingsAction)
    UIApplication.shared.keyWindow?.rootViewController?.present(
      alertController, animated: true, completion: nil)
    self.sendResult(filePath: nil)
  }

  /**
     * Replace ".heic" or ".heif" extensions with ".jpeg".
     */
  private func changeExtensionToJpeg(filename: URL) -> URL {
    return filename.deletingPathExtension().appendingPathExtension("jpg")
  }
}

@available(iOS 14.0, *)
extension TUTFileChooser: PHPickerViewControllerDelegate {
  func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
    picker.dismiss(animated: true, completion: nil)

    let waitGroup = DispatchGroup()
    var urls = [URL]()

    for result in results {
      if result.itemProvider.hasItemConformingToTypeIdentifier("public.image") {
        waitGroup.enter()
        result.itemProvider.loadFileRepresentation(forTypeIdentifier: "public.image") {
          (url, error) in
          if let url = url {
            do {
              let resultUrl = try self.copyToLocalFolder(
                srcUrl: url, filename: url.lastPathComponent)
              urls.append(resultUrl)
            } catch {
              TUTSLog("Error while copying image to local folder: \(error)")
            }
          } else {
            TUTSLog("Error while loading image: \(error.debugDescription)")
          }
          waitGroup.leave()
        }
      } else if result.itemProvider.hasItemConformingToTypeIdentifier("public.movie") {
        result.itemProvider.loadFileRepresentation(forTypeIdentifier: "public.movie") {
          (url, error) in
          if let url = url {
            do {
              let resultUrl = try self.copyToLocalFolder(
                srcUrl: url, filename: url.lastPathComponent)
              urls.append(resultUrl)
            } catch {
              TUTSLog("Error while copying video to local folder: \(error)")
            }
          } else {
            TUTSLog("Error while loading video: \(error.debugDescription)")
          }
          waitGroup.leave()
        }
      } else {
        print("Unknown file types: \(result)")
      }
    }

    waitGroup.notify(queue: DispatchQueue.main) {
      self.sendMultipleResults(filePaths: urls.map { $0.path })
    }
  }
}