import UIKit
import WebKit
import Social

/// annotation is necessary to be able to specify this class in Info.plist as the main UI controller
@objc(ShareViewController)
class ShareViewController: UIViewController {

  /// This is the first function that gets called when the extension is selected from the share sheet.
  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    guard let items = self.extensionContext?.inputItems as? [NSExtensionItem] else {
      TUTSLog("did not receive input items")
      self.extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
      return
    }

    let flatAttachments: [NSItemProvider] = (items.compactMap { $0.attachments }).flatMap {$0}

    Task {

      let loadedAttachments: [SharedItem] = (await flatAttachments.asyncMap { await loadSharedAttachment($0) }).compactMap { $0 }
      let timestamp = String(getTimestampMicro())
      var info = SharingInfo( timestamp: timestamp, text: "", fileUrls: [])

      for attachment in loadedAttachments {
        TUTSLog("attachment type: \(attachment.ident())")
        switch attachment {
        case .fileUrl(ident: _, let content):
          if content != nil {
            info.fileUrls.append(content!)
          } else {
            TUTSLog("skipped attaching empty file url")
          }
        case .image(ident: _, content: let content):
          guard let content = content, let imageURL = await saveUIImage(subdir: timestamp, image: content) else {
            TUTSLog("skipped attaching nil image")
            continue
          }
          info.fileUrls.append(imageURL)
        case .text(ident: _, let content):
          if content != nil {
            info.text = info.text.appending(content!).appending("\n")
          } else {
            TUTSLog("skipped attaching nil string")
          }
        case .contact(ident: _, let content):
          guard let content = content, let vcardUrl = await saveVCard(subdir: timestamp, vcardText: content) else {
            TUTSLog("skipped attaching nil contact")
            continue
          }
          info.fileUrls.append(vcardUrl)
        }
      }

      info.fileUrls = await copyToSharedStorage(subdir: timestamp, fileUrls: info.fileUrls)
      try writeSharingInfo(info: info, timestamp: timestamp)
      openMainAppWithOpenUrl(timestamp)
    }
  }

  /// save a UI image we got shared as a jpeg into shared storage so we can attach it to a mail
  func saveUIImage(subdir: String, image: UIImage) async -> URL? {
    guard let jpegData = image.jpegData(compressionQuality: 1.0) else {
      TUTSLog("could not get jpeg data from UIImage")
      return nil
    }
    let imageName = generateImageFileName(imageData: jpegData)
    return try? await writeToSharedStorage(subdir: subdir, name: imageName, content: jpegData)
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
    return try? await writeToSharedStorage(subdir: subdir, name: vcardName.appending(".vcf"), content: convertedData)
  }

  private func openMainAppWithOpenUrl(_ timestamp: String) {
    self.extensionContext?.completeRequest(returningItems: nil, completionHandler: { _ in
      guard let url = URL(string: TUTANOTA_SHARE_SCHEME.appending(timestamp)) else {
        TUTSLog("failed to build URL for sharing with \(timestamp)")
        return
      }
      _ = self.openURL(url)
    })
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
func loadSharedAttachment(_ attachment: NSItemProvider) async -> SharedItem? {
  let mappedIdentifiers = attachment.registeredTypeIdentifiers.compactMap(stringToItemType) as? [SharedItem]

  guard let firstSupported: SharedItem = mappedIdentifiers?.first else {
    TUTSLog("no supported type identifiers in \(attachment.registeredTypeIdentifiers)")
    return nil
  }

  return try? await withCheckedThrowingContinuation { cont in
    attachment.loadItem(forTypeIdentifier: firstSupported.ident(), options: nil) { coding, err in
      if(err != nil) {
        TUTSLog("got error when loading attachment item: \(err!)")
        cont.resume(throwing: SharingError.failedToLoad)
      }

      guard let coding = coding else {
        TUTSLog("got nil coded attachment")
        cont.resume(throwing: SharingError.failedToLoad )
        return
      }

      switch firstSupported {
      case .fileUrl:
        return codingToUrl(coding, cont)
      case .image:
        return codingToImage(coding, cont)
      case .text:
        return codingToText(coding, cont)
      case .contact:
        return codingToVCard(coding, cont)
      }
    }
  }

  @Sendable func codingToUrl(_ coding: NSSecureCoding, _ cont: CheckedContinuation<SharedItem, any Error>) -> Void {
    guard let decodedURL: URL = (coding as? URL) ?? ((coding as? NSURL) as? URL) else {
      TUTSLog("could not convert coding \(String(describing: coding)) to URL")
      cont.resume(throwing: SharingError.failedToLoad)
      return
    }
    cont.resume(returning: SharedItem.fileUrl(
      ident: firstSupported.ident(),
      content: decodedURL
    ))
  }

  @Sendable func codingToImage(_ coding: NSSecureCoding, _ cont: CheckedContinuation<SharedItem, any Error>) -> Void {
    guard let uiImage = coding as? UIImage else {
      TUTSLog("could not convert coding to UIImage: \(String(describing: coding))")
      cont.resume(throwing: SharingError.failedToLoad)
      return
    }

    cont.resume(returning: SharedItem.image(
      ident: firstSupported.ident(),
      content: uiImage
    ))
  }

  @Sendable func codingToText(_ coding: NSSecureCoding, _ cont: CheckedContinuation<SharedItem, any Error>) -> Void {
    var decodedText: String? = coding as? String

    if decodedText == nil {
      decodedText = (coding as? URL)?.absoluteString
    }

    if decodedText == nil {
      TUTSLog("could not convert coding \(String(describing: coding)) to String")
      cont.resume(throwing: SharingError.failedToLoad)
      return
    }

    cont.resume(returning: SharedItem.text(
      ident: firstSupported.ident(),
      content: decodedText!
    ))
  }

  @Sendable func codingToVCard(_ coding: NSSecureCoding, _ cont: CheckedContinuation<SharedItem, any Error>) -> Void {
    guard let vcardText = coding as? Data else {
      TUTSLog("could not convert vcard to data: \(String(describing: coding))")
      cont.resume(throwing: SharingError.failedToLoad)
      return
    }

    cont.resume(returning: SharedItem.contact(
      ident: firstSupported.ident(),
      content: String(data:vcardText, encoding: .utf8)!
    ))
  }
}

/// async version of map, awaiting each async result in the collection
/// before starting on the next one.
fileprivate extension Sequence {
  func asyncMap<T>(
    _ transform: (Element) async throws -> T
  ) async rethrows -> [T] {
    var values = [T]()

    for element in self {
      try await values.append(transform(element))
    }

    return values
  }
}
