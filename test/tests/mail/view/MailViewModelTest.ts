import o from "@tutao/otest"
import { createTestEntity } from "../../TestUtils"
import { MailFolderTypeRef } from "../../../../src/common/api/entities/tutanota/TypeRefs"
import { MailSetKind } from "../../../../src/common/api/common/TutanotaConstants"
import { ConversationPrefProvider } from "../../../../src/mail-app/mail/view/ConversationViewModel"
import { object, when } from "testdouble"
import { MailListDisplayMode } from "../../../../src/common/misc/DeviceConfig"
import { listByConversationInFolder } from "../../../../src/mail-app/mail/view/MailViewModel"

o.spec("MailViewModelTest", () => {
	o.spec("listByConversation", () => {
		o.spec("in inbox folder", () => {
			const testInbox = createTestEntity(MailFolderTypeRef, {
				folderType: MailSetKind.INBOX,
			})

			o.test("returns true if display mode is CONVERSATIONS and conversation view is enabled", () => {
				const prefProvider: ConversationPrefProvider = object()
				when(prefProvider.getMailListDisplayMode()).thenReturn(MailListDisplayMode.CONVERSATIONS)
				when(prefProvider.getConversationViewShowOnlySelectedMail()).thenReturn(false)
				o(listByConversationInFolder(prefProvider, testInbox)).equals(true)
			})

			o.test("returns false if display mode is MAILS", () => {
				const prefProvider: ConversationPrefProvider = object()
				when(prefProvider.getMailListDisplayMode()).thenReturn(MailListDisplayMode.MAILS)
				when(prefProvider.getConversationViewShowOnlySelectedMail()).thenReturn(false)
				o(listByConversationInFolder(prefProvider, testInbox)).equals(false)
			})

			o.test("returns false if conversation view is disabled", () => {
				const prefProvider: ConversationPrefProvider = object()
				when(prefProvider.getMailListDisplayMode()).thenReturn(MailListDisplayMode.CONVERSATIONS)
				when(prefProvider.getConversationViewShowOnlySelectedMail()).thenReturn(true)
				o(listByConversationInFolder(prefProvider, testInbox)).equals(false)
			})
		})
		o.spec("in sent and draft folders", () => {
			const testDraftFolder = createTestEntity(MailFolderTypeRef, {
				folderType: MailSetKind.DRAFT,
			})
			const testSentFolder = createTestEntity(MailFolderTypeRef, {
				folderType: MailSetKind.SENT,
			})

			o.test("returns false even if display mode is CONVERSATIONS and conversation view is enabled", () => {
				const prefProvider: ConversationPrefProvider = object()
				when(prefProvider.getMailListDisplayMode()).thenReturn(MailListDisplayMode.CONVERSATIONS)
				when(prefProvider.getConversationViewShowOnlySelectedMail()).thenReturn(false)
				o(listByConversationInFolder(prefProvider, testDraftFolder)).equals(false)
				o(listByConversationInFolder(prefProvider, testSentFolder)).equals(false)
			})
		})
	})
})
