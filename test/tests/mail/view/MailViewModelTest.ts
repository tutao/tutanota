import o from "@tutao/otest"
import { createTestEntity } from "../../TestUtils"
import { MailFolderTypeRef } from "../../../../src/common/api/entities/tutanota/TypeRefs"
import { MailSetKind } from "../../../../src/common/api/common/TutanotaConstants"
import { ConversationPrefProvider } from "../../../../src/mail-app/mail/view/ConversationViewModel"
import { object, when } from "testdouble"
import { MailListDisplayMode } from "../../../../src/common/misc/DeviceConfig"
import { listingModeForFolder } from "../../../../src/mail-app/mail/view/MailViewModel"

o.spec("MailViewModelTest", () => {
	o.spec("listingModeForFolder", () => {
		o.spec("on inbox folder", () => {
			const testInbox = createTestEntity(MailFolderTypeRef, {
				folderType: MailSetKind.INBOX,
			})

			o.test("returns CONVERSATIONS if display mode is CONVERSATIONS and conversation view is enabled", () => {
				const prefProvider: ConversationPrefProvider = object()
				when(prefProvider.getMailListDisplayMode()).thenReturn(MailListDisplayMode.CONVERSATIONS)
				when(prefProvider.getConversationViewShowOnlySelectedMail()).thenReturn(false)
				o(listingModeForFolder(testInbox, prefProvider)).equals(MailListDisplayMode.CONVERSATIONS)
			})

			o.test("returns MAILS if display mode is MAILS", () => {
				const prefProvider: ConversationPrefProvider = object()
				when(prefProvider.getMailListDisplayMode()).thenReturn(MailListDisplayMode.MAILS)
				when(prefProvider.getConversationViewShowOnlySelectedMail()).thenReturn(false)
				o(listingModeForFolder(testInbox, prefProvider)).equals(MailListDisplayMode.MAILS)
			})

			o.test("returns MAILS if conversation view is disabled", () => {
				const prefProvider: ConversationPrefProvider = object()
				when(prefProvider.getMailListDisplayMode()).thenReturn(MailListDisplayMode.CONVERSATIONS)
				when(prefProvider.getConversationViewShowOnlySelectedMail()).thenReturn(true)
				o(listingModeForFolder(testInbox, prefProvider)).equals(MailListDisplayMode.MAILS)
			})
		})
		o.spec("on sent and draft folders", () => {
			const testDraftFolder = createTestEntity(MailFolderTypeRef, {
				folderType: MailSetKind.DRAFT,
			})
			const testSentFolder = createTestEntity(MailFolderTypeRef, {
				folderType: MailSetKind.SENT,
			})

			o.test("returns MAILS even if display mode is CONVERSATIONS and conversation view is enabled", () => {
				const prefProvider: ConversationPrefProvider = object()
				when(prefProvider.getMailListDisplayMode()).thenReturn(MailListDisplayMode.CONVERSATIONS)
				when(prefProvider.getConversationViewShowOnlySelectedMail()).thenReturn(false)
				o(listingModeForFolder(testDraftFolder, prefProvider)).equals(MailListDisplayMode.MAILS)
				o(listingModeForFolder(testSentFolder, prefProvider)).equals(MailListDisplayMode.MAILS)
			})
		})
	})
})
