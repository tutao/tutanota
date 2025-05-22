import o from "@tutao/otest"
import { TutaNotificationHandler } from "../../../../src/common/desktop/sse/TutaNotificationHandler.js"
import { WindowManager } from "../../../../src/common/desktop/DesktopWindowManager.js"
import { NativeCredentialsFacade } from "../../../../src/common/native/common/generatedipc/NativeCredentialsFacade.js"
import { DesktopNotifier, NotificationResult } from "../../../../src/common/desktop/DesktopNotifier.js"
import { DesktopAlarmScheduler } from "../../../../src/common/desktop/sse/DesktopAlarmScheduler.js"
import { DesktopAlarmStorage } from "../../../../src/common/desktop/sse/DesktopAlarmStorage.js"
import { LanguageViewModel } from "../../../../src/common/misc/LanguageViewModel.js"
import { fetch as undiciFetch } from "undici"
import { func, matchers, object, verify, when } from "testdouble"
import { CredentialEncryptionMode } from "../../../../src/common/misc/credentials/CredentialEncryptionMode.js"
import { ExtendedNotificationMode } from "../../../../src/common/native/common/generatedipc/ExtendedNotificationMode.js"
import { createIdTupleWrapper, createNotificationInfo } from "../../../../src/common/api/entities/sys/TypeRefs.js"
import { clientInitializedTypeModelResolver, createTestEntity, instancePipelineFromTypeModelResolver, mockFetchRequest } from "../../TestUtils.js"
import tutanotaModelInfo from "../../../../src/common/api/entities/tutanota/ModelInfo.js"
import { UnencryptedCredentials } from "../../../../src/common/native/common/generatedipc/UnencryptedCredentials.js"
import { CredentialType } from "../../../../src/common/misc/credentials/CredentialType.js"
import { Mail, MailAddressTypeRef, MailTypeRef } from "../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { ApplicationWindow } from "../../../../src/common/desktop/ApplicationWindow.js"
import { SseInfo } from "../../../../src/common/desktop/sse/SseInfo.js"
import { SseStorage } from "../../../../src/common/desktop/sse/SseStorage.js"
import { createSystemMail } from "../../api/common/mail/CommonMailUtilsTest"
import { InstancePipeline } from "../../../../src/common/api/worker/crypto/InstancePipeline"
import { aes256RandomKey } from "@tutao/tutanota-crypto"

type UndiciFetch = typeof undiciFetch

o.spec("TutaNotificationHandler", () => {
	let wm: WindowManager
	let nativeCredentialsFacade: NativeCredentialsFacade
	let conf: SseStorage
	let notifier: DesktopNotifier
	let alarmScheduler: DesktopAlarmScheduler
	let alarmStorage: DesktopAlarmStorage
	let lang: LanguageViewModel
	let fetch: UndiciFetch
	let appVersion = "V_1"
	let handler: TutaNotificationHandler
	let nativeInstancePipeline: InstancePipeline

	o.beforeEach(() => {
		wm = object()
		nativeCredentialsFacade = object()
		conf = object()
		notifier = object()
		alarmScheduler = object()
		alarmStorage = object()
		lang = object()
		fetch = func<UndiciFetch>()
		when(lang.get(matchers.anything())).thenDo((arg) => `translated:${arg}`)
		const typeModelResolver = clientInitializedTypeModelResolver()
		nativeInstancePipeline = instancePipelineFromTypeModelResolver(typeModelResolver)
		handler = new TutaNotificationHandler(
			wm,
			nativeCredentialsFacade,
			conf,
			notifier,
			alarmScheduler,
			alarmStorage,
			lang,
			fetch,
			appVersion,
			nativeInstancePipeline,
			typeModelResolver,
		)
	})

	o.spec("onMailNotification", () => {
		o.test("displays simple notification if preview is off", async () => {
			when(wm.getAll()).thenReturn([])
			when(nativeCredentialsFacade.getCredentialEncryptionMode()).thenResolve(CredentialEncryptionMode.DEVICE_LOCK)
			when(conf.getExtendedNotificationConfig("user1")).thenResolve(ExtendedNotificationMode.NoSenderOrSubject)
			const mailId = createIdTupleWrapper({
				listId: "mailListId",
				listElementId: "mailElementId",
			})
			const notificationInfo = createNotificationInfo({
				_id: "id",
				_ownerGroup: "ownerGroupId",
				mailId,
				mailAddress: "recipient@example.com",
				userId: "user1",
			})

			await handler.onMailNotification(setupSseInfo(), notificationInfo)

			verify(
				notifier.submitGroupedNotification("translated:pushNewMail_msg", notificationInfo.mailAddress, "mailListId,mailElementId", matchers.anything()),
			)
		})

		o.test("does not display email notification if the window is already focused", async () => {
			when(wm.getAll()).thenReturn([
				{
					getUserId: () => "user1",
					isFocused: () => true,
				} as Partial<ApplicationWindow> as ApplicationWindow,
			])
			when(nativeCredentialsFacade.getCredentialEncryptionMode()).thenResolve(CredentialEncryptionMode.DEVICE_LOCK)
			when(conf.getExtendedNotificationConfig("user1")).thenResolve(ExtendedNotificationMode.NoSenderOrSubject)
			const mailId = createIdTupleWrapper({
				listId: "mailListId",
				listElementId: "mailElementId",
			})
			const notificationInfo = createNotificationInfo({
				_id: "id",
				_ownerGroup: "ownerGroupId",
				mailId,
				mailAddress: "recipient@example.com",
				userId: "user1",
			})

			await handler.onMailNotification(setupSseInfo(), notificationInfo)

			verify(notifier.submitGroupedNotification(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
		})

		o.test("displays simple notification if app pass is on", async () => {
			when(wm.getAll()).thenReturn([])
			when(nativeCredentialsFacade.getCredentialEncryptionMode()).thenResolve(CredentialEncryptionMode.APP_PASSWORD)
			when(conf.getExtendedNotificationConfig("user1")).thenResolve(ExtendedNotificationMode.OnlySender)
			const mailId = createIdTupleWrapper({
				listId: "mailListId",
				listElementId: "mailElementId",
			})
			const notificationInfo = createNotificationInfo({
				_id: "id",
				_ownerGroup: "ownerGroupId",
				mailId,
				mailAddress: "recipient@example.com",
				userId: "user1",
			})

			await handler.onMailNotification(setupSseInfo(), notificationInfo)

			const listenerCaptor = matchers.captor()
			verify(
				notifier.submitGroupedNotification(
					"translated:pushNewMail_msg",
					notificationInfo.mailAddress,
					"mailListId,mailElementId",
					listenerCaptor.capture(),
				),
			)
			listenerCaptor.value(NotificationResult.Click)
			verify(
				wm.openMailBox(
					{
						userId: "user1",
						mailAddress: notificationInfo.mailAddress,
					},
					"?mail=mailListId%2CmailElementId",
				),
			)
		})

		o.test("downloads and displays extended notifications", async () => {
			when(wm.getAll()).thenReturn([])
			when(nativeCredentialsFacade.getCredentialEncryptionMode()).thenResolve(CredentialEncryptionMode.DEVICE_LOCK)
			when(conf.getExtendedNotificationConfig("user1")).thenResolve(ExtendedNotificationMode.OnlySender)
			const mailId = createIdTupleWrapper({
				listId: "mailListId",
				listElementId: "mailElementId",
			})
			const notificationInfo = createNotificationInfo({
				_id: "id",
				_ownerGroup: "ownerGroupId",
				mailId: mailId,
				mailAddress: "recipient@example.com",
				userId: "user1",
			})
			const sseInfo = setupSseInfo()
			const credentials: UnencryptedCredentials = {
				credentialInfo: {
					userId: "user1",
					type: CredentialType.Internal,
					login: "user1@example.com",
				},
				accessToken: "accessToken",
				databaseKey: null,
				encryptedPassphraseKey: null,
				encryptedPassword: "",
			}
			when(nativeCredentialsFacade.loadByUserId("user1")).thenResolve(credentials)
			const mailMetadata: Mail = createSystemMail({
				_id: [mailId.listId, mailId.listElementId],
				sender: createTestEntity(MailAddressTypeRef, {
					address: "sender@example.com",
				}),
				firstRecipient: createTestEntity(MailAddressTypeRef, {
					address: "recipient@example.com",
				}),
			})

			const sk = aes256RandomKey()
			const mailLiteral = await nativeInstancePipeline.mapAndEncrypt(MailTypeRef, mailMetadata, sk)

			const requestDefer = mockFetchRequest(
				fetch,
				"http://something.com/rest/tutanota/mail/mailListId/mailElementId",
				{
					v: tutanotaModelInfo.version.toString(),
					cv: appVersion,
					accessToken: "accessToken",
				},
				200,
				mailLiteral,
			)

			await handler.onMailNotification(sseInfo, notificationInfo)

			await requestDefer

			const listenerCaptor = matchers.captor()
			verify(notifier.submitGroupedNotification("sender@example.com", "recipient@example.com", "mailListId,mailElementId", listenerCaptor.capture()))
			listenerCaptor.value(NotificationResult.Click)
			verify(
				wm.openMailBox(
					{
						userId: "user1",
						mailAddress: notificationInfo.mailAddress,
					},
					"?mail=mailListId%2CmailElementId",
				),
			)
		})
	})

	o.test("onLocalDataInvalidated", async () => {
		await handler.onLocalDataInvalidated()
		verify(alarmScheduler.unscheduleAllAlarms())
		verify(alarmStorage.removeAllPushIdentifierKeys())
		verify(wm.invalidateAlarms())
	})

	function setupSseInfo(template: Partial<SseInfo> = {}): SseInfo {
		const sseInfo = {
			identifier: "id",
			sseOrigin: "http://something.com",
			userIds: ["userId"],
			...template,
		}
		return sseInfo
	}
})
