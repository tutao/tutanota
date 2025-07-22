import o from "@tutao/otest"
import { TutaNotificationHandler } from "../../../../src/common/desktop/sse/TutaNotificationHandler.js"
import { WindowManager } from "../../../../src/common/desktop/DesktopWindowManager.js"
import { NativeCredentialsFacade } from "../../../../src/common/native/common/generatedipc/NativeCredentialsFacade.js"
import { DesktopNotifier } from "../../../../src/common/desktop/notifications/DesktopNotifier.js"
import { DesktopAlarmScheduler } from "../../../../src/common/desktop/sse/DesktopAlarmScheduler.js"
import { DesktopAlarmStorage } from "../../../../src/common/desktop/sse/DesktopAlarmStorage.js"
import { LanguageViewModel } from "../../../../src/common/misc/LanguageViewModel.js"
import { fetch as undiciFetch } from "undici"
import { func, matchers, object, verify, when } from "testdouble"
import { CredentialEncryptionMode } from "../../../../src/common/misc/credentials/CredentialEncryptionMode.js"
import { ExtendedNotificationMode } from "../../../../src/common/native/common/generatedipc/ExtendedNotificationMode.js"
import { createIdTupleWrapper, createNotificationInfo, NotificationInfo } from "../../../../src/common/api/entities/sys/TypeRefs.js"
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
import { assertNotNull } from "@tutao/tutanota-utils"

type UndiciFetch = typeof undiciFetch

o.spec("TutaNotificationHandler", () => {
	const appVersion = "V_1"

	let wm: WindowManager
	let nativeCredentialsFacade: NativeCredentialsFacade
	let conf: SseStorage
	let notifier: DesktopNotifier
	let alarmScheduler: DesktopAlarmScheduler
	let alarmStorage: DesktopAlarmStorage
	let lang: LanguageViewModel
	let fetch: UndiciFetch
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

			await handler.onMailNotification(setupSseInfo(), [notificationInfo])

			verify(
				notifier.showCountedUserNotification({
					title: "translated:pushNewMail_msg",
					body: notificationInfo.mailAddress,
					userId: "user1",
					onClick: matchers.anything(),
				}),
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

			await handler.onMailNotification(setupSseInfo(), [notificationInfo])

			verify(notifier.showCountedUserNotification(matchers.anything()), { times: 0 })
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

			await handler.onMailNotification(setupSseInfo(), [notificationInfo])

			const paramsCaptor = matchers.captor()
			verify(notifier.showCountedUserNotification(paramsCaptor.capture()))

			const { title, body, userId, onClick } = paramsCaptor.value as Parameters<DesktopNotifier["showCountedUserNotification"]>[0]

			o.check(title).equals("translated:pushNewMail_msg")
			o.check(body).equals(notificationInfo.mailAddress)
			o.check(userId).equals("user1")

			onClick()

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
				"http://something.com/rest/tutanota/mail/mailListId?ids=mailElementId",
				{
					v: tutanotaModelInfo.version.toString(),
					cv: appVersion,
					accessToken: "accessToken",
				},
				200,
				[mailLiteral],
			)

			await handler.onMailNotification(sseInfo, [notificationInfo])

			await requestDefer

			const paramsCaptor = matchers.captor()
			verify(notifier.showCountedUserNotification(paramsCaptor.capture()))

			const { title, body, userId, onClick } = paramsCaptor.value as Parameters<DesktopNotifier["showCountedUserNotification"]>[0]

			o.check(title).equals("sender@example.com")
			o.check(body).equals("recipient@example.com")
			o.check(userId).equals("user1")

			onClick()

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

		o.test("show notifications for no more than 100 mails", async () => {
			when(wm.getAll()).thenReturn([])
			when(nativeCredentialsFacade.getCredentialEncryptionMode()).thenResolve(CredentialEncryptionMode.DEVICE_LOCK)
			when(conf.getExtendedNotificationConfig("user1")).thenResolve(ExtendedNotificationMode.OnlySender)

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

			const notificationInfos: NotificationInfo[] = []
			for (let i = 0; i < 110; i++) {
				const mailId = createIdTupleWrapper({
					listId: "mailListId",
					listElementId: `mailElementId${i}`,
				})
				const notificationInfo = createNotificationInfo({
					_id: `id${i}`,
					_ownerGroup: "ownerGroupId",
					mailId: mailId,
					mailAddress: "recipient@example.com",
					userId: "user1",
				})
				notificationInfos.push(notificationInfo)
			}

			const notificationInfosSlice = notificationInfos.slice(0, 100)
			const mailListElementIds = notificationInfosSlice.map((ni) => assertNotNull(ni.mailId).listElementId).join(encodeURIComponent(","))

			const sk = aes256RandomKey()
			const mailMetadataPromises = notificationInfosSlice.map(({ mailId }) => {
				const { listId, listElementId } = assertNotNull(mailId)
				const mailMetadata: Mail = createSystemMail({
					_id: [listId, listElementId],
					sender: createTestEntity(MailAddressTypeRef, {
						address: "sender@example.com",
					}),
					firstRecipient: createTestEntity(MailAddressTypeRef, {
						address: "recipient@example.com",
					}),
				})
				return nativeInstancePipeline.mapAndEncrypt(MailTypeRef, mailMetadata, sk)
			})
			const requestDefer = mockFetchRequest(
				fetch,
				`http://something.com/rest/tutanota/mail/mailListId?ids=${mailListElementIds}`,
				{
					v: tutanotaModelInfo.version.toString(),
					cv: appVersion,
					accessToken: "accessToken",
				},
				200,
				await Promise.all(mailMetadataPromises),
			)

			await handler.onMailNotification(sseInfo, notificationInfos)
			await requestDefer

			o.check(notificationInfos.length).equals(110)
			verify(notifier.showCountedUserNotification(matchers.anything()), { times: 100 })
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
