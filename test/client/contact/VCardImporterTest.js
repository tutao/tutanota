// @flow
import o from "ospec/ospec.js"
import {createContact} from "../../../src/api/entities/tutanota/Contact"
import {ContactAddressTypeRef} from "../../../src/api/entities/tutanota/ContactAddress"
import {neverNull} from "../../../src/api/common/utils/Utils"
import {vCardFileToVCards, vCardListToContacts} from "../../../src/contacts/VCardImporter"
import en from "../../../src/translations/en"
import {lang} from "../../../src/misc/LanguageViewModel"
import {ContactMailAddressTypeRef} from "../../../src/api/entities/tutanota/ContactMailAddress"
import {ContactPhoneNumberTypeRef} from "../../../src/api/entities/tutanota/ContactPhoneNumber"
import {createBirthday} from "../../../src/api/entities/tutanota/Birthday"

o.spec("VCardImporterTest", function () {
	let date = new Date()

	o.before(function () {
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
ADR;TYPE=WORK:;;Strasse 30\, 67890 hamburg ;;;;
END:VCARD

`

		let expected = [`VERSION:3.0
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
ADR;TYPE=WORK:;;Strasse 30\, 67890 hamburg ;;;;`]
		//prepares for further usage --> removes Begin and End tag and pushes the content between those tags into an array
		o(vCardFileToVCards(str)).deepEquals(expected)

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
ADR;TYPE=WORK:;;Strasse 30\, 67890 hamburg ;;;;
END:VCARD`

		let expected = [`VERSION:3.0
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
ADR;TYPE=WORK:;;Strasse 30\, 67890 hamburg ;;;;`]
		//Unfolding lines for content lines longer than 75 characters
		o(vCardFileToVCards(str)).deepEquals(expected)

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

		let expected = [`VERSION:3.0
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
NOTE:BEGIN:VCARD\\n i Love VCARDS;`]

		o(vCardFileToVCards(str)).deepEquals(expected)

	})
	o("windowsLinebreaks", function () {
		let str = "BEGIN:VCARD\r\nVERSION:3.0\r\nFN:proto type\r\nN:type;proto;;;\r\nADR;TYPE=HOME,PREF:;;Humboldstrasse 5;\\nBerlin;;12345;Deutschland\r\nEND:VCARD\r\n"

		let expected = [`VERSION:3.0
FN:proto type
N:type;proto;;;
ADR;TYPE=HOME,PREF:;;Humboldstrasse 5;\\nBerlin;;12345;Deutschland`
		]

		o(vCardFileToVCards(str)).deepEquals(expected)

	})
	o("testToContactNames", function () {
		let a = ["N:Public\\\\;John\\;Quinlan;;Mr.;Esq.\nBDAY:2016-09-09\nADR:Die Heide 81\\nBasche\nNOTE:Hello World\\nHier ist ein Umbruch"]

		let contacts = vCardListToContacts(a, "")

		let b = createContact()
		let bday = createBirthday()
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
		b.lastName = "Public\\"
		b.oldBirthday = null
		b.comment = "Hello World\nHier ist ein Umbruch"
		b.company = ""
		b.role = ""
		b.title = "Mr."
		b.nickname = neverNull(null)
		bday.day = "09"
		bday.month = "09"
		bday.year = "2016"
		b.birthday = bday

		o(JSON.stringify(contacts[0])).deepEquals(JSON.stringify(b))
	})
	o("testEmptyAddressElements", function () {
		let a = ["N:Public\\\\;John\\;Quinlan;;Mr.;Esq.\nBDAY:2016-09-09\nADR:Die Heide 81;; ;;Basche"]

		let contacts = vCardListToContacts(a, "")

		let b = createContact()
		let bday = createBirthday()
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
		b.lastName = "Public\\"
		b.oldBirthday = null
		b.comment = ""
		b.company = ""
		b.role = ""
		b.title = "Mr."
		b.nickname = neverNull(null)
		bday.day = "09"
		bday.month = "09"
		bday.year = "2016"
		b.birthday = bday

		o(JSON.stringify(contacts[0])).deepEquals(JSON.stringify(b))


	})
	o("testTooManySpaceElements", function () {
		let a = ["N:Public\\\\; John\\; Quinlan;;Mr.    ;Esq.\nBDAY: 2016-09-09\nADR: Die Heide 81;;;; Basche"]

		let contacts = vCardListToContacts(a, "")

		let b = createContact()
		let bday = createBirthday()
		b._owner = ""
		b._ownerGroup = ""
		b.addresses[0] = {
			_type: ContactAddressTypeRef,
			_id: neverNull(null),
			address: 'Die Heide 81\nBasche',
			customTypeName: '',
			type: '2'
		}
		b.firstName = "John; Quinlan"
		b.lastName = "Public\\"
		b.oldBirthday =null
		b.comment = ""
		b.company = ""
		b.role = ""
		b.title = "Mr."
		b.nickname = neverNull(null)
		bday.day = "09"
		bday.month = "09"
		bday.year = "2016"
		b.birthday = bday

		o(JSON.stringify(contacts[0])).deepEquals(JSON.stringify(b))
	})

	o("testVCard4", function () {
		let a = "BEGIN:VCARD\nVERSION:4.0\nN:Public\\\\;John\\;Quinlan;;Mr.;Esq.\nBDAY:2016-09-09\nADR:Die Heide 81;Basche\nNOTE:Hello World\\nHier ist ein Umbruch\nEND:VCARD\n"
		o(vCardFileToVCards(a)).equals(null)
	})

	o("testTypeInUserText", function () {
		let a = ["EMAIL;TYPE=WORK:HOME@mvrht.net\nADR;TYPE=WORK:Street;HOME;;\nTEL;TYPE=WORK:HOME01923825434"]
		let contacts = vCardListToContacts(a, "")
		let b = createContact()
		b._owner = ""
		b._ownerGroup = ""
		b.mailAddresses[0] = {
			_type: ContactMailAddressTypeRef,
			_id: neverNull(null),
			address: 'HOME@mvrht.net',
			customTypeName: '',
			type: '1'
		}
		b.addresses[0] = {
			_type: ContactAddressTypeRef,
			_id: neverNull(null),
			address: 'Street\nHOME',
			customTypeName: '',
			type: '1'
		}
		b.phoneNumbers[0] = {
			_type: ContactPhoneNumberTypeRef,
			_id: neverNull(null),
			customTypeName: '',
			number: 'HOME01923825434',
			type: '1'
		}
		b.comment = ""
		o(JSON.stringify(contacts[0])).deepEquals(JSON.stringify(b))
	})
})

