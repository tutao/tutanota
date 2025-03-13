import o from "@tutao/otest"
import {
	ContactAddressTypeRef,
	ContactMailAddressTypeRef,
	ContactPhoneNumberTypeRef,
	ContactTypeRef,
	createContact,
	createContactAddress,
	createContactMailAddress,
	createContactPhoneNumber,
	createMailAddress,
} from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { neverNull } from "@tutao/tutanota-utils"
import { vCardFileToVCards, vCardListToContacts } from "../../../src/mail-app/contacts/VCardImporter.js"
// @ts-ignore[untyped-import]
import en from "../../../src/mail-app/translations/en.js"
import { lang } from "../../../src/common/misc/LanguageViewModel.js"
import { createTestEntity } from "../TestUtils.js"

o.spec("VCardImporterTest", function () {
	o.before(async function () {
		// @ts-ignore
		window.whitelabelCustomizations = null

		if (globalThis.isBrowser) {
			globalThis.TextDecoder = window.TextDecoder
		} else {
			// @ts-ignore
			globalThis.TextDecoder = (await import("node:util")).TextDecoder
		}

		lang.init(en)
	})
	o("testFileToVCards", function () {
		let str = `BEGIN:VCARD
VERSION:3.0
FN:proto type
N:type;proto;;;
ADR;TYPE=HOME,PREF:;;Humboldstrasse 5;\nBerlin;;12345;Deutschland
END:VCARD

BEGIN:VCARD
VERSION:3.0
FN:Test Kontakt
N:Kontakt;Test;;;
ORG:Tuta
BDAY:2001-01-01
EMAIL;TYPE=WORK:k1576147@mvrht.net
TEL;TYPE=CELL,WORK:123456789
TEL;TYPE=VOICE,HOME:789456123
ADR;TYPE=WORK:;;Strasse 30, 67890 hamburg ;;;;
END:VCARD

`
		let expected = [
			`VERSION:3.0
FN:proto type
N:type;proto;;;
ADR;TYPE=HOME,PREF:;;Humboldstrasse 5;\nBerlin;;12345;Deutschland`,
			`VERSION:3.0
FN:Test Kontakt
N:Kontakt;Test;;;
ORG:Tuta
BDAY:2001-01-01
EMAIL;TYPE=WORK:k1576147@mvrht.net
TEL;TYPE=CELL,WORK:123456789
TEL;TYPE=VOICE,HOME:789456123
ADR;TYPE=WORK:;;Strasse 30, 67890 hamburg ;;;;`,
		]
		//prepares for further usage --> removes Begin and End tag and pushes the content between those tags into an array
		o(vCardFileToVCards(str)!).deepEquals(expected)
	})
	o("testImportEmpty", function () {
		o(vCardFileToVCards("")).equals(null)
	})
	o("testImportWithoutLinefeed", function () {
		let str = `BEGIN:VCARD
VERSION:3.0
FN:proto type
N:type;proto;;;
ADR;TYPE=HOME,PREF:;;Humboldstrasse 5;\nBerlin;;12345;Deutschlan
 d
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:Test Kontakt
N:Kontakt;Test;;;
ORG:Tuta
BDAY:2001-01-01
EMAIL;TYPE=WORK:k1576147@mvrht.net
TEL;TYPE=CELL,WORK:123456789
TEL;TYPE=VOICE,HOME:789456123
ADR;TYPE=WORK:;;Strasse 30, 67890 hamburg ;;;;
END:VCARD`
		let expected = [
			`VERSION:3.0
FN:proto type
N:type;proto;;;
ADR;TYPE=HOME,PREF:;;Humboldstrasse 5;\nBerlin;;12345;Deutschland`,
			`VERSION:3.0
FN:Test Kontakt
N:Kontakt;Test;;;
ORG:Tuta
BDAY:2001-01-01
EMAIL;TYPE=WORK:k1576147@mvrht.net
TEL;TYPE=CELL,WORK:123456789
TEL;TYPE=VOICE,HOME:789456123
ADR;TYPE=WORK:;;Strasse 30, 67890 hamburg ;;;;`,
		]
		//Unfolding lines for content lines longer than 75 characters
		o(vCardFileToVCards(str)!).deepEquals(expected)
	})
	o("TestBEGIN:VCARDinFile", function () {
		let str = `BEGIN:VCARD
VERSION:3.0
FN:proto type
N:type;proto;;;
ADR;TYPE=HOME,PREF:;;Humboldstrasse 5;\\nBerlin;;12345;Deutschland
END:VCARD

BEGIN:VCARD
VERSION:3.0
FN:Test Kontakt
N:Kontakt;Test;;;
ORG:Tuta
BDAY:2001-01-01
EMAIL;TYPE=WORK:k1576147@mvrht.net
TEL;TYPE=CELL,WORK:123456789
TEL;TYPE=VOICE,HOME:789456123
ADR;TYPE=WORK:;;Strasse 30\\, 67890 hamburg ;;;;
NOTE:BEGIN:VCARD\\n i Love VCARDS;
END:VCARD

`
		let expected = [
			`VERSION:3.0
FN:proto type
N:type;proto;;;
ADR;TYPE=HOME,PREF:;;Humboldstrasse 5;\\nBerlin;;12345;Deutschland`,
			`VERSION:3.0
FN:Test Kontakt
N:Kontakt;Test;;;
ORG:Tuta
BDAY:2001-01-01
EMAIL;TYPE=WORK:k1576147@mvrht.net
TEL;TYPE=CELL,WORK:123456789
TEL;TYPE=VOICE,HOME:789456123
ADR;TYPE=WORK:;;Strasse 30\\, 67890 hamburg ;;;;
NOTE:BEGIN:VCARD\\n i Love VCARDS;`,
		]
		o(vCardFileToVCards(str)!).deepEquals(expected)
	})
	o("windowsLinebreaks", function () {
		let str =
			"BEGIN:VCARD\r\nVERSION:3.0\r\nFN:proto type\r\nN:type;proto;;;\r\nADR;TYPE=HOME,PREF:;;Humboldstrasse 5;\\nBerlin;;12345;Deutschland\r\nEND:VCARD\r\n"
		let expected = [
			`VERSION:3.0
FN:proto type
N:type;proto;;;
ADR;TYPE=HOME,PREF:;;Humboldstrasse 5;\\nBerlin;;12345;Deutschland`,
		]
		o(vCardFileToVCards(str)!).deepEquals(expected)
	})
	o("testToContactNames", function () {
		const vcardData = ["N:Public\\\\;John\\;Quinlan;Lange;Mr.;Esq.\nBDAY:2016-09-09\nADR:Die Heide 81\\nBasche\nNOTE:Hello World\\nHier ist ein Umbruch"]
		const parsedContacts = vCardListToContacts(vcardData, "")
		const expectedContact = createContact({
			_ownerGroup: "",
			firstName: "John;Quinlan",
			lastName: "Public\\",
			role: "",
			company: "",
			oldBirthdayDate: null,
			comment: "Hello World\nHier ist ein Umbruch",
			presharedPassword: null,
			nickname: null,
			title: "Mr.",
			birthdayIso: "2016-09-09",
			middleName: "Lange",
			nameSuffix: "Esq.",
			phoneticFirst: null,
			phoneticMiddle: null,
			phoneticLast: null,
			department: "",
			mailAddresses: [],
			phoneNumbers: [],
			addresses: [
				createContactAddress({
					address: "Die Heide 81\nBasche",
					customTypeName: "",
					type: "2",
				}),
			],
			socialIds: [],
			oldBirthdayAggregate: null,
			photo: null,
			customDate: [],
			websites: [],
			relationships: [],
			messengerHandles: [],
			pronouns: [],
		})
		o(parsedContacts).deepEquals([expectedContact])
	})
	o("testEmptyAddressElements", function () {
		const vcardData = ["N:Public\\\\;John\\;Quinlan;;Mr.;Esq.\nBDAY:2016-09-09\nADR:Die Heide 81;; ;;Basche"]
		const parsedContacts = vCardListToContacts(vcardData, "")
		const expectedContact = createContact({
			_ownerGroup: "",
			firstName: "John;Quinlan",
			lastName: "Public\\",
			role: "",
			company: "",
			oldBirthdayDate: null,
			comment: "",
			presharedPassword: null,
			nickname: null,
			title: "Mr.",
			birthdayIso: "2016-09-09",
			middleName: "",
			nameSuffix: "Esq.",
			phoneticFirst: null,
			phoneticMiddle: null,
			phoneticLast: null,
			department: "",
			mailAddresses: [],
			phoneNumbers: [],
			addresses: [
				createContactAddress({
					address: "Die Heide 81\nBasche",
					customTypeName: "",
					type: "2",
				}),
			],
			socialIds: [],
			oldBirthdayAggregate: null,
			photo: null,
			customDate: [],
			websites: [],
			relationships: [],
			messengerHandles: [],
			pronouns: [],
		})
		o(parsedContacts).deepEquals([expectedContact])
	})

	o("testTooManySpaceElements", function () {
		const vcardData = ["N:Public\\\\; John\\; Quinlan;;Mr.    ;Esq.\nBDAY: 2016-09-09\nADR: Die Heide 81;;;; Basche"]
		const parsedContacts = vCardListToContacts(vcardData, "")
		const expectedContact = createContact({
			_ownerGroup: "",
			firstName: "John; Quinlan",
			lastName: "Public\\",
			role: "",
			company: "",
			oldBirthdayDate: null,
			comment: "",
			presharedPassword: null,
			nickname: null,
			title: "Mr.",
			birthdayIso: "2016-09-09",
			middleName: "",
			nameSuffix: "Esq.",
			phoneticFirst: null,
			phoneticMiddle: null,
			phoneticLast: null,
			department: "",
			mailAddresses: [],
			phoneNumbers: [],
			addresses: [
				createContactAddress({
					address: "Die Heide 81\nBasche",
					customTypeName: "",
					type: "2",
				}),
			],
			socialIds: [],
			oldBirthdayAggregate: null,
			photo: null,
			customDate: [],
			websites: [],
			relationships: [],
			messengerHandles: [],
			pronouns: [],
		})

		o(parsedContacts).deepEquals([expectedContact])
	})

	o("testVCard4", function () {
		let aContent = "VERSION:4.0\nN:Public\\\\;John\\;Quinlan;;Mr.;Esq.\nBDAY:2016-09-09\nADR:Die Heide 81;Basche\nNOTE:Hello World\\nHier ist ein Umbruch"
		let a = `BEGIN:VCARD\n${aContent}\nEND:VCARD\n`
		let bContent = "version:4.0\nFN:John B"
		let b = `begin:vcard\n${bContent}\nend:vcard\n`
		o(vCardFileToVCards(a + b)).deepEquals([aContent, bContent])
	})
	o("testTypeInUserText", function () {
		const vcardContent = ["EMAIL;TYPE=WORK:HOME@mvrht.net\nADR;TYPE=WORK:Street;HOME;;\nTEL;TYPE=WORK:HOME01923825434"]
		const parsedContacts = vCardListToContacts(vcardContent, "")
		const expectedContact = createContact({
			_ownerGroup: "",
			firstName: "",
			lastName: "",
			role: "",
			company: "",
			oldBirthdayDate: null,
			comment: "",
			presharedPassword: null,
			nickname: null,
			title: null,
			birthdayIso: null,
			middleName: "",
			nameSuffix: "",
			phoneticFirst: null,
			phoneticMiddle: null,
			phoneticLast: null,
			department: "",
			mailAddresses: [
				createContactMailAddress({
					address: "HOME@mvrht.net",
					customTypeName: "",
					type: "1",
				}),
			],
			phoneNumbers: [
				createContactPhoneNumber({
					customTypeName: "",
					number: "HOME01923825434",
					type: "1",
				}),
			],
			addresses: [
				createContactAddress({
					address: "Street\nHOME",
					customTypeName: "",
					type: "1",
				}),
			],
			socialIds: [],
			oldBirthdayAggregate: null,
			photo: null,
			customDate: [],
			websites: [],
			relationships: [],
			messengerHandles: [],
			pronouns: [],
		})
		o(parsedContacts[0]).deepEquals(expectedContact)
	})
	o("test vcard 4.0 date format", function () {
		let vcards = `BEGIN:VCARD
VERSION:3.0
BDAY:19540331
END:VCARD
BEGIN:VCARD
VERSION:3.0
BDAY:--0626
END:VCARD`
		let contacts = vCardListToContacts(neverNull(vCardFileToVCards(vcards)), "")
		o(neverNull(contacts[0].birthdayIso)).equals("1954-03-31")
		o(neverNull(contacts[1].birthdayIso)).equals("--06-26")
	})
	o("simple vcard 4.0 import with v4 date format", function () {
		let vcards = `BEGIN:VCARD
VERSION:4.0
BDAY:19540331
END:VCARD
BEGIN:VCARD
VERSION:3.0
BDAY:--0626
END:VCARD`
		let contacts = vCardListToContacts(neverNull(vCardFileToVCards(vcards)), "")
		o(neverNull(contacts[0].birthdayIso)).equals("1954-03-31")
		o(neverNull(contacts[1].birthdayIso)).equals("--06-26")
	})
	o("test import without year", function () {
		let vcards = `BEGIN:VCARD
VERSION:3.0
BDAY:1111-03-31
END:VCARD
BEGIN:VCARD
VERSION:3.0
BDAY:11110331
END:VCARD`
		let contacts = vCardListToContacts(neverNull(vCardFileToVCards(vcards)), "")
		o(neverNull(contacts[0].birthdayIso)).equals("--03-31")
		o(neverNull(contacts[1].birthdayIso)).equals("--03-31")
	})
	o("quoted printable utf-8 entirely encoded", function () {
		let vcards =
			"BEGIN:VCARD\n" +
			"VERSION:2.1\n" +
			"N:Mustermann;Max;;;\n" +
			"FN:Max Mustermann\n" +
			"ADR;HOME;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:;;=54=65=73=74=73=74=72=61=C3=9F=65=20=34=32;;;;\n" +
			"END:VCARD"
		let contacts = vCardListToContacts(neverNull(vCardFileToVCards(vcards)), "")
		o(neverNull(contacts[0].addresses[0].address)).equals("Teststraße 42")
	})
	o("quoted printable utf-8 partially encoded", function () {
		let vcards =
			"BEGIN:VCARD\n" +
			"VERSION:2.1\n" +
			"N:Mustermann;Max;;;\n" +
			"FN:Max Mustermann\n" +
			"ADR;HOME;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:;;Teststra=C3=9Fe 42;;;;\n" +
			"END:VCARD"
		let contacts = vCardListToContacts(neverNull(vCardFileToVCards(vcards)), "")
		o(neverNull(contacts[0].addresses[0].address)).equals("Teststraße 42")
	})
	o("base64 utf-8", function () {
		let vcards =
			"BEGIN:VCARD\n" +
			"VERSION:2.1\n" +
			"N:Mustermann;Max;;;\n" +
			"FN:Max Mustermann\n" +
			"ADR;HOME;CHARSET=UTF-8;ENCODING=BASE64:;;w4TDpMOkaGhtbQ==;;;;\n" +
			"END:VCARD"
		let contacts = vCardListToContacts(neverNull(vCardFileToVCards(vcards)), "")
		o(neverNull(contacts[0].addresses[0].address)).equals("Ääähhmm")
	})
	o("test with latin charset", function () {
		let vcards =
			"BEGIN:VCARD\n" +
			"VERSION:2.1\n" +
			"N:Mustermann;Max;;;\n" +
			"FN:Max Mustermann\n" +
			"ADR;HOME;CHARSET=ISO-8859-1;ENCODING=QUOTED-PRINTABLE:;;Rua das Na=E7=F5es;;;;\n" +
			"END:VCARD"
		let contacts = vCardListToContacts(neverNull(vCardFileToVCards(vcards)), "")
		o(neverNull(contacts[0].addresses[0].address)).equals("Rua das Nações")
	})
	o("test with no charset but encoding", function () {
		let vcards = "BEGIN:VCARD\n" + "VERSION:2.1\n" + "N;ENCODING=QUOTED-PRINTABLE:=4E;\n" + "END:VCARD\nD"
		let contacts = vCardListToContacts(neverNull(vCardFileToVCards(vcards)), "")
		o(neverNull(contacts[0].lastName)).equals("N")
	})
	o("base64 implicit utf-8", function () {
		let vcards =
			"BEGIN:VCARD\n" +
			"VERSION:2.1\n" +
			"N:Mustermann;Max;;;\n" +
			"FN:Max Mustermann\n" +
			"ADR;HOME;ENCODING=BASE64:;;w4TDpMOkaGhtbQ==;;;;\n" +
			"END:VCARD"
		let contacts = vCardListToContacts(neverNull(vCardFileToVCards(vcards)), "")
		o(neverNull(contacts[0].addresses[0].address)).equals("Ääähhmm")
	})
	o.spec("protonmail exports are imported correctly", function () {
		o("protonmail v4.0 simple import", function () {
			let vCard =
				"BEGIN:VCARD\n" +
				"VERSION:4.0\n" +
				"PRODID;VALUE=TEXT:-//ProtonMail//ProtonMail vCard 1.0.0//EN\n" +
				"FN;PREF=1:johnsuser@test.tuta.com\n" +
				"UID:proton-autosave-19494094-e26d-4e59-b4fb-766afcf82fa5\n" +
				"ITEM1.EMAIL;PREF=1:johnsuser@test.tuta.com\n" +
				"END:VCARD"

			let contacts = vCardListToContacts(neverNull(vCardFileToVCards(vCard)), "")
			o(contacts.length).equals(1)
			o(contacts[0].firstName).equals("johnsuser@test.tuta.com")
			o(contacts[0].lastName).equals("")
			o(contacts[0].nickname).equals(null)
			o(contacts[0].mailAddresses.length).equals(1)
			o(contacts[0].mailAddresses[0].address).equals("johnsuser@test.tuta.com")
		})
		o("protonmail v4.0 complicated import", function () {
			let vCard =
				"BEGIN:VCARD\n" +
				"VERSION:4.0\n" +
				"ADR;PREF=1:;;908 S 1780 W;Orem;UT;;USA\n" +
				"NOTE:This is a note\n" +
				"TEL;PREF=1:8013194412\n" +
				"TEL;TYPE=cell;PREF=2:+49530112345\n" +
				"FN;PREF=1:Jane Test\n" +
				"ITEM1.EMAIL;PREF=1:jane.test@tutanota.de\n" +
				"UID:proton-web-3466d132-2347-2541-3375-391fc3423bf3\n" +
				"END:VCARD"

			let contacts = vCardListToContacts(neverNull(vCardFileToVCards(vCard)), "")
			o(contacts.length).equals(1)
			o(contacts[0].firstName).equals("Jane Test")
			o(contacts[0].lastName).equals("")
			o(contacts[0].nickname).equals(null)
			o(contacts[0].mailAddresses.length).equals(1)
			o(contacts[0].mailAddresses[0].address).equals("jane.test@tutanota.de")
			o(contacts[0].phoneNumbers.length).equals(2)
			o(contacts[0].phoneNumbers[0].number).equals("8013194412")
			o(contacts[0].phoneNumbers[1].number).equals("+49530112345")
			o(contacts[0].comment).equals("This is a note")
		})
	})
})
