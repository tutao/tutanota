import o from "@tutao/otest"
import { createMail, createMailAddress, Mail, MailAddressTypeRef, MailTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { EncryptionAuthStatus, MailState } from "../../../../../src/common/api/common/TutanotaConstants.js"
import { createTestEntity } from "../../../TestUtils.js"
import { Icons } from "../../../../../src/common/gui/base/icons/Icons.js"
import { ProgrammingError } from "../../../../../src/common/api/common/error/ProgrammingError.js"
import { getDisplayedSender } from "../../../../../src/common/api/common/CommonMailUtils.js"
import { getConfidentialIcon, isTutanotaTeamAddress, isTutanotaTeamMail } from "../../../../../src/mail-app/mail/view/MailGuiUtils.js"

import { isSystemNotification } from "../../../../../src/mail-app/mail/view/MailViewerUtils.js"

o.spec("MailUtilsTest", function () {
	function createSystemMail(overrides: Partial<Mail> = {}): Mail {
		return createTestEntity(MailTypeRef, {
			...{
				sender: createTestEntity(MailAddressTypeRef, { address: "system@tutanota.de", name: "System" }),
				replyTos: [],
				state: MailState.RECEIVED,
				authStatus: null,
				_errors: {},
				_id: ["", ""],
				_ownerEncSessionKey: null,
				_ownerGroup: "",
				_permissions: "",
				attachments: [],
				bccRecipients: [],
				body: null,
				bucketKey: null,
				ccRecipients: [],
				confidential: true,
				conversationEntry: ["", ""],
				differentEnvelopeSender: null,
				encryptionAuthStatus: null,
				firstRecipient: null,
				headers: null,
				listUnsubscribe: false,
				mailDetails: null,
				mailDetailsDraft: null,
				method: "",
				movedTime: null,
				phishingStatus: "",
				receivedDate: new Date(),
				recipientCount: "",
				replyType: "",
				subject: "",
				toRecipients: [],
				unread: false,
			},
			...overrides,
		})
	}

	const tutanotaSender = () => createMailAddress({ address: "sender@tutanota.de", name: "Tutanota sender", contact: null })
	const tutaoSender = () => createMailAddress({ address: "sender@tutao.de", name: "Tutao sender", contact: null })
	const tutanotaNoReplySender = () => createMailAddress({ address: "no-reply@tutanota.de", name: "Tutanota no-reply", contact: null })
	const tutaoNoReplySender = () => createMailAddress({ address: "no-reply@tutao.de", name: "Tutao no-reply", contact: null })

	o("getDisplayedSender", function () {
		const mail = createSystemMail()
		o(getDisplayedSender(mail)).deepEquals({ address: "system@tutanota.de", name: "System" })
	})

	o("isTutanotaTeamAddress", function () {
		o(isTutanotaTeamAddress("system@tutanota.de")).deepEquals(false)
		o(isTutanotaTeamAddress("bed-free@tutanota.de")).deepEquals(false)
		o(isTutanotaTeamAddress("admin@somesite.com")).deepEquals(false)
		o(isTutanotaTeamAddress("no-reply@tutao.de")).deepEquals(true)
		o(isTutanotaTeamAddress("sales@tutao.de")).deepEquals(true)
		o(isTutanotaTeamAddress("no-reply@tutanota.de")).deepEquals(true)
	})

	o("getConfidentialIcon", function () {
		const mail: Mail = createTestEntity(MailTypeRef, { confidential: true, encryptionAuthStatus: EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED })
		o(getConfidentialIcon(mail)).equals(Icons.PQLock)

		mail.encryptionAuthStatus = EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_FAILED
		o(getConfidentialIcon(mail)).equals(Icons.PQLock)

		mail.encryptionAuthStatus = EncryptionAuthStatus.AES_NO_AUTHENTICATION
		o(getConfidentialIcon(mail)).equals(Icons.Lock)

		mail.encryptionAuthStatus = null
		o(getConfidentialIcon(mail)).equals(Icons.Lock)

		mail.encryptionAuthStatus = EncryptionAuthStatus.RSA_NO_AUTHENTICATION
		o(getConfidentialIcon(mail)).equals(Icons.Lock)

		mail.encryptionAuthStatus = EncryptionAuthStatus.TUTACRYPT_SENDER
		o(getConfidentialIcon(mail)).equals(Icons.PQLock)

		mail.confidential = false
		o(() => getConfidentialIcon(mail)).throws(ProgrammingError)
	})

	o.spec("isTutanotaTeamMail", function () {
		o("regular non-confidential email is not", function () {
			const mail = createTestEntity(MailTypeRef, {
				confidential: false,
				state: MailState.RECEIVED,
				sender: tutanotaSender(),
			})
			o(isTutanotaTeamMail(mail)).equals(false)
		})

		o("regular confidential email is not", function () {
			const mail = createTestEntity(MailTypeRef, {
				confidential: true,
				state: MailState.RECEIVED,
				sender: tutanotaSender(),
			})
			o(isTutanotaTeamMail(mail)).equals(false)
		})

		o("system email without auth is", function () {
			const mail = createSystemMail()
			o(isTutanotaTeamMail(mail)).equals(true)
		})

		o("system email failing PQ auth is not", function () {
			const mail = createSystemMail({ encryptionAuthStatus: EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_FAILED })
			o(isTutanotaTeamMail(mail)).equals(false)
		})

		o("system email with RSA (no) auth is", function () {
			const mail = createSystemMail({ encryptionAuthStatus: EncryptionAuthStatus.RSA_NO_AUTHENTICATION })
			o(isTutanotaTeamMail(mail)).equals(true)
		})

		o("system email with AES (no) auth is not", function () {
			const mail = createSystemMail({ encryptionAuthStatus: EncryptionAuthStatus.AES_NO_AUTHENTICATION })
			o(isTutanotaTeamMail(mail)).equals(false)
		})

		o("confidential email from tutao without auth is", function () {
			const mail = createTestEntity(MailTypeRef, {
				confidential: true,
				state: MailState.RECEIVED,
				sender: tutaoSender(),
				encryptionAuthStatus: null,
			})
			o(isTutanotaTeamMail(mail)).equals(true)
		})

		o("confidential email from tutao with PQ auth is", function () {
			const mail = createTestEntity(MailTypeRef, {
				confidential: true,
				state: MailState.RECEIVED,
				sender: tutaoSender(),
				encryptionAuthStatus: EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED,
			})
			o(isTutanotaTeamMail(mail)).equals(true)
		})

		o("confidential email from tutao with failing PQ auth is not", function () {
			const mail = createTestEntity(MailTypeRef, {
				confidential: true,
				state: MailState.RECEIVED,
				sender: tutaoSender(),
				encryptionAuthStatus: EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_FAILED,
			})
			o(isTutanotaTeamMail(mail)).equals(false)
		})

		o("confidential email from tutao with RSA (no) auth is", function () {
			const mail = createTestEntity(MailTypeRef, {
				confidential: true,
				state: MailState.RECEIVED,
				sender: tutaoSender(),
				encryptionAuthStatus: EncryptionAuthStatus.RSA_NO_AUTHENTICATION,
			})
			o(isTutanotaTeamMail(mail)).equals(true)
		})

		o("confidential email from tutao with AES (no) auth is not", function () {
			const mail = createTestEntity(MailTypeRef, {
				confidential: true,
				state: MailState.RECEIVED,
				sender: tutaoSender(),
				encryptionAuthStatus: EncryptionAuthStatus.AES_NO_AUTHENTICATION,
			})
			o(isTutanotaTeamMail(mail)).equals(false)
		})

		o("confidential email from no-reply is", function () {
			const mail = createTestEntity(MailTypeRef, {
				confidential: true,
				state: MailState.RECEIVED,
				sender: tutanotaNoReplySender(),
			})
			o(isTutanotaTeamMail(mail)).equals(true)
		})

		o(`non-confidential "system" email is not`, function () {
			const mail = createMail({ ...createSystemMail(), confidential: false })
			o(isTutanotaTeamMail(mail)).equals(false)
		})

		o("non-confidential email from tutao is not", function () {
			const mail = createTestEntity(MailTypeRef, {
				confidential: false,
				state: MailState.RECEIVED,
				sender: tutaoSender(),
			})
			o(isTutanotaTeamMail(mail)).equals(false)
		})

		o("non confidential email from no-reply is not", function () {
			const mail = createTestEntity(MailTypeRef, {
				confidential: false,
				state: MailState.RECEIVED,
				sender: tutanotaNoReplySender(),
			})
			o(isTutanotaTeamMail(mail)).equals(false)
		})
	})

	o.spec("isSystemNotification", function () {
		o("regular non-confidential email is not", function () {
			const mail = createTestEntity(MailTypeRef, {
				confidential: false,
				state: MailState.RECEIVED,
				sender: tutanotaSender(),
			})
			o(isSystemNotification(mail)).equals(false)
		})

		o("regular confidential email is not", function () {
			const mail = createTestEntity(MailTypeRef, {
				confidential: true,
				state: MailState.RECEIVED,
				sender: tutanotaSender(),
			})
			o(isSystemNotification(mail)).equals(false)
		})

		o("system email without auth is", function () {
			const mail = createSystemMail()
			o(isSystemNotification(mail)).equals(true)
		})

		o("system email with PQ auth is", function () {
			const mail = createSystemMail({ encryptionAuthStatus: EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED })
			o(isSystemNotification(mail)).equals(true)
		})

		o("system email with failing PQ auth is not", function () {
			const mail = createSystemMail({ encryptionAuthStatus: EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_FAILED })
			o(isSystemNotification(mail)).equals(false)
		})

		o("system email with RSA (no) auth is", function () {
			const mail = createSystemMail({ encryptionAuthStatus: EncryptionAuthStatus.RSA_NO_AUTHENTICATION })
			o(isSystemNotification(mail)).equals(true)
		})

		o("system email with AES (no) auth is not", function () {
			const mail = createSystemMail({ encryptionAuthStatus: EncryptionAuthStatus.AES_NO_AUTHENTICATION })
			o(isSystemNotification(mail)).equals(false)
		})

		o("confidential email from tutao is not", function () {
			const mail = createTestEntity(MailTypeRef, {
				confidential: true,
				state: MailState.RECEIVED,
				sender: tutaoSender(),
				authStatus: null,
			})
			o(isSystemNotification(mail)).equals(false)
		})

		o("confidential email from tutao with PQ auth is not", function () {
			const mail = createTestEntity(MailTypeRef, {
				confidential: true,
				state: MailState.RECEIVED,
				sender: tutaoSender(),
				authStatus: EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED,
			})
			o(isSystemNotification(mail)).equals(false)
		})

		o("confidential email from tutanota no-reply is", function () {
			const mail = createTestEntity(MailTypeRef, {
				confidential: true,
				state: MailState.RECEIVED,
				sender: tutanotaNoReplySender(),
			})
			o(isSystemNotification(mail)).equals(true)
		})

		o("confidential email from tutao no-reply is", function () {
			const mail = createTestEntity(MailTypeRef, {
				confidential: true,
				state: MailState.RECEIVED,
				sender: tutaoNoReplySender(),
			})
			o(isSystemNotification(mail)).equals(true)
		})

		o(`non-confidential "system" email is not`, function () {
			const mail = createMail({ ...createSystemMail(), confidential: false })
			o(isSystemNotification(mail)).equals(false)
		})

		o("non-confidential email from tutao is not", function () {
			const mail = createTestEntity(MailTypeRef, {
				confidential: false,
				state: MailState.RECEIVED,
				sender: tutaoSender(),
			})
			o(isSystemNotification(mail)).equals(false)
		})

		o("non confidential email from no-reply is not", function () {
			const mail = createTestEntity(MailTypeRef, {
				confidential: false,
				state: MailState.RECEIVED,
				sender: tutanotaNoReplySender(),
			})
			o(isSystemNotification(mail)).equals(false)
		})
	})
})
