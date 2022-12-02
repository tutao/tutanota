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
      var info = SharingInfo( identifier: getUniqueInfoLocation(), text: "", fileUrls: [])

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
          guard let content = content, let imageURL = await saveUIImage(subdir: info.identifier, image: content) else {
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
          guard let content = content, let vcardUrl = await saveVCard(subdir: info.identifier, vcardText: content) else {
            TUTSLog("skipped attaching nil contact")
            continue
          }
          info.fileUrls.append(vcardUrl)
        }
      }

      info.fileUrls = await copyToSharedStorage(subdir: info.identifier, fileUrls: info.fileUrls)
      try writeSharingInfo(info: info, infoLocation: info.identifier)
      openMainAppWithOpenUrl(info.identifier)
    }
  }

  /// save a UI image we got shared as a png into shared storage so we can attach it to a mail
  func saveUIImage(subdir: String, image: UIImage) async -> URL? {
    guard let pngData = image.pngData() else {
      TUTSLog("could not get png data from UIImage")
      return nil
    }
    let imageName = generateImageFileName(imageData: pngData)
    return try? await writeToSharedStorage(subdir: subdir, name: imageName, content: pngData)
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

  private func openMainAppWithOpenUrl(_ infoLocation: String) {
    var components = URLComponents()
    components.scheme = TUTANOTA_SHARE_SCHEME
    components.host = infoLocation
    self.extensionContext?.completeRequest(returningItems: nil) { (_expired: Bool) in
      guard let url = components.url else {
        TUTSLog("failed to build URL for sharing with \(infoLocation)")
        return
      }
      _ = self.openURL(url)
    }
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

  guard let coding = try? await attachment.loadItem(forTypeIdentifier: firstSupported.ident(), options: nil) else {
    TUTSLog("failed to load secure coding for \(firstSupported.ident())")
    return nil
  }

  switch firstSupported {
  case .fileUrl:
    return codingToUrl(firstSupported.ident(), coding)
  case .image:
    return codingToImage(firstSupported.ident(), coding)
  case .text:
    return codingToText(firstSupported.ident(), coding)
  case .contact:
    return codingToVCard(firstSupported.ident(), coding)
  }
}

func codingToUrl(_ ident: String, _ coding: NSSecureCoding) -> SharedItem? {
  guard let decodedURL: URL = (coding as? URL) ?? ((coding as? NSURL) as? URL) else {
    TUTSLog("could not convert coding \(String(describing: coding)) to URL")
    return nil
  }
  return SharedItem.fileUrl(
    ident: ident,
    content: decodedURL
  )
}

func codingToImage(_ ident: String, _ coding: NSSecureCoding) -> SharedItem? {
  guard let uiImage = coding as? UIImage else {
    TUTSLog("could not convert coding to UIImage: \(String(describing: coding))")
    return nil
  }

  return SharedItem.image(
    ident: ident,
    content: uiImage
  )
}

func codingToText(_ ident: String, _ coding: NSSecureCoding) -> SharedItem? {
  var decodedText: String? = coding as? String

  if decodedText == nil {
    decodedText = (coding as? URL)?.absoluteString
  }

  if decodedText == nil {
    TUTSLog("could not convert coding \(String(describing: coding)) to String")
    return nil
  }

  return SharedItem.text(
    ident: ident,
    content: decodedText!
  )
}

func codingToVCard(_ ident: String, _ coding: NSSecureCoding) -> SharedItem? {
  guard let vcardText = coding as? Data else {
    TUTSLog("could not convert vcard to data: \(String(describing: coding))")
    return nil
  }

  return SharedItem.contact(
    ident: ident,
    content: String(data:vcardText, encoding: .utf8)!
  )
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
