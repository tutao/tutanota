//
//  TutanotaContactProviderExtensionRootContainerEnumerator.swift
//  TutanotaContactProviderExtension
//
//  Created by Tutao GmbH on 03.11.26.
//

import ContactProvider
import Foundation

class TutanotaContactProviderExtensionRootContainerEnumerator: ContactItemEnumerator {

	func configure(for domain: ContactProviderDomain) {
		// TODO: If needed, configure your enumerator for the domain.
	}

	func enumerateContent(in page: ContactItemPage, for observer: ContactItemContentObserver) async {

		// TODO: Get the database generation for the content enumeration. Will be used for the first call to enumerateChanges.
		let generationMarker = (page == .initialPage) ? currentGenerationMarker() : page.generationMarker

		do {
			// TODO: Get your batch of items to enumerate.
			let content = try fetchContent(startingAt: generationMarker, offset: page.offset, count: observer.suggestedPageSize)

			// Send the items to the observer.
			observer.didEnumerate(content.items)

			if content.moreComing {
				// More items need to be enumerated.

				// TODO: Create your next ContactItemPage that will start the next batch of items.
				//
				// Note: If `page.generationMarker` is empty, a non-empty `nextPage.generationMarker` must be provided.
				//       If `page.generationMarker` is non-empty, `nextPage.generationMarker` must be the same value.
				let nextPage = ContactItemPage(generationMarker: generationMarker, offset: page.offset + content.items.count)

				// Send the observer to the next page.
				observer.didFinishEnumeratingPage(upTo: nextPage)
			} else {
				// All items have been enumerated.

				// Tell the observer the next sync should be a change enumeration.
				observer.didFinishEnumeratingContent(upTo: generationMarker)
			}
		} catch {
			// Tell the observer an error occurred.
			//
			// Note: The system will resume the enumeration from the last `ContactItemPage` that was enumerated successfully, if the error is resumable.
			observer.didFinishEnumeratingContentWithError(error)
		}

		func currentGenerationMarker() -> Data {
			// TODO: Get the value specific to your data source identifying the current database generation.
			//
			// Note: It is a programmer error to call `didFinishEnumeratingPage(upTo:)` with a `ContactItemPage.generationMarker` that is empty.
			let generationMarker: Data = "<currentDatabaseGenerationMarker>".data(using: .utf8)!
			return generationMarker
		}

		func fetchContent(startingAt generationMarker: Data, offset: Int, count: Int) throws -> ContentFetchResult {
			// TODO: Fetch up to `count` items from the database, starting at `offset` items for the database generation specified by `generationMarker`.
			let items: [ContactItem] = []
			let moreComing: Bool = false

			return ContentFetchResult(items: items, moreComing: moreComing)
		}

		struct ContentFetchResult {
			let items: [ContactItem]
			let moreComing: Bool
		}
	}

	func enumerateChanges(startingAt syncAnchor: ContactItemSyncAnchor, for observer: ContactItemChangeObserver) async {

		do {
			// TODO: Get your batch of changed items to enumerate.
			let changes = try fetchChanges(startingAt: syncAnchor.generationMarker, offset: syncAnchor.offset, count: observer.suggestedBatchSize)

			// Send the changes to the observer.
			observer.didUpdate(changes.updatedItems)
			observer.didDelete(changes.deletedItemIdentifiers)
			observer.didFinishEnumeratingChanges(upTo: changes.nextSyncAnchor, moreComing: changes.moreComing)
		} catch {
			// Tell the observer an error occurred.
			//
			// Note: The system will resume the enumeration from the last `ContactItemSyncAnchor` that was enumerated successfully, if the error is resumable.
			observer.didFinishEnumeratingChangesWithError(error)
		}

		func fetchChanges(startingAt generationMarker: Data, offset: Int, count: Int) throws -> ChangeFetchResult {
			// TODO: Fetch up to `count` changes from the database, starting at `offset` changes after the database generation specified by `generationMarker`.
			let updatedItems: [ContactItem] = []
			let deletedItemIdentifiers: [ContactItem.Identifier] = []
			let moreComing: Bool = false

			// TODO: Generate the next `ContactItemSyncAnchor`, using the generationMarker and offset of the last change that was fetched.
			let lastChangeGenerationMarker: Data = "<lastChangeGenerationMarker>".data(using: .utf8)!
			let lastChangeOffset: Int = 0
			let nextSyncAnchor = ContactItemSyncAnchor(generationMarker: lastChangeGenerationMarker, offset: lastChangeOffset)

			return ChangeFetchResult(
				updatedItems: updatedItems,
				deletedItemIdentifiers: deletedItemIdentifiers,
				moreComing: moreComing,
				nextSyncAnchor: nextSyncAnchor
			)
		}

		struct ChangeFetchResult {
			let updatedItems: [ContactItem]
			let deletedItemIdentifiers: [ContactItem.Identifier]
			let moreComing: Bool
			let nextSyncAnchor: ContactItemSyncAnchor
		}
	}

	func invalidate() async {
		// TODO: Stop the enumeration and cleanup as the extension will be terminated.
	}
}
