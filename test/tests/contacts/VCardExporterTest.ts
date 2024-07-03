// Attention! Be very careful with this file, there are some trailing whitespaces in multiline strings that can mess things up if your editor does not respect
// them.

import o from "@tutao/otest"
import {
	BirthdayTypeRef,
	Contact,
	ContactAddressTypeRef,
	ContactMailAddressTypeRef,
	ContactPhoneNumberTypeRef,
	ContactSocialIdTypeRef,
	ContactTypeRef,
	ContactWebsiteTypeRef,
} from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { ContactAddressType, ContactPhoneNumberType, ContactSocialType, ContactWebsiteType } from "../../../src/common/api/common/TutanotaConstants.js"
import {
	_addressesToVCardAddresses,
	_phoneNumbersToVCardPhoneNumbers,
	_socialIdsToVCardSocialUrls,
	_vCardFormatArrayToString,
	contactsToVCard,
} from "../../../src/mail-app/contacts/VCardExporter.js"
import { neverNull } from "@tutao/tutanota-utils"
import { vCardFileToVCards, vCardListToContacts } from "../../../src/mail-app/contacts/VCardImporter.js"
import { createTestEntity } from "../TestUtils.js"

let idCounter = 0
o.spec("VCardExporterTest", function () {
	//turns given contacts into a vCard format string
	o("contactsToVCardsTest", function () {
		let contactArray: Contact[] = []
		let contact1 = createFilledContact(
			"Ant",
			"Ste",
			"Hello World!",
			"Tutao",
			"Mr.",
			"Buffalo",
			"Lange",
			"Jr.",
			"IT",
			["antste@antste.de", "bentste@bentste.de"],
			["123123123", "321321321"],
			["diaspora.de"],
			["Housestreet 123\nTown 123\nState 123\nCountry 123"],
			["tuta.com", "tutanota.com"],
		)
		contactArray.push(contact1)
		let c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:Mr. Ant Lange Ste, Jr.\nN:Ste;Ant;Lange;Mr.;Jr.\nNICKNAME:Buffalo\nADR;TYPE=work:Housestreet 123\\nTown 123\\nState 123\\nCountry 123\nEMAIL;TYPE=work:antste@antste.de\nEMAIL;TYPE=work:bentste@bentste.de\nTEL;TYPE=work:123123123\nTEL;TYPE=work:321321321\nURL:https://www.diaspora.de\nURL:https://www.tuta.com\nURL:https://www.tutanota.com\nORG:Tutao;IT\nNOTE:Hello World!\nEND:VCARD\n\n`
		o(contactsToVCard(contactArray)).equals(c1String)
		contactArray = []
		contact1 = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], [])
		c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:\nN:;;;;\nEND:VCARD\n\n`
		contactArray.push(contact1)
		o(contactsToVCard(contactArray)).equals(c1String)
		contactArray = []
		contact1 = createFilledContact("Ant", "", "", "", "", "", "", "", "", [], [], [], [])
		c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:Ant\nN:;Ant;;;\nEND:VCARD\n\n`
		contactArray.push(contact1)
		o(contactsToVCard(contactArray)).equals(c1String)
		contact1 = createFilledContact("Ant", "Tut", "", "", "", "", "", "", "", [], [], [], [])
		c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:Ant\nN:;Ant;;;\nEND:VCARD\n\nBEGIN:VCARD\nVERSION:3.0\nFN:Ant Tut\nN:Tut;Ant;;;\nEND:VCARD\n\n`
		contactArray.push(contact1)
		o(contactsToVCard(contactArray)).equals(c1String)
		contact1 = createFilledContact(
			"Ant",
			"Ste",
			"Hello World!",
			"Tutao",
			"Mr.",
			"Buffalo",
			"Lange",
			"Jr.",
			"IT",
			["antste@antste.de", "bentste@bentste.de"],
			["123123123", "321321321"],
			["diaspora.de"],
			["Housestreet 123\nTown 123\nState 123\nCountry 123"],
			["tuta.com", "tutanota.com"],
		)
		c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:Ant\nN:;Ant;;;\nEND:VCARD\n\nBEGIN:VCARD\nVERSION:3.0\nFN:Ant Tut\nN:Tut;Ant;;;\nEND:VCARD\n\nBEGIN:VCARD\nVERSION:3.0\nFN:Mr. Ant Lange Ste, Jr.\nN:Ste;Ant;Lange;Mr.;Jr.\nNICKNAME:Buffalo\nADR;TYPE=work:Housestreet 123\\nTown 123\\nState 123\\nCountry 123\nEMAIL;TYPE=work:antste@antste.de\nEMAIL;TYPE=work:bentste@bentste.de\nTEL;TYPE=work:123123123\nTEL;TYPE=work:321321321\nURL:https://www.diaspora.de\nURL:https://www.tuta.com\nURL:https://www.tutanota.com\nORG:Tutao;IT\nNOTE:Hello World!\nEND:VCARD\n\n`
		contactArray.push(contact1)
		o(contactsToVCard(contactArray)).equals(c1String)
		contactArray = []
		contact1 = createFilledContact(
			"Ant",
			"Ste",
			"Hello World!",
			"Tutao",
			"Mr.",
			"Buffalo",
			"Lange",
			"Jr.",
			"IT",
			["antste@antste.de", "bentste@bentste.de"],
			["123123123", "321321321"],
			["diaspora.de"],
			["Housestreet 123\nTown 123\nState 123\nCountry 123"],
			["tuta.com", "tutanota.com"],
		)
		contactArray.push(contact1)
		contactArray.push(contact1)
		c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:Mr. Ant Lange Ste, Jr.\nN:Ste;Ant;Lange;Mr.;Jr.\nNICKNAME:Buffalo\nADR;TYPE=work:Housestreet 123\\nTown 123\\nState 123\\nCountry 123\nEMAIL;TYPE=work:antste@antste.de\nEMAIL;TYPE=work:bentste@bentste.de\nTEL;TYPE=work:123123123\nTEL;TYPE=work:321321321\nURL:https://www.diaspora.de\nURL:https://www.tuta.com\nURL:https://www.tutanota.com\nORG:Tutao;IT\nNOTE:Hello World!\nEND:VCARD\n
BEGIN:VCARD\nVERSION:3.0\nFN:Mr. Ant Lange Ste, Jr.\nN:Ste;Ant;Lange;Mr.;Jr.\nNICKNAME:Buffalo\nADR;TYPE=work:Housestreet 123\\nTown 123\\nState 123\\nCountry 123\nEMAIL;TYPE=work:antste@antste.de\nEMAIL;TYPE=work:bentste@bentste.de\nTEL;TYPE=work:123123123\nTEL;TYPE=work:321321321\nURL:https://www.diaspora.de\nURL:https://www.tuta.com\nURL:https://www.tutanota.com\nORG:Tutao;IT\nNOTE:Hello World!\nEND:VCARD\n\n`
		o(contactsToVCard(contactArray)).equals(c1String)
		contactArray = []
		contact1 = createFilledContact(
			"Ant",
			"Ste",
			"",
			"Tutao",
			"Mr.",
			"",
			"Lange",
			"Jr.",
			"IT",
			["antste@antste.de", "bentste@bentste.de"],
			["123123123", "321321321"],
			[],
			["Housestreet 123\nTown 123\nState 123\nCountry 123"],
			["tuta.com", "tutanota.com"],
		)
		contactArray.push(contact1)
		contact1 = createFilledContact(
			"Bob",
			"Kev",
			"",
			"Tuta",
			"Phd.",
			"",
			"Manthey",
			"VI",
			"HR",
			["bobkev@antste.de", "bobkev@bentste.de"],
			["89", "78"],
			[],
			["Housestreet 890\nTown 098\nState 098\nCountry 789"],
			["tuta.com.br", "tutanota.com.br"],
		)
		contactArray.push(contact1)
		c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:Mr. Ant Lange Ste, Jr.\nN:Ste;Ant;Lange;Mr.;Jr.\nADR;TYPE=work:Housestreet 123\\nTown 123\\nState 123\\nCountry 123\nEMAIL;TYPE=work:antste@antste.de\nEMAIL;TYPE=work:bentste@bentste.de\nTEL;TYPE=work:123123123\nTEL;TYPE=work:321321321\nURL:https://www.tuta.com\nURL:https://www.tutanota.com\nORG:Tutao;IT\nEND:VCARD\n
BEGIN:VCARD\nVERSION:3.0\nFN:Phd. Bob Manthey Kev, VI\nN:Kev;Bob;Manthey;Phd.;VI\nADR;TYPE=work:Housestreet 890\\nTown 098\\nState 098\\nCountry 789\nEMAIL;TYPE=work:bobkev@antste.de\nEMAIL;TYPE=work:bobkev@bentste.de\nTEL;TYPE=work:89\nTEL;TYPE=work:78\nURL:https://www.tuta.com.br\nURL:https://www.tutanota.com.br\nORG:Tuta;HR\nEND:VCARD\n\n`
		o(contactsToVCard(contactArray)).equals(c1String)
	})
	o("birthdayToVCardsFormatString", function () {
		//oldBirthday
		let contactArray: Contact[] = []
		let contact1 = createFilledContact("Ant", "", "", "", "", "", "", "", "", [], [], [], [])
		contact1.birthdayIso = "2000-09-09"
		let c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:Ant\nN:;Ant;;;\nBDAY:2000-09-09\nEND:VCARD\n\n`
		contactArray.push(contact1)
		o(contactsToVCard(contactArray)).equals(c1String)
		contactArray = []
		contact1 = createFilledContact("Ant", "", "", "", "", "", "", "", "", [], [], [], [])
		contact1.birthdayIso = "2000-10-10"
		c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:Ant\nN:;Ant;;;\nBDAY:2000-10-10\nEND:VCARD\n\n`
		contactArray.push(contact1)
		o(contactsToVCard(contactArray)).equals(c1String)
		contactArray = []
		contact1 = createFilledContact("Ant", "", "", "", "", "", "", "", "", [], [], [], [])
		contact1.birthdayIso = "1800-10-10"
		c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:Ant\nN:;Ant;;;\nBDAY:1800-10-10\nEND:VCARD\n\n`
		contactArray.push(contact1)
		o(contactsToVCard(contactArray)).equals(c1String)
		//Birthday
		contact1 = createFilledContact("Ant", "", "", "", "", "", "", "", "", [], [], [], [])
		contact1.birthdayIso = "2000-09-01"
		o(contactsToVCard([contact1])).equals(`BEGIN:VCARD\nVERSION:3.0\nFN:Ant\nN:;Ant;;;\nBDAY:2000-09-01\nEND:VCARD\n\n`)
		contact1 = createFilledContact("Ant", "", "", "", "", "", "", "", "", [], [], [], [])
		contact1.birthdayIso = "2000-09-09"
		o(contactsToVCard([contact1])).equals(`BEGIN:VCARD\nVERSION:3.0\nFN:Ant\nN:;Ant;;;\nBDAY:2000-09-09\nEND:VCARD\n\n`)
		contact1 = createFilledContact("Ant", "", "", "", "", "", "", "", "", [], [], [], [])
		contact1.birthdayIso = "1991-10-10"
		o(contactsToVCard([contact1])).equals(`BEGIN:VCARD\nVERSION:3.0\nFN:Ant\nN:;Ant;;;\nBDAY:1991-10-10\nEND:VCARD\n\n`)
		contact1 = createFilledContact("Ant", "", "", "", "", "", "", "", "", [], [], [], [])
		contact1.birthdayIso = "1943-10-10"
		o(contactsToVCard([contact1])).equals(`BEGIN:VCARD\nVERSION:3.0\nFN:Ant\nN:;Ant;;;\nBDAY:1943-10-10\nEND:VCARD\n\n`)
		contact1 = createFilledContact("Ant", "", "", "", "", "", "", "", "", [], [], [], [])
		contact1.birthdayIso = "1800-01-31"
		c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:Ant\nN:;Ant;;;\nBDAY:1800-01-31\nEND:VCARD\n\n`
		o(contactsToVCard([contact1])).equals(c1String)
		contact1 = createFilledContact("Ant", "", "", "", "", "", "", "", "", [], [], [], [])
		contact1.birthdayIso = "--10-10"
		c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:Ant\nN:;Ant;;;\nBDAY:1111-10-10\nEND:VCARD\n\n`
		o(contactsToVCard([contact1])).equals(c1String)
	})

	o.spec("contactsToVCards more than 75 char content line", function () {
		o("ADR", async function () {
			//todo Birthday test
			const contact = createFilledContact(
				"Ant",
				"Ste",
				"Hello World!",
				"Tutao",
				"Mr.",
				"Buffalo",
				"Lange",
				"Jr.",
				"IT",
				["antste@antste.de", "bentste@bentste.de"],
				["123123123", "321321321"],
				["diaspora.de"],
				["Housestreet 123\nTown 123\nState 123\nCountry 123 this is so there is a line break in this contact"],
				["tuta.com", "tutanota.com"],
			)
			const exprected = `BEGIN:VCARD
VERSION:3.0
FN:Mr. Ant Lange Ste, Jr.
N:Ste;Ant;Lange;Mr.;Jr.
NICKNAME:Buffalo
ADR;TYPE=work:Housestreet 123\\nTown 123\\nState 123\\nCountry 123 this is so \n there is a line break in this contact
EMAIL;TYPE=work:antste@antste.de
EMAIL;TYPE=work:bentste@bentste.de
TEL;TYPE=work:123123123
TEL;TYPE=work:321321321
URL:https://www.diaspora.de
URL:https://www.tuta.com
URL:https://www.tutanota.com
ORG:Tutao;IT
NOTE:Hello World!
END:VCARD

`
			o(contactsToVCard([contact])).equals(exprected)
		})

		o("URL", async function () {
			const contact = createFilledContact(
				"Ant",
				"Ste",
				"Hello World!",
				"Tutao is the best mail client for your privacy just go for it and youll see it will be amazing!!!!!",
				"Mr.",
				"Buffalo",
				"Lange",
				"Jr.",
				"IT",
				["antste@antste.de", "bentste@bentste.de"],
				["123123123", "321321321"],
				["diaspora.de", "facebook.com/aaaa/bbb/cccccc/DDDDDDD/llllllll/uuuuuuu/ppppp/aaaaaaaaaaaaaaaaaaaaa"],
				["Housestreet 123\nTown 123\nState 123\nCountry 123 this is so there is a line break in this contact"],
				["tuta.com", "tutanota.com"],
			)
			const expected = `BEGIN:VCARD
VERSION:3.0
FN:Mr. Ant Lange Ste, Jr.
N:Ste;Ant;Lange;Mr.;Jr.
NICKNAME:Buffalo
ADR;TYPE=work:Housestreet 123\\nTown 123\\nState 123\\nCountry 123 this is so \n there is a line break in this contact
EMAIL;TYPE=work:antste@antste.de
EMAIL;TYPE=work:bentste@bentste.de
TEL;TYPE=work:123123123
TEL;TYPE=work:321321321
URL:https://www.diaspora.de
URL:https://www.facebook.com/aaaa/bbb/cccccc/DDDDDDD/llllllll/uuuuuuu/ppppp
 /aaaaaaaaaaaaaaaaaaaaa
URL:https://www.tuta.com
URL:https://www.tutanota.com
ORG:Tutao is the best mail client for your privacy just go for it and youll
  see it will be amazing!!!!!;IT
NOTE:Hello World!
END:VCARD

`
			o(contactsToVCard([contact])).equals(expected)
		})
	})

	o("contactsToVCardsEscapingTest", function () {
		let contactArray: Contact[] = []
		//todo Birthday test
		let contact1 = createFilledContact(
			"Ant,",
			"Ste;",
			"Hello::: World!",
			"Tutao;:",
			"Mr.:",
			"Buffalo;p",
			"Lange,",
			"Jr.,",
			"IT,",
			[":antste@antste.de;", "bentste@bent:ste.de"],
			["1;23123123", "32132:1321"],
			["https://diaspora.de"],
			["Housestreet 123\nTo:wn 123\nState 123\nCountry 123"],
		)
		contactArray.push(contact1)
		let c1String = `BEGIN:VCARD
VERSION:3.0
FN:Mr.: Ant\\, Lange\\, Ste\\;, Jr.\\,
N:Ste\\;;Ant\\,;Lange\\,;Mr.:;Jr.\\,
NICKNAME:Buffalo\\;p
ADR;TYPE=work:Housestreet 123\\nTo:wn 123\\nState 123\\nCountry 123
EMAIL;TYPE=work::antste@antste.de\\;
EMAIL;TYPE=work:bentste@bent:ste.de
TEL;TYPE=work:1\\;23123123
TEL;TYPE=work:32132:1321
URL:https://diaspora.de
ORG:Tutao\\;:;IT\\,
NOTE:Hello::: World!
END:VCARD

`
		o(contactsToVCard(contactArray)).equals(c1String)
	})
	o("addressesToVcardFormatString", function () {
		let contact1 = createFilledContact(
			"Ant",
			"Ste",
			"Hello World!",
			"Tutao",
			"Mr.",
			"Buffalo",
			"Lange",
			"Jr.",
			"IT",
			["antste@antste.de", "bentste@bentste.de"],
			["123123123", "321321321"],
			["diaspora.de"],
			["Housestreet 123\nTown 123\nState 123\nCountry 123"],
		)

		let c1String = _vCardFormatArrayToString(_addressesToVCardAddresses(contact1.addresses), "ADR")

		let expectedResult = `ADR;TYPE=work:Housestreet 123\\nTown 123\\nState 123\\nCountry 123\n`
		o(expectedResult).equals(c1String)
		contact1.addresses[0].type = ContactAddressType.PRIVATE
		c1String = _vCardFormatArrayToString(_addressesToVCardAddresses(contact1.addresses), "ADR")
		expectedResult = `ADR;TYPE=home:Housestreet 123\\nTown 123\\nState 123\\nCountry 123\n`
		o(expectedResult).equals(c1String)
		contact1.addresses[0].type = ContactAddressType.CUSTOM
		c1String = _vCardFormatArrayToString(_addressesToVCardAddresses(contact1.addresses), "ADR")
		expectedResult = `ADR:Housestreet 123\\nTown 123\\nState 123\\nCountry 123\n`
		o(expectedResult).equals(c1String)
		contact1.addresses[0].type = ContactAddressType.OTHER
		c1String = _vCardFormatArrayToString(_addressesToVCardAddresses(contact1.addresses), "ADR")
		expectedResult = `ADR:Housestreet 123\\nTown 123\\nState 123\\nCountry 123\n`
		o(expectedResult).equals(c1String)
	})
	o("mailAddressesToVCardString", function () {
		let contact1 = createFilledContact(
			"Ant",
			"Ste",
			"Hello World!",
			"Tutao",
			"Mr.",
			"Buffalo",
			"Lange",
			"Jr.",
			"IT",
			["antste@antste.de", "bentste@bentste.de"],
			["123123123", "321321321"],
			["diaspora.de"],
			["Housestreet 123\nTown 123\nState 123\nCountry 123"],
		)

		let c1String = _vCardFormatArrayToString(_addressesToVCardAddresses(contact1.mailAddresses), "EMAIL")

		let expectedResult = `EMAIL;TYPE=work:antste@antste.de\nEMAIL;TYPE=work:bentste@bentste.de\n`
		o(expectedResult).equals(c1String)
		contact1.mailAddresses[0].type = ContactAddressType.PRIVATE
		c1String = _vCardFormatArrayToString(_addressesToVCardAddresses(contact1.mailAddresses), "EMAIL")
		expectedResult = `EMAIL;TYPE=home:antste@antste.de\nEMAIL;TYPE=work:bentste@bentste.de\n`
		o(expectedResult).equals(c1String)
		contact1.mailAddresses[1].type = ContactAddressType.CUSTOM
		c1String = _vCardFormatArrayToString(_addressesToVCardAddresses(contact1.mailAddresses), "EMAIL")
		expectedResult = `EMAIL;TYPE=home:antste@antste.de\nEMAIL:bentste@bentste.de\n`
		o(expectedResult).equals(c1String)
		contact1.mailAddresses[0].type = ContactAddressType.OTHER
		c1String = _vCardFormatArrayToString(_addressesToVCardAddresses(contact1.mailAddresses), "EMAIL")
		expectedResult = `EMAIL:antste@antste.de\nEMAIL:bentste@bentste.de\n`
		o(expectedResult).equals(c1String)
	})
	o("phoneNumbersToVCardString", function () {
		let contact1 = createFilledContact(
			"Ant",
			"Ste",
			"Hello World!",
			"Tutao",
			"Mr.",
			"Buffalo",
			"Lange",
			"Jr.",
			"IT",
			["antste@antste.de", "bentste@bentste.de"],
			["123123123", "321321321"],
			["diaspora.de"],
			["Housestreet 123\nTown 123\nState 123\nCountry 123"],
		)

		let c1String = _vCardFormatArrayToString(_phoneNumbersToVCardPhoneNumbers(contact1.phoneNumbers), "TEL")

		let expectedResult = `TEL;TYPE=work:123123123\nTEL;TYPE=work:321321321\n`
		o(expectedResult).equals(c1String)
		contact1.phoneNumbers[0].type = ContactPhoneNumberType.PRIVATE
		c1String = _vCardFormatArrayToString(_phoneNumbersToVCardPhoneNumbers(contact1.phoneNumbers), "TEL")
		expectedResult = `TEL;TYPE=home:123123123\nTEL;TYPE=work:321321321\n`
		o(expectedResult).equals(c1String)
		contact1.phoneNumbers[1].type = ContactPhoneNumberType.CUSTOM
		c1String = _vCardFormatArrayToString(_phoneNumbersToVCardPhoneNumbers(contact1.phoneNumbers), "TEL")
		expectedResult = `TEL;TYPE=home:123123123\nTEL:321321321\n`
		o(expectedResult).equals(c1String)
		contact1.phoneNumbers[0].type = ContactPhoneNumberType.OTHER
		c1String = _vCardFormatArrayToString(_phoneNumbersToVCardPhoneNumbers(contact1.phoneNumbers), "TEL")
		expectedResult = `TEL:123123123\nTEL:321321321\n`
		o(expectedResult).equals(c1String)
		contact1.phoneNumbers[0].type = ContactPhoneNumberType.FAX
		c1String = _vCardFormatArrayToString(_phoneNumbersToVCardPhoneNumbers(contact1.phoneNumbers), "TEL")
		expectedResult = `TEL;TYPE=fax:123123123\nTEL:321321321\n`
		o(expectedResult).equals(c1String)
	})
	o("socialIdsToVCardString", function () {
		let contact1 = createFilledContact(
			"Ant",
			"Ste",
			"Hello World!",
			"Tutao",
			"Mr.",
			"Buffalo",
			"Lange",
			"Jr.",
			"IT",
			["antste@antste.de", "bentste@bentste.de"],
			["123123123", "321321321"],
			["TutanotaTeam", "xing.com", "facebook.de"],
			["Housestreet 123\nTown 123\nState 123\nCountry 123"],
		)

		contact1.socialIds[0].type = ContactSocialType.LINKED_IN

		let c1String = _vCardFormatArrayToString(_socialIdsToVCardSocialUrls(contact1.socialIds), "URL")
		let expectedResult = `URL:https://www.linkedin.com/in/TutanotaTeam\nURL:https://www.xing.com\nURL:https://www.facebook.de\n`
		o(expectedResult).equals(c1String)
		contact1.socialIds[0].type = ContactSocialType.TWITTER
		c1String = _vCardFormatArrayToString(_socialIdsToVCardSocialUrls(contact1.socialIds), "URL")
		expectedResult = `URL:https://www.twitter.com/TutanotaTeam\nURL:https://www.xing.com\nURL:https://www.facebook.de\n`
		o(expectedResult).equals(c1String)
		contact1.socialIds[1].type = ContactSocialType.CUSTOM
		c1String = _vCardFormatArrayToString(_socialIdsToVCardSocialUrls(contact1.socialIds), "URL")
		expectedResult = `URL:https://www.twitter.com/TutanotaTeam\nURL:https://www.xing.com\nURL:https://www.facebook.de\n`
		o(expectedResult).equals(c1String)
		contact1.socialIds[1].type = ContactSocialType.OTHER
		c1String = _vCardFormatArrayToString(_socialIdsToVCardSocialUrls(contact1.socialIds), "URL")
		expectedResult = `URL:https://www.twitter.com/TutanotaTeam\nURL:https://www.xing.com\nURL:https://www.facebook.de\n`
		o(expectedResult).equals(c1String)
		contact1.socialIds[0].type = ContactSocialType.FACEBOOK
		c1String = _vCardFormatArrayToString(_socialIdsToVCardSocialUrls(contact1.socialIds), "URL")
		expectedResult = `URL:https://www.facebook.com/TutanotaTeam\nURL:https://www.xing.com\nURL:https://www.facebook.de\n`
		o(expectedResult).equals(c1String)
	})
	o("testSpecialCharsInVCard", function () {
		let a = `BEGIN:VCARD\nVERSION:3.0\nFN:Mr. John\\;Quinlan Public\nN:Public;John\\;Quinlan;;Mr.;\nBDAY:2016-09-09\nADR:Die Heide 81\\nBasche\nNOTE:Hello World\\nHier ist ein Umbruch\nEND:VCARD\n\n`
		let b = createTestEntity(ContactTypeRef)
		let bday = createTestEntity(BirthdayTypeRef)
		let contacts = [b]
		b._ownerGroup = ""
		b.addresses[0] = {
			_type: ContactAddressTypeRef,
			_id: neverNull(null),
			address: "Die Heide 81\nBasche",
			customTypeName: "",
			type: "2",
		}
		b.firstName = "John;Quinlan"
		b.lastName = "Public"
		b.comment = "Hello World\nHier ist ein Umbruch"
		b.company = ""
		b.role = ""
		b.title = "Mr."
		b.nickname = neverNull(null)
		b.birthdayIso = "2016-09-09"
		o(JSON.stringify(contactsToVCard(contacts))).equals(JSON.stringify(a))
	})
	o("import export roundtrip", function () {
		const cString = `BEGIN:VCARD
VERSION:3.0
FN:Mr. John\\;Quinlan Public
N:Public;John\\;Quinlan;;Mr.;
BDAY:2016-09-09
ADR:Die Heide 81\\nBasche
NOTE:Hello World\\nHier ist ein Umbruch
END:VCARD

BEGIN:VCARD
VERSION:3.0
FN:Mr. Ant Ste
N:Ste;Ant;;Mr.;
NICKNAME:Buffalo
ADR;TYPE=work:Housestreet 123\\nTown 123\\nState 123\\nCountry 123 this is so \n there is a line break in this contact
EMAIL;TYPE=work:antste@antste.de
EMAIL;TYPE=work:bentste@bentste.de
TEL;TYPE=work:123123123
TEL;TYPE=work:321321321
URL:https://www.diaspora.de
ORG:Tutao
NOTE:Hello World!
END:VCARD

BEGIN:VCARD
VERSION:3.0
FN:Mr. Ant Ste
N:Ste;Ant;;Mr.;
NICKNAME:Buffalo
ADR;TYPE=work:Housestreet 123\\nTown 123\\nState 123\\nCountry 123
EMAIL;TYPE=work:antste@antste.de
EMAIL;TYPE=work:bentste@bentste.de
TEL;TYPE=work:123123123
TEL;TYPE=work:321321321
URL:https://www.diaspora.de
ORG:Tutao
NOTE:Hello World!
END:VCARD

`
		o(contactsToVCard(vCardListToContacts(neverNull(vCardFileToVCards(cString)), ""))).equals(cString)
	})
})

export function createFilledContact(
	firstName: string,
	lastName: string,
	comment: string,
	company: string,
	title: string,
	nickname: string,
	middleName: string,
	nameSuffix: string,
	department: string,
	emailAddresses?: string[] | null | undefined,
	phoneNumbers?: string[] | null | undefined,
	socialIds?: Array<string | string[]> | null | undefined,
	addresses?: string[] | null | undefined,
	websites?: Array<string>,
	birthdayIso?: string | null | undefined,
): Contact {
	let c = createTestEntity(ContactTypeRef)
	c._id = ["0", String(idCounter++)]
	c.firstName = firstName
	c.lastName = lastName

	if (emailAddresses) {
		for (const m of emailAddresses) {
			let a = createTestEntity(ContactMailAddressTypeRef)
			a.address = m
			a.type = ContactAddressType.WORK
			a.customTypeName = ""
			c.mailAddresses.push(a)
		}
	}

	if (phoneNumbers) {
		for (const m of phoneNumbers) {
			let a = createTestEntity(ContactPhoneNumberTypeRef)
			a.number = m
			a.type = ContactAddressType.WORK
			a.customTypeName = ""
			c.phoneNumbers.push(a)
		}
	}

	if (addresses) {
		for (const m of addresses) {
			let a = createTestEntity(ContactAddressTypeRef)
			a.address = m
			a.type = ContactAddressType.WORK
			a.customTypeName = ""
			c.addresses.push(a)
		}
	}

	if (socialIds) {
		for (const m of socialIds) {
			let a = createTestEntity(ContactSocialIdTypeRef)
			if (typeof m === "string") {
				a.socialId = m
				a.type = ContactSocialType.OTHER
			} else {
				a.socialId = m[0]
				a.type = m[1] || ContactSocialType.OTHER
			}
			a.customTypeName = ""
			c.socialIds.push(a)
		}
	}

	if (websites) {
		for (const website of websites) {
			let entity = createTestEntity(ContactWebsiteTypeRef)
			entity.url = website
			entity.type = ContactWebsiteType.OTHER
			c.websites.push(entity)
		}
	}

	c.title = title
	c.comment = comment
	c.company = company
	c.nickname = nickname
	c.birthdayIso = birthdayIso ?? null
	c.middleName = middleName
	c.nameSuffix = nameSuffix
	c.department = department
	return c
}
