//
//  TutanotaContactProviderExtension.swift
//  TutanotaContactProviderExtension
//
//  Created by Tutao GmbH on 04.11.26.
//

import ContactProvider
import ExtensionFoundation
import Foundation

@main class TutanotaContactProviderExtension: ContactProviderExtension {
	private let rootContainerEnumerator: TutanotaContactProviderExtensionRootContainerEnumerator

	required init() {
		// Initialize your extension here.
		rootContainerEnumerator = TutanotaContactProviderExtensionRootContainerEnumerator()
	}

	func configure(for domain: ContactProviderDomain) {
		// Configure your extension here.
		rootContainerEnumerator.configure(for: domain)
	}

	func enumerator(for collection: ContactItem.Identifier) -> ContactItemEnumerator { rootContainerEnumerator }

	func invalidate() async throws {
		// TODO: Stop any enumeration and cleanup as the extension will be terminated.
	}
}
