import o from "@tutao/otest"
import { guessServerImapConfigFromEmail } from "../../../../../../src/common/api/common/utils/imapImportUtils/ImapImportUtils"

o.spec("ImapImportUtils", function () {
	o.spec("guessServerImapConfigFromEmail", function () {
		o.test("guesses gmail configs correctly", function () {
			const gmailImapHost = "imap.gmail.com"
			o(guessServerImapConfigFromEmail("test@gmail.com")?.host).equals(gmailImapHost)
			o(guessServerImapConfigFromEmail("another-user@google.com")?.host).equals(gmailImapHost)
			o(guessServerImapConfigFromEmail("test@googlemail.com")?.host).equals(gmailImapHost)
		})

		o.test("guesses outlook configs correctly", function () {
			const outlookImapHost = "outlook.office365.com"
			o(guessServerImapConfigFromEmail("user@outlook.com")?.host).equals(outlookImapHost)
			o(guessServerImapConfigFromEmail("another-user@live.it")?.host).equals(outlookImapHost)
			o(guessServerImapConfigFromEmail("test@msn.com")?.host).equals(outlookImapHost)
			o(guessServerImapConfigFromEmail("test@hotmail.com")?.host).equals(outlookImapHost)
		})

		o.test("guesses correctly for gmx, web de and yahoo", function () {
			o(guessServerImapConfigFromEmail("test@gmx.de")?.host).equals("imap.gmx.net")
			o(guessServerImapConfigFromEmail("user@web.de")?.host).equals("imap.web.de")
			o(guessServerImapConfigFromEmail("test@yahoo.co.uk")?.host).equals("imap.mail.yahoo.com")
		})

		o.test("returns null in case there is no match", function () {
			o(guessServerImapConfigFromEmail("test@test.com")).equals(null)
			o(guessServerImapConfigFromEmail("test@thisshouldnotexist.de")).equals(null)
		})
	})
})
