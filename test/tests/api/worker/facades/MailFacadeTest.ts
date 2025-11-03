import o from "@tutao/otest"
import { MailFacade, phishingMarkerValue, validateMimeTypesForAttachments } from "../../../../../src/common/api/worker/facades/lazy/MailFacade.js"
import {
	FileTypeRef,
	InternalRecipientKeyDataTypeRef,
	Mail,
	MailAddressTypeRef,
	MailDetails,
	MailDetailsBlobTypeRef,
	MailDetailsTypeRef,
	MailTypeRef,
	ReportedMailFieldMarkerTypeRef,
	SecureExternalRecipientKeyDataTypeRef,
	SendDraftData,
	SendDraftDataTypeRef,
	SymEncInternalRecipientKeyDataTypeRef,
} from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import {
	CryptoProtocolVersion,
	MailAuthenticationStatus,
	MAX_NBR_OF_MAILS_SYNC_OPERATION,
	ReportedMailFieldType,
} from "../../../../../src/common/api/common/TutanotaConstants.js"
import { matchers, object, when } from "testdouble"
import { CryptoFacade } from "../../../../../src/common/api/worker/crypto/CryptoFacade.js"
import { IServiceExecutor } from "../../../../../src/common/api/common/ServiceRequest.js"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient.js"
import { BlobFacade } from "../../../../../src/common/api/worker/facades/lazy/BlobFacade.js"
import { UserFacade } from "../../../../../src/common/api/worker/facades/UserFacade"
import { NativeFileApp } from "../../../../../src/common/native/common/FileApp.js"
import { LoginFacade } from "../../../../../src/common/api/worker/facades/LoginFacade.js"
import { DataFile } from "../../../../../src/common/api/common/DataFile.js"
import { downcast, KeyVersion, lazyNumberRange } from "@tutao/tutanota-utils"
import { ProgrammingError } from "../../../../../src/common/api/common/error/ProgrammingError.js"
import { createTestEntity } from "../../../TestUtils.js"
import { KeyLoaderFacade } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade.js"
import { PublicEncryptionKeyProvider } from "../../../../../src/common/api/worker/facades/PublicEncryptionKeyProvider.js"
import { assertThrows, verify } from "@tutao/tutanota-test-utils"
import { UnreadMailStateService } from "../../../../../src/common/api/entities/tutanota/Services"
import { BucketKeyTypeRef, InstanceSessionKey, InstanceSessionKeyTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs"
import { OwnerEncSessionKeyProvider } from "../../../../../src/common/api/worker/rest/EntityRestClient"
import { elementIdPart, getElementId } from "../../../../../src/common/api/common/utils/EntityUtils"
import { CryptoWrapper, VersionedEncryptedKey } from "../../../../../src/common/api/worker/crypto/CryptoWrapper"
import { Recipient } from "../../../../../src/common/api/common/recipients/Recipient"
import { AesKey } from "@tutao/tutanota-crypto"
import { RecipientsNotFoundError } from "../../../../../src/common/api/common/error/RecipientsNotFoundError"
import { KeyVerificationMismatchError } from "../../../../../src/common/api/common/error/KeyVerificationMismatchError"
import { SpamClassifier } from "../../../../../src/mail-app/workerUtils/spamClassification/SpamClassifier"
import { CacheStorage } from "../../../../../src/common/api/worker/rest/DefaultEntityRestCache"

o.spec("MailFacade test", function () {
	let facade: MailFacade
	let userFacade: UserFacade
	let cryptoFacade: CryptoFacade
	let cryptoWrapper: CryptoWrapper
	let serviceExecutor: IServiceExecutor
	let entityClient: EntityClient
	let blobFacade: BlobFacade
	let fileApp: NativeFileApp
	let loginFacade: LoginFacade
	let keyLoaderFacade: KeyLoaderFacade
	let publicEncryptionKeyProvider: PublicEncryptionKeyProvider
	let cacheStorage: CacheStorage
	let spamClassifier: SpamClassifier

	o.beforeEach(function () {
		userFacade = object()
		blobFacade = object()
		entityClient = object()
		cryptoFacade = object()
		cryptoWrapper = object()
		serviceExecutor = object()
		fileApp = object()
		loginFacade = object()
		keyLoaderFacade = object()
		publicEncryptionKeyProvider = object()
		facade = new MailFacade(
			userFacade,
			entityClient,
			cryptoFacade,
			cryptoWrapper,
			serviceExecutor,
			blobFacade,
			fileApp,
			loginFacade,
			keyLoaderFacade,
			publicEncryptionKeyProvider,
		)
	})

	o.spec("checkMailForPhishing", function () {
		let mailDetails: MailDetails
		let mail: Mail
		o.beforeEach(function () {
			const mailDetailsListId = "mailDetailsListId"
			const mailDetailsElementId = "mailDetailsElementId"
			mailDetails = createTestEntity(MailDetailsTypeRef, { authStatus: MailAuthenticationStatus.AUTHENTICATED })
			mail = createTestEntity(MailTypeRef, {
				mailDetails: [mailDetailsListId, mailDetailsElementId],
				subject: "Test",
				sender: createTestEntity(MailAddressTypeRef, {
					name: "a",
					address: "test@example.com",
				}),
			})
			when(entityClient.loadMultiple(MailDetailsBlobTypeRef, mailDetailsListId, [mailDetailsElementId], matchers.anything())).thenResolve([
				createTestEntity(MailDetailsBlobTypeRef, { details: mailDetails }),
			])
		})

		o("not phishing if no markers", async function () {
			o(await facade.checkMailForPhishing(mail, [{ href: "https://example.com", innerHTML: "link" }])).equals(false)
		})

		o("not phishing if no matching markers", async function () {
			facade.phishingMarkersUpdateReceived([
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test 2"),
				}),
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.FROM_DOMAIN, "example2.com"),
				}),
			])

			o(await facade.checkMailForPhishing(mail, [{ href: "https://example.com", innerHTML: "link" }])).equals(false)
		})

		o("not phishing if only from domain matches", async function () {
			facade.phishingMarkersUpdateReceived([
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test 2"),
				}),
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.FROM_DOMAIN, "example.com"),
				}),
			])

			o(await facade.checkMailForPhishing(mail, [{ href: "https://example.com", innerHTML: "link" }])).equals(false)
		})

		o("not phishing if only subject matches", async function () {
			facade.phishingMarkersUpdateReceived([
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"),
				}),
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.FROM_DOMAIN, "example2.com"),
				}),
			])

			o(await facade.checkMailForPhishing(mail, [{ href: "https://example.com", innerHTML: "link" }])).equals(false)
		})

		o("is phishing if subject and sender domain matches", async function () {
			facade.phishingMarkersUpdateReceived([
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"),
				}),
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.FROM_DOMAIN, "example.com"),
				}),
			])

			o(await facade.checkMailForPhishing(mail, [{ href: "https://example.com", innerHTML: "link" }])).equals(true)
		})

		o("is phishing if subject with whitespaces and sender domain matches", async function () {
			mail.subject = "\tTest spaces \n"
			facade.phishingMarkersUpdateReceived([
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Testspaces"),
				}),
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.FROM_DOMAIN, "example.com"),
				}),
			])

			o(await facade.checkMailForPhishing(mail, [{ href: "https://example.com", innerHTML: "link" }])).equals(true)
		})

		o("is not phishing if subject and sender domain matches but not authenticated", async function () {
			mailDetails.authStatus = MailAuthenticationStatus.SOFT_FAIL
			facade.phishingMarkersUpdateReceived([
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"),
				}),
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.FROM_DOMAIN, "example.com"),
				}),
			])

			o(await facade.checkMailForPhishing(mail, [{ href: "https://example.com", innerHTML: "link" }])).equals(false)
		})

		o("is phishing if subject and sender address matches", async function () {
			facade.phishingMarkersUpdateReceived([
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"),
				}),
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.FROM_ADDRESS, "test@example.com"),
				}),
			])

			o(await facade.checkMailForPhishing(mail, [{ href: "https://example.com", innerHTML: "link" }])).equals(true)
		})

		o("is not phishing if subject and sender address matches but not authenticated", async function () {
			mailDetails.authStatus = MailAuthenticationStatus.SOFT_FAIL
			facade.phishingMarkersUpdateReceived([
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"),
				}),
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.FROM_ADDRESS, "test@example.com"),
				}),
			])

			o(await facade.checkMailForPhishing(mail, [{ href: "https://example.com", innerHTML: "link" }])).equals(false)
		})

		o("is phishing if subject and non auth sender domain matches", async function () {
			mailDetails.authStatus = MailAuthenticationStatus.SOFT_FAIL
			facade.phishingMarkersUpdateReceived([
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"),
				}),
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.FROM_DOMAIN_NON_AUTH, "example.com"),
				}),
			])

			o(await facade.checkMailForPhishing(mail, [{ href: "https://example.com", innerHTML: "link" }])).equals(true)
		})

		o("is phishing if subject and non auth sender address matches", async function () {
			mailDetails.authStatus = MailAuthenticationStatus.SOFT_FAIL
			facade.phishingMarkersUpdateReceived([
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"),
				}),
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.FROM_ADDRESS_NON_AUTH, "test@example.com"),
				}),
			])

			o(await facade.checkMailForPhishing(mail, [{ href: "https://example.com", innerHTML: "link" }])).equals(true)
		})

		o("is phishing if subject and link matches", async function () {
			facade.phishingMarkersUpdateReceived([
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"),
				}),
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.LINK, "https://example.com"),
				}),
			])

			o(await facade.checkMailForPhishing(mail, [{ href: "https://example.com", innerHTML: "link" }])).equals(true)
		})

		o("is not phishing if just two links match", async function () {
			facade.phishingMarkersUpdateReceived([
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.LINK, "https://example.com"),
				}),
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.LINK, "https://example2.com"),
				}),
			])

			o(
				await facade.checkMailForPhishing(mail, [
					{ href: "https://example.com", innerHTML: "link1" },
					{ href: "https://example2.com", innerHTML: "link2" },
				]),
			).equals(false)
		})

		o("is phishing if subject and link domain matches", async function () {
			facade.phishingMarkersUpdateReceived([
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"),
				}),
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.LINK_DOMAIN, "example.com"),
				}),
			])

			o(await facade.checkMailForPhishing(mail, [{ href: "https://example.com", innerHTML: "link" }])).equals(true)
		})

		o("does not throw on invalid link", async function () {
			facade.phishingMarkersUpdateReceived([
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"),
				}),
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.LINK_DOMAIN, "example.com"),
				}),
			])

			o(
				await facade.checkMailForPhishing(mail, [
					{ href: "/example1", innerHTML: "link1" },
					{ href: "example2", innerHTML: "link2" },
					{ href: "http:/", innerHTML: "link3" },
				]),
			).equals(false)
		})

		o("is phishing if subject and suspicious link", async function () {
			facade.phishingMarkersUpdateReceived([
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"),
				}),
			])

			o(
				await facade.checkMailForPhishing(mail, [
					{
						href: "https://example.com",
						innerHTML: "https://evil-domain.com",
					},
				]),
			).equals(true)
		})

		o("link is not suspicious if on the same domain", async function () {
			facade.phishingMarkersUpdateReceived([
				createTestEntity(ReportedMailFieldMarkerTypeRef, {
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"),
				}),
			])

			o(
				await facade.checkMailForPhishing(mail, [
					{
						href: "https://example.com",
						innerHTML: "https://example.com/test",
					},
				]),
			).equals(false)
		})
	})

	o.spec("verifyMimeTypesForAttachments", () => {
		function attach(mimeType, name): DataFile {
			return downcast({
				mimeType,
				name,
				_type: "DataFile",
			})
		}

		o("valid mimetypes", () => {
			validateMimeTypesForAttachments([attach("application/json", "something.json")])
			validateMimeTypesForAttachments([attach("audio/ogg; codec=opus", "something.opus")])
			validateMimeTypesForAttachments([attach('video/webm; codecs="vp8, opus"', "something.webm")])
			validateMimeTypesForAttachments([attach("something/orrather", "something.somethingorrather")])
			validateMimeTypesForAttachments([attach("thisisvalid/technically+this_is-ok_even-if-YOU-dont-like-it", "something.valid")])
			validateMimeTypesForAttachments([attach("anotherthing/youcando;ishave=multiple;parameters=in;a=mimetype", "something.technicallyvalidaswell")])
		})

		o("invalid mimetypes", () => {
			o(() => {
				validateMimeTypesForAttachments([attach("applicationjson", "something.json")])
			}).throws(ProgrammingError)
			o(() => {
				validateMimeTypesForAttachments([attach("application/json", "something.json"), attach("applicationjson", "something.json")])
			}).throws(ProgrammingError)
			o(() => {
				validateMimeTypesForAttachments([attach("applicationjson", "something.json"), attach("application/json", "something.json")])
			}).throws(ProgrammingError)
			o(() => {
				validateMimeTypesForAttachments([attach("", "bad.json")])
			}).throws(ProgrammingError)
			o(() => {
				validateMimeTypesForAttachments([attach("a/b/c", "no.json")])
			}).throws(ProgrammingError)
			o(() => {
				validateMimeTypesForAttachments([attach("a/b?c", "please stop.json")])
			}).throws(ProgrammingError)
			o(() => {
				validateMimeTypesForAttachments([attach('video/webm; codecs="vp8, opus oh no i forgot the quote; oops=mybad', "why.webm")])
			}).throws(ProgrammingError)
			o(() => {
				validateMimeTypesForAttachments([attach("video/webm; parameterwithoutavalue", "bad.webm")])
			}).throws(ProgrammingError)
		})

		o("isTutaCryptMail", () => {
			const pqRecipient = createTestEntity(InternalRecipientKeyDataTypeRef, { protocolVersion: CryptoProtocolVersion.TUTA_CRYPT })
			const rsaRecipient = createTestEntity(InternalRecipientKeyDataTypeRef, { protocolVersion: CryptoProtocolVersion.RSA })
			const secureExternalRecipient = createTestEntity(SecureExternalRecipientKeyDataTypeRef, {})
			const symEncInternalRecipient = createTestEntity(SymEncInternalRecipientKeyDataTypeRef, {})

			o(
				facade.isTutaCryptMail(
					createTestEntity(SendDraftDataTypeRef, {
						internalRecipientKeyData: [pqRecipient],
						secureExternalRecipientKeyData: [],
						symEncInternalRecipientKeyData: [],
					}),
				),
			).equals(true)

			o(
				facade.isTutaCryptMail(
					createTestEntity(SendDraftDataTypeRef, {
						internalRecipientKeyData: [pqRecipient, pqRecipient],
						secureExternalRecipientKeyData: [],
						symEncInternalRecipientKeyData: [],
					}),
				),
			).equals(true)

			o(
				facade.isTutaCryptMail(
					createTestEntity(SendDraftDataTypeRef, {
						internalRecipientKeyData: [],
						secureExternalRecipientKeyData: [],
						symEncInternalRecipientKeyData: [],
					}),
				),
			).equals(false)

			o(
				facade.isTutaCryptMail(
					createTestEntity(SendDraftDataTypeRef, {
						internalRecipientKeyData: [pqRecipient, rsaRecipient],
						secureExternalRecipientKeyData: [],
						symEncInternalRecipientKeyData: [],
					}),
				),
			).equals(false)

			o(
				facade.isTutaCryptMail(
					createTestEntity(SendDraftDataTypeRef, {
						internalRecipientKeyData: [pqRecipient],
						secureExternalRecipientKeyData: [secureExternalRecipient],
						symEncInternalRecipientKeyData: [],
					}),
				),
			).equals(false)

			o(
				facade.isTutaCryptMail(
					createTestEntity(SendDraftDataTypeRef, {
						internalRecipientKeyData: [pqRecipient],
						secureExternalRecipientKeyData: [],
						symEncInternalRecipientKeyData: [symEncInternalRecipient],
					}),
				),
			).equals(false)
		})
	})
	o.spec("markMails", () => {
		o.test("test with single mail", async () => {
			const testIds: IdTuple[] = [["a", "b"]]
			await facade.markMails(testIds, true)
			verify(
				serviceExecutor.post(
					UnreadMailStateService,
					matchers.contains({
						mails: testIds,
						unread: true,
					}),
				),
			)
		})

		o.test("test with a few mails", async () => {
			const testIds: IdTuple[] = [
				["a", "b"],
				["c", "d"],
			]
			await facade.markMails(testIds, true)
			verify(
				serviceExecutor.post(
					UnreadMailStateService,
					matchers.contains({
						mails: testIds,
						unread: true,
					}),
				),
			)
		})

		o.test("batches large amounts of mails", async () => {
			const expectedBatches = 4
			const testIds: IdTuple[] = []
			for (let i = 0; i < MAX_NBR_OF_MAILS_SYNC_OPERATION * expectedBatches; i++) {
				testIds.push([`${i}`, `${i}`])
			}
			await facade.markMails(testIds, true)
			for (let i = 0; i < expectedBatches; i++) {
				verify(
					serviceExecutor.post(
						UnreadMailStateService,
						matchers.contains({
							mails: testIds.slice(i * MAX_NBR_OF_MAILS_SYNC_OPERATION, (i + 1) * MAX_NBR_OF_MAILS_SYNC_OPERATION),
							unread: true,
						}),
					),
				)
			}

			verify(serviceExecutor.post(UnreadMailStateService, matchers.anything()), { times: expectedBatches })
		})
	})

	o.spec("createOwnerEncSessionKeyProviderForAttachments", () => {
		function sessionKeyId(mailIndex: number, attachmentIndex: number) {
			return `attachmentId_mail_${mailIndex}_attachment_${attachmentIndex}`
		}

		function setUpMail(mailIndex: number, attachmentCount: number): Mail {
			const mail = createTestEntity(MailTypeRef, {
				bucketKey: createTestEntity(BucketKeyTypeRef, {
					_id: `hey I'm an ID for bucket key #${mailIndex}`,
				}),
			})
			const instanceSessionKeys: InstanceSessionKey[] = []
			for (const attachmentIndex of lazyNumberRange(0, attachmentCount)) {
				const attachmentId = sessionKeyId(mailIndex, attachmentIndex)
				const instanceSessionKey = createTestEntity(InstanceSessionKeyTypeRef, {
					instanceId: attachmentId,
					symEncSessionKey: new Uint8Array([mailIndex, attachmentIndex, 3, 4]),
					symKeyVersion: `${mailIndex}`,
				})
				instanceSessionKeys.push(instanceSessionKey)

				mail.attachments.push(["someListId", attachmentId])
			}
			when(cryptoFacade.resolveWithBucketKey(mail)).thenResolve({
				resolvedSessionKeyForInstance: [],
				instanceSessionKeys,
			})
			return mail
		}

		async function checkMail(resolver: OwnerEncSessionKeyProvider, fileCount: number, mails: readonly Mail[]) {
			for (const [mailIndex, mail] of mails.entries()) {
				for (const [attachmentIndex, attachmentId] of mail.attachments.entries()) {
					const attachment = createTestEntity(FileTypeRef, {
						_id: attachmentId,
						name: `file_${attachmentIndex}`,
					})
					o.check(await resolver(elementIdPart(attachmentId), attachment)).deepEquals({
						key: new Uint8Array([mailIndex, attachmentIndex, 3, 4]),
						encryptingKeyVersion: mailIndex as KeyVersion,
					})(`hellooooo I'm an ID for some file instance #${attachmentId} for mail #${mailIndex}`)
				}
			}
		}

		o.test("one mail with no bucket key", async () => {
			const mail = createTestEntity(MailTypeRef)
			await facade.createOwnerEncSessionKeyProviderForAttachments([mail])
			// since our resolver will do nothing, we just need to ensure that cryptoFacade was never called in the first place
			verify(cryptoFacade.resolveWithBucketKey(matchers.anything()), { times: 0 })
		})

		o.test("one mail with one file instance", async () => {
			const mails = [setUpMail(0, 1)]
			const resolver = await facade.createOwnerEncSessionKeyProviderForAttachments(mails)
			await checkMail(resolver, 1, mails)
		})
		o.test("a lot of mails with one file instance", async () => {
			const count = 100
			const instanceCount = 1
			const mails: Mail[] = []
			for (let i = 0; i < count; i++) {
				mails.push(setUpMail(i, instanceCount))
			}
			const resolver = await facade.createOwnerEncSessionKeyProviderForAttachments(mails)
			await checkMail(resolver, instanceCount, mails)
		})

		o.test("one mail with many file instances", async () => {
			const instanceCount = 256
			const mails = [setUpMail(0, instanceCount)]
			const resolver = await facade.createOwnerEncSessionKeyProviderForAttachments(mails)
			await checkMail(resolver, instanceCount, mails)
		})
		o.test("a lot of mails with many file instances", async () => {
			const count = 100
			const instanceCount = 64
			const mails: Mail[] = []
			for (let i = 0; i < count; i++) {
				mails.push(setUpMail(i, instanceCount))
			}
			const resolver = await facade.createOwnerEncSessionKeyProviderForAttachments(mails)
			await checkMail(resolver, instanceCount, mails)
		})

		o.test("when already decrypted it just returns the key", async () => {
			const mail = setUpMail(0, 1)
			mail.bucketKey = null

			const resolver = await facade.createOwnerEncSessionKeyProviderForAttachments([mail])
			const expectedSK: VersionedEncryptedKey = {
				key: new Uint8Array([1, 2, 3, 4]),
				encryptingKeyVersion: 10,
			}
			const attachment = createTestEntity(FileTypeRef, {
				_id: mail.attachments[0],
				_ownerEncSessionKey: expectedSK.key,
				_ownerKeyVersion: String(expectedSK.encryptingKeyVersion),
				name: `file_${0}`,
			})
			o.check(await resolver(getElementId(attachment), attachment)).deepEquals(expectedSK)
		})
	})

	o.spec("addRecipientKeyData", function () {
		o("correctly throws RecipientsNotFoundError", async function () {
			const bucketKey: AesKey = object()
			const sendDraftData: SendDraftData = object()
			const senderMailGroupId: Id = object()

			const notFoundRecipient1: Recipient = object()
			// @ts-ignore
			notFoundRecipient1.address = "one@tuta.com"

			const notFoundRecipient2: Recipient = object()
			// @ts-ignore
			notFoundRecipient2.address = "two@tuta.com"

			const someRecipient1: Recipient = object()
			const someRecipient2: Recipient = object()

			const recipients: Array<Recipient> = [someRecipient1, notFoundRecipient1, someRecipient2, notFoundRecipient2]

			const captor = matchers.captor()
			when(
				cryptoFacade.encryptBucketKeyForInternalRecipient(
					matchers.anything(),
					matchers.anything(),
					notFoundRecipient1.address,
					captor.capture(),
					matchers.anything(),
				),
			).thenDo(() => {
				const notFoundRecipients: string[] = captor.value
				notFoundRecipients.push(notFoundRecipient1.address)
			})

			when(
				cryptoFacade.encryptBucketKeyForInternalRecipient(
					matchers.anything(),
					matchers.anything(),
					notFoundRecipient2.address,
					captor.capture(),
					matchers.anything(),
				),
			).thenDo(() => {
				const notFoundRecipients: string[] = captor.value
				notFoundRecipients.push(notFoundRecipient2.address)
			})

			const err = await assertThrows(RecipientsNotFoundError, async () => {
				// @ts-ignore
				await facade.addRecipientKeyData(bucketKey, sendDraftData, recipients, senderMailGroupId)
			})
			o(err.message).equals(`${notFoundRecipient1.address}\n${notFoundRecipient2.address}`)
		})

		o("correctly throws KeyVerificationMismatchError", async function () {
			const bucketKey: AesKey = object()
			const sendDraftData: SendDraftData = object()
			const senderMailGroupId: Id = object()

			const unverifiedRecipient1: Recipient = object()
			// @ts-ignore
			unverifiedRecipient1.address = "one@tuta.com"

			const unverifiedRecipient2: Recipient = object()
			// @ts-ignore
			unverifiedRecipient2.address = "two@tuta.com"

			const someRecipient1: Recipient = object()
			const someRecipient2: Recipient = object()

			const recipients: Array<Recipient> = [someRecipient1, unverifiedRecipient1, someRecipient2, unverifiedRecipient2]

			const captor = matchers.captor()
			when(
				cryptoFacade.encryptBucketKeyForInternalRecipient(
					matchers.anything(),
					matchers.anything(),
					unverifiedRecipient1.address,
					matchers.anything(),
					captor.capture(),
				),
			).thenDo(() => {
				const mismatchRecipients: string[] = captor.value
				mismatchRecipients.push(unverifiedRecipient1.address)
			})

			when(
				cryptoFacade.encryptBucketKeyForInternalRecipient(
					matchers.anything(),
					matchers.anything(),
					unverifiedRecipient2.address,
					matchers.anything(),
					captor.capture(),
				),
			).thenDo(() => {
				const mismatchRecipients: string[] = captor.value
				mismatchRecipients.push(unverifiedRecipient2.address)
			})

			const err = await assertThrows(KeyVerificationMismatchError, async () => {
				// @ts-ignore
				await facade.addRecipientKeyData(bucketKey, sendDraftData, recipients, senderMailGroupId)
			})
			o(err.data).deepEquals([unverifiedRecipient1.address, unverifiedRecipient2.address])
		})
	})
})
