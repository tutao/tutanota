//
//  ShareViewController.swift
//  TutanotaShare
//
//  Created by Tutao GmbH on 10/14/22.
//  Copyright © 2022 Tutao GmbH. All rights reserved.
//

import UIKit
import WebKit
import Social

class ShareViewController: SLComposeServiceViewController {

  override func viewDidAppear(_ animated: Bool) {
    openMainAppWithOpenUrl()
  }

  override func isContentValid() -> Bool {
    print("posting \(contentText.count) \(contentText)")
    return contentText.isEmpty
  }

  override func didSelectPost() {
    // This is called after the user selects Post. Do the upload of contentText and/or NSExtensionContext attachments.
    // Inform the host that we're done, so it un-blocks its UI. Note: Alternatively you could call super's -didSelectPost, which will similarly complete the extension context.
    //self.extensionContext!.completeRequest(returningItems: [], completionHandler: nil)
  }

  override func configurationItems() -> [Any]! {
    // To add configuration options via table cells at the bottom of the sheet, return an array of SLComposeSheetConfigurationItem here.
    return []
  }

private func openMainAppWithOpenUrl() {
        self.extensionContext?.completeRequest(returningItems: nil, completionHandler: { _ in
            guard let url = URL(string: "tutanota://") else { return }
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
