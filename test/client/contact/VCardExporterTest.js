// @flow
import o from "ospec/ospec.js"
import {createContact} from "../../../src/api/entities/tutanota/Contact"
import {createContactAddress, ContactAddressTypeRef} from "../../../src/api/entities/tutanota/ContactAddress"
import {createContactPhoneNumber} from "../../../src/api/entities/tutanota/ContactPhoneNumber"
import {createContactMailAddress} from "../../../src/api/entities/tutanota/ContactMailAddress"
import {createContactSocialId} from "../../../src/api/entities/tutanota/ContactSocialId"
import {ContactSocialType, ContactAddressType, ContactPhoneNumberType} from "../../../src/api/common/TutanotaConstants"
import {
	contactsToVCard,
	_vCardFormatArrayToString,
	_addressesToVCardAddresses,
	_phoneNumbersToVCardPhoneNumbers,
	_socialIdsToVCardSocialUrls
} from "../../../src/contacts/VCardExporter"
import {createBirthday} from "../../../src/api/entities/tutanota/Birthday"
import {neverNull} from "../../../src/api/common/utils/Utils"
import {vCardListToContacts, vCardFileToVCards} from "../../../src/contacts/VCardImporter"

let idCounter = 0

o.spec("VCardExporterTest", function () {

	//turns given contacts into a vCard format string
	o("contactsToVCardsTest", function () {
		let contactArray = []
		let contact1 = createFilledContact("Ant", "Ste", "Hello World!", "Tutao", "Mr.", "Buffalo", ["antste@antste.de", "bentste@bentste.de"], ["123123123", "321321321"], ["diaspora.de"], ["Housestreet 123\nTown 123\nState 123\nCountry 123"])
		contactArray.push(contact1)
		let c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:Mr. Ant Ste\nN:Ste;Ant;;Mr.;\nNICKNAME:Buffalo\nADR;TYPE=work:Housestreet 123\\nTown 123\\nState 123\\nCountry 123\nEMAIL;TYPE=work:antste@antste.de\nEMAIL;TYPE=work:bentste@bentste.de\nTEL;TYPE=work:123123123\nTEL;TYPE=work:321321321\nURL:diaspora.de\nORG:Tutao\nNOTE:Hello World!\nEND:VCARD\n\n`
		o(contactsToVCard(contactArray)).equals(c1String)

		contactArray = []
		contact1 = createFilledContact("", "", "", "", "", "", [], [], [], [])
		c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:\nN:;;;;\nEND:VCARD\n\n`
		contactArray.push(contact1)
		o(contactsToVCard(contactArray)).equals(c1String)

		contactArray = []
		contact1 = createFilledContact("Ant", "", "", "", "", "", [], [], [], [])
		c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:Ant\nN:;Ant;;;\nEND:VCARD\n\n`
		contactArray.push(contact1)
		o(contactsToVCard(contactArray)).equals(c1String)

		contact1 = createFilledContact("Ant", "Tut", "", "", "", "", [], [], [], [])
		c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:Ant\nN:;Ant;;;\nEND:VCARD\n\nBEGIN:VCARD\nVERSION:3.0\nFN:Ant Tut\nN:Tut;Ant;;;\nEND:VCARD\n\n`
		contactArray.push(contact1)
		o(contactsToVCard(contactArray)).equals(c1String)

		contact1 = createFilledContact("Ant", "Ste", "Hello World!", "Tutao", "Mr.", "Buffalo", ["antste@antste.de", "bentste@bentste.de"], ["123123123", "321321321"], ["diaspora.de"], ["Housestreet 123\nTown 123\nState 123\nCountry 123"])
		c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:Ant\nN:;Ant;;;\nEND:VCARD\n\nBEGIN:VCARD\nVERSION:3.0\nFN:Ant Tut\nN:Tut;Ant;;;\nEND:VCARD\n\nBEGIN:VCARD\nVERSION:3.0\nFN:Mr. Ant Ste\nN:Ste;Ant;;Mr.;\nNICKNAME:Buffalo\nADR;TYPE=work:Housestreet 123\\nTown 123\\nState 123\\nCountry 123\nEMAIL;TYPE=work:antste@antste.de\nEMAIL;TYPE=work:bentste@bentste.de\nTEL;TYPE=work:123123123\nTEL;TYPE=work:321321321\nURL:diaspora.de\nORG:Tutao\nNOTE:Hello World!\nEND:VCARD\n\n`
		contactArray.push(contact1)
		o(contactsToVCard(contactArray)).equals(c1String)

		contactArray = []
		contact1 = createFilledContact("Ant", "Ste", "Hello World!", "Tutao", "Mr.", "Buffalo", ["antste@antste.de", "bentste@bentste.de"], ["123123123", "321321321"], ["diaspora.de"], ["Housestreet 123\nTown 123\nState 123\nCountry 123"])
		contactArray.push(contact1)
		contactArray.push(contact1)
		c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:Mr. Ant Ste\nN:Ste;Ant;;Mr.;\nNICKNAME:Buffalo\nADR;TYPE=work:Housestreet 123\\nTown 123\\nState 123\\nCountry 123\nEMAIL;TYPE=work:antste@antste.de\nEMAIL;TYPE=work:bentste@bentste.de\nTEL;TYPE=work:123123123\nTEL;TYPE=work:321321321\nURL:diaspora.de\nORG:Tutao\nNOTE:Hello World!\nEND:VCARD\n
BEGIN:VCARD\nVERSION:3.0\nFN:Mr. Ant Ste\nN:Ste;Ant;;Mr.;\nNICKNAME:Buffalo\nADR;TYPE=work:Housestreet 123\\nTown 123\\nState 123\\nCountry 123\nEMAIL;TYPE=work:antste@antste.de\nEMAIL;TYPE=work:bentste@bentste.de\nTEL;TYPE=work:123123123\nTEL;TYPE=work:321321321\nURL:diaspora.de\nORG:Tutao\nNOTE:Hello World!\nEND:VCARD\n\n`
		o(contactsToVCard(contactArray)).equals(c1String)

		contactArray = []
		contact1 = createFilledContact("Ant", "Ste", "", "Tutao", "Mr.", "", ["antste@antste.de", "bentste@bentste.de"], ["123123123", "321321321"], [], ["Housestreet 123\nTown 123\nState 123\nCountry 123"])
		contactArray.push(contact1)
		contact1 = createFilledContact("Bob", "Kev", "", "Tuta", "Phd.", "", ["bobkev@antste.de", "bobkev@bentste.de"], ["89", "78"], [], ["Housestreet 890\nTown 098\nState 098\nCountry 789"])
		contactArray.push(contact1)
		c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:Mr. Ant Ste\nN:Ste;Ant;;Mr.;\nADR;TYPE=work:Housestreet 123\\nTown 123\\nState 123\\nCountry 123\nEMAIL;TYPE=work:antste@antste.de\nEMAIL;TYPE=work:bentste@bentste.de\nTEL;TYPE=work:123123123\nTEL;TYPE=work:321321321\nORG:Tutao\nEND:VCARD\n
BEGIN:VCARD\nVERSION:3.0\nFN:Phd. Bob Kev\nN:Kev;Bob;;Phd.;\nADR;TYPE=work:Housestreet 890\\nTown 098\\nState 098\\nCountry 789\nEMAIL;TYPE=work:bobkev@antste.de\nEMAIL;TYPE=work:bobkev@bentste.de\nTEL;TYPE=work:89\nTEL;TYPE=work:78\nORG:Tuta\nEND:VCARD\n\n`
		o(contactsToVCard(contactArray)).equals(c1String)
	})

	o("birthdayToVCardsFormatString", function () {
		//oldBirthday
		let contactArray = []
		let contact1 = createFilledContact("Ant", "", "", "", "", "", [], [], [], [])
		let timestamp = new Date("09/09/2000").getTime()
		contact1.oldBirthday = new Date(timestamp)
		let c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:Ant\nN:;Ant;;;\nBDAY:2000-09-09\nEND:VCARD\n\n`
		contactArray.push(contact1)
		o(contactsToVCard(contactArray)).equals(c1String)

		contactArray = []
		contact1 = createFilledContact("Ant", "", "", "", "", "", [], [], [], [])
		timestamp = new Date("10/10/2000").getTime()
		contact1.oldBirthday = new Date(timestamp)
		c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:Ant\nN:;Ant;;;\nBDAY:2000-10-10\nEND:VCARD\n\n`
		contactArray.push(contact1)
		o(contactsToVCard(contactArray)).equals(c1String)

		contactArray = []
		contact1 = createFilledContact("Ant", "", "", "", "", "", [], [], [], [])
		timestamp = new Date("10/10/1800").getTime()
		contact1.oldBirthday = new Date(timestamp)
		c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:Ant\nN:;Ant;;;\nBDAY:1800-10-10\nEND:VCARD\n\n`
		contactArray.push(contact1)
		o(contactsToVCard(contactArray)).equals(c1String)


		//Birthday
		contactArray = []
		contact1 = createFilledContact("Ant", "", "", "", "", "", [], [], [], [])
		let bday = createBirthday()
		bday.day = "09"
		bday.month = "09"
		bday.year = "2000"
		contact1.birthday = bday
		c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:Ant\nN:;Ant;;;\nBDAY:2000-09-09\nEND:VCARD\n\n`
		contactArray.push(contact1)
		o(contactsToVCard(contactArray)).equals(c1String)

		contactArray = []
		contact1 = createFilledContact("Ant", "", "", "", "", "", [], [], [], [])
		bday = createBirthday()
		bday.day = "9"
		bday.month = "9"
		bday.year = "2000"
		contact1.birthday = bday
		c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:Ant\nN:;Ant;;;\nBDAY:2000-09-09\nEND:VCARD\n\n`
		contactArray.push(contact1)
		o(contactsToVCard(contactArray)).equals(c1String)

		contactArray = []
		contact1 = createFilledContact("Ant", "", "", "", "", "", [], [], [], [])
		bday = createBirthday()
		bday.day = "10"
		bday.month = "10"
		bday.year = "1991"
		contact1.birthday = bday
		c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:Ant\nN:;Ant;;;\nBDAY:1991-10-10\nEND:VCARD\n\n`
		contactArray.push(contact1)
		o(contactsToVCard(contactArray)).equals(c1String)

		contactArray = []
		contact1 = createFilledContact("Ant", "", "", "", "", "", [], [], [], [])
		bday = createBirthday()
		bday.day = "10"
		bday.month = "10"
		bday.year = "1991"
		contact1.birthday = bday
		c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:Ant\nN:;Ant;;;\nBDAY:1991-10-10\nEND:VCARD\n\n`
		contactArray.push(contact1)
		o(contactsToVCard(contactArray)).equals(c1String)

		contactArray = []
		contact1 = createFilledContact("Ant", "", "", "", "", "", [], [], [], [])
		bday = createBirthday()
		bday.day = "10"
		bday.month = "10"
		bday.year = "1943"
		contact1.birthday = bday
		c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:Ant\nN:;Ant;;;\nBDAY:1943-10-10\nEND:VCARD\n\n`
		contactArray.push(contact1)
		o(contactsToVCard(contactArray)).equals(c1String)

		contactArray = []
		contact1 = createFilledContact("Ant", "", "", "", "", "", [], [], [], [])
		bday = createBirthday()
		bday.day = "10"
		bday.month = "10"
		bday.year = "1800"
		contact1.birthday = bday
		c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:Ant\nN:;Ant;;;\nBDAY:1800-10-10\nEND:VCARD\n\n`
		contactArray.push(contact1)
		o(contactsToVCard(contactArray)).equals(c1String)


		contactArray = []
		contact1 = createFilledContact("Ant", "", "", "", "", "", [], [], [], [])
		bday = createBirthday()
		bday.day = "10"
		bday.month = "10"
		bday.year = null
		contact1.birthday = bday
		c1String = `BEGIN:VCARD\nVERSION:3.0\nFN:Ant\nN:;Ant;;;\nBDAY:1111-10-10\nEND:VCARD\n\n`
		contactArray.push(contact1)
		o(contactsToVCard(contactArray)).equals(c1String)
	})

	o("contactsToVCardsTestMoreThan75CharContentLine", function () {

		let contactArray = []
		//todo Birthday test
		let contact1 = createFilledContact("Ant", "Ste", "Hello World!", "Tutao", "Mr.", "Buffalo", ["antste@antste.de", "bentste@bentste.de"], ["123123123", "321321321"], ["diaspora.de"], ["Housestreet 123\nTown 123\nState 123\nCountry 123 this is so there is a line break in this contact"])
		contactArray.push(contact1)
		let c1String = `BEGIN:VCARD
VERSION:3.0
FN:Mr. Ant Ste
N:Ste;Ant;;Mr.;
NICKNAME:Buffalo
ADR;TYPE=work:Housestreet 123\\nTown 123\\nState 123\\nCountry 123 this is so 
 there is a line break in this contact
EMAIL;TYPE=work:antste@antste.de
EMAIL;TYPE=work:bentste@bentste.de
TEL;TYPE=work:123123123
TEL;TYPE=work:321321321
URL:diaspora.de
ORG:Tutao
NOTE:Hello World!
END:VCARD

`
		o(contactsToVCard(contactArray)).equals(c1String)
		contactArray = []
		contact1 = createFilledContact("Ant", "Ste", "Hello World!", "Tutao is the best mail client for your privacy just go for it and youll see it will be amazing!!!!!", "Mr.", "Buffalo", ["antste@antste.de", "bentste@bentste.de"], ["123123123", "321321321"], ["diaspora.de", "facebook.com/aaaa/bbb/cccccc/DDDDDDD/llllllll/uuuuuuu/ppppp/aaaaaaaaaaaaaaaaaaaaa"], ["Housestreet 123\nTown 123\nState 123\nCountry 123 this is so there is a line break in this contact"])
		contactArray.push(contact1)
		c1String = `BEGIN:VCARD
VERSION:3.0
FN:Mr. Ant Ste
N:Ste;Ant;;Mr.;
NICKNAME:Buffalo
ADR;TYPE=work:Housestreet 123\\nTown 123\\nState 123\\nCountry 123 this is so 
 there is a line break in this contact
EMAIL;TYPE=work:antste@antste.de
EMAIL;TYPE=work:bentste@bentste.de
TEL;TYPE=work:123123123
TEL;TYPE=work:321321321
URL:diaspora.de
URL:facebook.com/aaaa/bbb/cccccc/DDDDDDD/llllllll/uuuuuuu/ppppp/aaaaaaaaaaa
 aaaaaaaaaa
ORG:Tutao is the best mail client for your privacy just go for it and youll
  see it will be amazing!!!!!
NOTE:Hello World!
END:VCARD

`
		o(contactsToVCard(contactArray)).equals(c1String)


	})

	o("contactsToVCardsEscapingTest", function () {

		let contactArray = []
		//todo Birthday test
		let contact1 = createFilledContact("Ant,", "Ste;", "Hello::: World!", "Tutao;:", "Mr.:", "Buffalo;p", [":antste@antste.de;", "bentste@bent:ste.de"], ["1;23123123", "32132:1321"], ["https://diaspora.de"], ["Housestreet 123\nTo:wn 123\nState 123\nCountry 123"])
		contactArray.push(contact1)
		let c1String = `BEGIN:VCARD
VERSION:3.0
FN:Mr.\\: Ant\\, Ste\\;
N:Ste\\;;Ant\\,;;Mr.\\:;
NICKNAME:Buffalo\\;p
ADR;TYPE=work:Housestreet 123\\nTo\\:wn 123\\nState 123\\nCountry 123
EMAIL;TYPE=work:\\:antste@antste.de\\;
EMAIL;TYPE=work:bentste@bent\\:ste.de
TEL;TYPE=work:1\\;23123123
TEL;TYPE=work:32132\\:1321
URL:https\\://diaspora.de
ORG:Tutao\\;\\:
NOTE:Hello\\:\\:\\: World!
END:VCARD

`
		o(contactsToVCard(contactArray)).equals(c1String)
	})

	o("addressesToVcardFormatString", function () {

		let contact1 = createFilledContact("Ant", "Ste", "Hello World!", "Tutao", "Mr.", "Buffalo", ["antste@antste.de", "bentste@bentste.de"], ["123123123", "321321321"], ["diaspora.de"], ["Housestreet 123\nTown 123\nState 123\nCountry 123"])
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
		let contact1 = createFilledContact("Ant", "Ste", "Hello World!", "Tutao", "Mr.", "Buffalo", ["antste@antste.de", "bentste@bentste.de"], ["123123123", "321321321"], ["diaspora.de"], ["Housestreet 123\nTown 123\nState 123\nCountry 123"])
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
		let contact1 = createFilledContact("Ant", "Ste", "Hello World!", "Tutao", "Mr.", "Buffalo", ["antste@antste.de", "bentste@bentste.de"], ["123123123", "321321321"], ["diaspora.de"], ["Housestreet 123\nTown 123\nState 123\nCountry 123"])
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
		let contact1 = createFilledContact("Ant", "Ste", "Hello World!", "Tutao", "Mr.", "Buffalo", ["antste@antste.de", "bentste@bentste.de"], ["123123123", "321321321"], ["diaspora.de", "xing.com", "facebook.de"], ["Housestreet 123\nTown 123\nState 123\nCountry 123"])
		let c1String = _vCardFormatArrayToString(_socialIdsToVCardSocialUrls(contact1.socialIds), "URL")
		let expectedResult = `URL:diaspora.de\nURL:xing.com\nURL:facebook.de\n`
		o(expectedResult).equals(c1String)

		contact1.socialIds[0].type = ContactSocialType.TWITTER
		c1String = _vCardFormatArrayToString(_socialIdsToVCardSocialUrls(contact1.socialIds), "URL")
		expectedResult = `URL:diaspora.de\nURL:xing.com\nURL:facebook.de\n`
		o(expectedResult).equals(c1String)

		contact1.socialIds[1].type = ContactSocialType.CUSTOM
		c1String = _vCardFormatArrayToString(_socialIdsToVCardSocialUrls(contact1.socialIds), "URL")
		expectedResult = `URL:diaspora.de\nURL:xing.com\nURL:facebook.de\n`
		o(expectedResult).equals(c1String)

		contact1.socialIds[0].type = ContactSocialType.OTHER
		c1String = _vCardFormatArrayToString(_socialIdsToVCardSocialUrls(contact1.socialIds), "URL")
		expectedResult = `URL:diaspora.de\nURL:xing.com\nURL:facebook.de\n`
		o(expectedResult).equals(c1String)

		contact1.socialIds[0].type = ContactSocialType.FACEBOOK
		c1String = _vCardFormatArrayToString(_socialIdsToVCardSocialUrls(contact1.socialIds), "URL")
		expectedResult = `URL:diaspora.de\nURL:xing.com\nURL:facebook.de\n`
		o(expectedResult).equals(c1String)

	})

	o("testSpecialCharsInVCard", function () {
		let a = `BEGIN:VCARD\nVERSION:3.0\nFN:Mr. John\\;Quinlan Public\nN:Public;John\\;Quinlan;;Mr.;\nBDAY:2016-09-09\nADR:Die Heide 81\\nBasche\nNOTE:Hello World\\nHier ist ein Umbruch\nEND:VCARD\n\n`

		let b = createContact()
		let bday = createBirthday()
		let contacts = [b]
		b._owner = ""
		b._ownerGroup = ""
		b.addresses[0] = {
			_type: ContactAddressTypeRef,
			_id: neverNull(null),
			address: 'Die Heide 81\nBasche',
			customTypeName: '',
			type: '2'
		}
		b.firstName = "John;Quinlan"
		b.lastName = "Public"
		b.oldBirthday = new Date("09/09/2016")
		b.comment = "Hello World\nHier ist ein Umbruch"
		b.company = ""
		b.role = ""
		b.title = "Mr."
		b.nickname = neverNull(null)
		bday.day = "09"
		bday.month = "09"
		bday.year = "2016"
		b.birthday = bday
		o(JSON.stringify(contactsToVCard(contacts))).deepEquals(JSON.stringify(a))
	})

	o("testVCardImportToExport", function () {
		let cString = `BEGIN:VCARD
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
ADR;TYPE=work:Housestreet 123\\nTown 123\\nState 123\\nCountry 123 this is so 
 there is a line break in this contact
EMAIL;TYPE=work:antste@antste.de
EMAIL;TYPE=work:bentste@bentste.de
TEL;TYPE=work:123123123
TEL;TYPE=work:321321321
URL:diaspora.de
ORG:Tutao
NOTE:Hello World!
END:VCARD

BEGIN:VCARD\nVERSION:3.0\nFN:Mr. Ant Ste\nN:Ste;Ant;;Mr.;\nNICKNAME:Buffalo\nADR;TYPE=work:Housestreet 123\\nTown 123\\nState 123\\nCountry 123\nEMAIL;TYPE=work:antste@antste.de\nEMAIL;TYPE=work:bentste@bentste.de\nTEL;TYPE=work:123123123\nTEL;TYPE=work:321321321\nURL:diaspora.de\nORG:Tutao\nNOTE:Hello World!\nEND:VCARD\n\n`

		o(contactsToVCard(vCardListToContacts(neverNull(vCardFileToVCards(cString)), ""))).equals(cString)

	})


})


export function createFilledContact(firstName: string, lastName: string, comment: string, company: string, title: string, nickname: string, emailAddresses: ?string[], phoneNumbers: ?string[], socialIds: ?string[], addresses: ?string[], oldBirthday: ?Date, newBirthdayDay: ?number, newBirthdayMonth: ?number, newBirthdayYear: ?number) {
	let c = createContact()
	c._id = ["0", String(idCounter++)]
	c.firstName = firstName
	c.lastName = lastName
	if (emailAddresses) {
		emailAddresses.map(m => {
			let a = createContactMailAddress()
			a.address = m
			a.type = ContactAddressType.WORK
			a.customTypeName = ""
			c.mailAddresses.push(a)
		})
	}
	if (phoneNumbers) {
		phoneNumbers.map(m => {
			let a = createContactPhoneNumber()
			a.number = m
			a.type = ContactAddressType.WORK
			a.customTypeName = ""
			c.phoneNumbers.push(a)
		})
	}
	if (addresses) {
		addresses.map(m => {
			let a = createContactAddress()
			a.address = m
			a.type = ContactAddressType.WORK
			a.customTypeName = ""
			c.addresses.push(a)
		})
	}
	if (socialIds) {
		socialIds.map(m => {
			let a = createContactSocialId()
			a.socialId = m
			a.type = ContactSocialType.TWITTER
			a.customTypeName = ""
			c.socialIds.push(a)
		})
	}
	c.title = title
	c.comment = comment
	c.company = company
	c.nickname = nickname
	if (oldBirthday) {
		c.oldBirthday = oldBirthday
	}
	if (newBirthdayDay && newBirthdayMonth) {
		c.birthday = createBirthday()
		neverNull(c.birthday).day = String(newBirthdayDay)
		neverNull(c.birthday).month = String(newBirthdayMonth)
		neverNull(c.birthday).year = newBirthdayYear ? String(newBirthdayYear) : null
	}
	return c
}


