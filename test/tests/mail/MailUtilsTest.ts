import o from "@tutao/otest"
import { getDisplayedSender, isTutanotaTeamAddress, MailAddressAndName } from "../../../src/mail/model/MailUtils.js"
import { createEncryptedMailAddress, createMail, createMailAddress, Mail } from "../../../src/api/entities/tutanota/TypeRefs.js"
import { MailAuthenticationStatus, MailState } from "../../../src/api/common/TutanotaConstants.js"
import { downcast } from "@tutao/tutanota-utils"

o.spec("MailUtilsTest", function () {
	function createSystemMail(realSender: MailAddressAndName): Mail {
		return createMail({
			sender: createMailAddress({ address: "system@tutanota.de", name: "System" }),
			replyTos: [createEncryptedMailAddress(realSender)],
			state: MailState.RECEIVED,
			authStatus: MailAuthenticationStatus.AUTHENTICATED,
		})
	}

	o("getDisplayedSender", function () {
		let mail: Mail = downcast("placeholder that won't get used")

		const createSalesMail = () => (mail = createSystemMail({ address: "sales@tutao.de", name: "Sales" }))
		const assertDisplayedSender = (address: string, name: string) => o(getDisplayedSender(mail)).deepEquals({ address, name })
		const assertIsSales = () => assertDisplayedSender("sales@tutao.de", "Sales")
		const assertIsNoReply = () => assertDisplayedSender("no-reply@tutao.de", "Do not reply to this!!!")
		const assertIsSystem = () => assertDisplayedSender("system@tutanota.de", "System")

		// Should be good
		createSalesMail()
		assertIsSales()
		createSalesMail().replyTos = [createEncryptedMailAddress({ address: "no-reply@tutao.de", name: "Do not reply to this!!!" })]
		assertIsNoReply()

		// Not authenticated
		createSalesMail().authStatus = MailAuthenticationStatus.HARD_FAIL
		assertIsSystem()

		// Not received
		createSalesMail().state = MailState.DRAFT
		assertIsSystem()

		// Multiple reply-tos, can't determine which
		createSalesMail().replyTos = [mail.replyTos[0], mail.replyTos[1]]
		assertIsSystem()

		// Not a Tutao address
		createSalesMail().replyTos = [createEncryptedMailAddress({ address: "bed-free@tutanota.de", name: "Bernd das Brot" })]
		assertIsSystem()
	})

	o("isTutanotaTeamAddress", function () {
		o(isTutanotaTeamAddress("system@tutanota.de")).deepEquals(false)
		o(isTutanotaTeamAddress("bed-free@tutanota.de")).deepEquals(false)
		o(isTutanotaTeamAddress("admin@somesite.com")).deepEquals(false)
		o(isTutanotaTeamAddress("no-reply@tutao.de")).deepEquals(true)
		o(isTutanotaTeamAddress("sales@tutao.de")).deepEquals(true)
		o(isTutanotaTeamAddress("no-reply@tutanota.de")).deepEquals(true)
	})
})
