import o from "@tutao/otest"
import { CustomerAccountTerminationRequest, CustomerAccountTerminationRequestTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { aes256RandomKey, aesDecrypt, aesEncrypt, ENABLE_MAC, IV_BYTE_LENGTH, random } from "@tutao/tutanota-crypto"
import { decryptValue, encryptValue, InstanceMapper } from "../../../../../src/common/api/worker/crypto/InstanceMapper.js"
import { Cardinality, ValueType } from "../../../../../src/common/api/common/EntityConstants.js"
import { ModelValue } from "../../../../../src/common/api/common/EntityTypes.js"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { ProgrammingError } from "../../../../../src/common/api/common/error/ProgrammingError.js"
import { base64ToUint8Array, isSameTypeRef, neverNull, stringToUtf8Uint8Array, uint8ArrayToBase64, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import { resolveTypeReference } from "../../../../../src/common/api/common/EntityFunctions.js"
import { ContactAddressTypeRef, ContactTypeRef, Mail, MailAddressTypeRef, MailTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { createTestEntity } from "../../../TestUtils.js"
import { configureLoggedInUser, createMailLiteral, createTestUser } from "./CryptoFacadeTest.js"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient.js"
import { UserFacade } from "../../../../../src/common/api/worker/facades/UserFacade.js"
import { object } from "testdouble"
import { KeyLoaderFacade } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade.js"

o.spec("InstanceMapper", function () {
	let entityClient: EntityClient
	let userFacade: UserFacade
	let keyLoaderFacade: KeyLoaderFacade

	let instanceMapper: InstanceMapper
	o.beforeEach(() => {
		instanceMapper = new InstanceMapper()
		userFacade = object()
		keyLoaderFacade = object()
		entityClient = object()
	})

	function createValueType(type, encrypted, cardinality): ModelValue & { name: string; since: number } {
		return {
			name: "test",
			id: 426,
			since: 6,
			type: type,
			cardinality: cardinality,
			final: true,
			encrypted: encrypted,
		}
	}

	o.spec("decrypt value", function () {
		o("decrypt string / number value without mac", function () {
			let sk = aes256RandomKey()
			let value = "this is a string value"
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue("test", createValueType(ValueType.String, true, Cardinality.One), encryptedValue, sk)).equals(value)
			value = "516546"
			encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue("test", createValueType(ValueType.String, true, Cardinality.One), encryptedValue, sk)).equals(value)
		})
		o("decrypt string / number value with mac", function () {
			let sk = aes256RandomKey()
			let value = "this is a string value"
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue("test", createValueType(ValueType.String, true, Cardinality.One), encryptedValue, sk)).equals(value)
			value = "516546"
			encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue("test", createValueType(ValueType.String, true, Cardinality.One), encryptedValue, sk)).equals(value)
		})
		o("decrypt boolean value without mac", function () {
			let valueType: ModelValue = createValueType(ValueType.Boolean, true, Cardinality.One)
			let sk = aes256RandomKey()
			let value = "0"
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue("test", valueType, encryptedValue, sk)).equals(false)
			value = "1"
			encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue("test", valueType, encryptedValue, sk)).equals(true)
			value = "32498"
			encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue("test", valueType, encryptedValue, sk)).equals(true)
		})
		o("decrypt boolean value with mac", function () {
			let valueType: ModelValue = createValueType(ValueType.Boolean, true, Cardinality.One)
			let sk = aes256RandomKey()
			let value = "0"
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue("test", valueType, encryptedValue, sk)).equals(false)
			value = "1"
			encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue("test", valueType, encryptedValue, sk)).equals(true)
			value = "32498"
			encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue("test", valueType, encryptedValue, sk)).equals(true)
		})
		o("decrypt date value without mac", function () {
			let valueType: ModelValue = createValueType(ValueType.Date, true, Cardinality.One)
			let sk = aes256RandomKey()
			let value = new Date().getTime().toString()
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue("test", valueType, encryptedValue, sk)).deepEquals(new Date(parseInt(value)))
		})
		o("decrypt date value with mac", function () {
			let valueType: ModelValue = createValueType(ValueType.Date, true, Cardinality.One)
			let sk = aes256RandomKey()
			let value = new Date().getTime().toString()
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue("test", valueType, encryptedValue, sk)).deepEquals(new Date(parseInt(value)))
		})
		o("decrypt bytes value without mac", function () {
			let valueType: ModelValue = createValueType(ValueType.Bytes, true, Cardinality.One)
			let sk = aes256RandomKey()
			let value = random.generateRandomData(5)
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, value, random.generateRandomData(IV_BYTE_LENGTH), true, true))
			let decryptedValue = decryptValue("test", valueType, encryptedValue, sk)
			o(decryptedValue instanceof Uint8Array).equals(true)
			o(Array.from(decryptedValue)).deepEquals(Array.from(value))
		})
		o("decrypt bytes value with mac", function () {
			let valueType: ModelValue = createValueType(ValueType.Bytes, true, Cardinality.One)
			let sk = aes256RandomKey()
			let value = random.generateRandomData(5)
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, value, random.generateRandomData(IV_BYTE_LENGTH), true, true))
			let decryptedValue = decryptValue("test", valueType, encryptedValue, sk)
			o(decryptedValue instanceof Uint8Array).equals(true)
			o(Array.from(decryptedValue)).deepEquals(Array.from(value))
		})
		o("decrypt compressedString", function () {
			let valueType: ModelValue = createValueType(ValueType.CompressedString, true, Cardinality.One)
			let sk = aes256RandomKey()
			let value = base64ToUint8Array("QHRlc3Q=")
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, value, random.generateRandomData(IV_BYTE_LENGTH), true, true))
			let decryptedValue = decryptValue("test", valueType, encryptedValue, sk)
			o(typeof decryptedValue === "string").equals(true)
			o(decryptedValue).equals("test")
		})
		o("decrypt compressedString w resize", function () {
			let valueType: ModelValue = createValueType(ValueType.CompressedString, true, Cardinality.One)
			let sk = aes256RandomKey()
			let value = base64ToUint8Array("X3RleHQgBQD//1FQdGV4dCA=")
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, value, random.generateRandomData(IV_BYTE_LENGTH), true, true))
			let decryptedValue = decryptValue("test", valueType, encryptedValue, sk)
			o(typeof decryptedValue === "string").equals(true)
			o(decryptedValue).equals(
				"text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text ",
			)
		})
		o("decrypt empty compressedString", function () {
			let valueType: ModelValue = createValueType(ValueType.CompressedString, true, Cardinality.One)
			let sk = aes256RandomKey()
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, new Uint8Array([]), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			let decryptedValue = decryptValue("test", valueType, encryptedValue, sk)
			o(typeof decryptedValue === "string").equals(true)
			o(decryptedValue).equals("")
		})
		o("do not decrypt null values", function () {
			let sk = aes256RandomKey()
			o(decryptValue("test", createValueType(ValueType.String, true, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o(decryptValue("test", createValueType(ValueType.Date, true, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o(decryptValue("test", createValueType(ValueType.Bytes, true, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o(decryptValue("test", createValueType(ValueType.Boolean, true, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o(decryptValue("test", createValueType(ValueType.Number, true, Cardinality.ZeroOrOne), null, sk)).equals(null)
		})
		o("throw error on ONE null values (String)", makeTestForErrorOnNull(ValueType.String))
		o("throw error on ONE null values (Date)", makeTestForErrorOnNull(ValueType.Date))
		o("throw error on ONE null values (Bytes)", makeTestForErrorOnNull(ValueType.Bytes))
		o("throw error on ONE null values (Boolean)", makeTestForErrorOnNull(ValueType.Boolean))
		o("throw error on ONE null values (Number)", makeTestForErrorOnNull(ValueType.Number))

		function makeTestForErrorOnNull(type) {
			return async () => {
				let sk = aes256RandomKey()

				const e = await assertThrows(ProgrammingError, () => decryptValue("test", createValueType(type, true, Cardinality.One), null, sk))
				o(e.message).equals("Value test with cardinality ONE can not be null")
			}
		}

		o("convert unencrypted Date to JS type", function () {
			let value = new Date().getTime().toString()
			o(decryptValue("test", createValueType(ValueType.Date, false, Cardinality.One), value, null)).deepEquals(new Date(parseInt(value)))
		})
		o("convert unencrypted Bytes to JS type", function () {
			let valueBytes = random.generateRandomData(15)
			let value = uint8ArrayToBase64(valueBytes)
			o(Array.from(decryptValue("test", createValueType(ValueType.Bytes, false, Cardinality.One), value, null))).deepEquals(Array.from(valueBytes))
		})
		o("convert unencrypted Boolean to JS type", function () {
			let value = "0"
			o(decryptValue("test", createValueType(ValueType.Boolean, false, Cardinality.One), value, null)).equals(false)
			value = "1"
			o(decryptValue("test", createValueType(ValueType.Boolean, false, Cardinality.One), value, null)).equals(true)
		})
		o("convert unencrypted Number to JS type", function () {
			let value = ""
			o(decryptValue("test", createValueType(ValueType.Number, false, Cardinality.One), value, null)).equals("0")
			value = "0"
			o(decryptValue("test", createValueType(ValueType.Number, false, Cardinality.One), value, null)).equals("0")
			value = "1"
			o(decryptValue("test", createValueType(ValueType.Number, false, Cardinality.One), value, null)).equals("1")
		})
		o("convert unencrypted compressedString to JS type", function () {
			let value = ""
			o(decryptValue("test", createValueType(ValueType.CompressedString, false, Cardinality.One), value, null)).equals("")
			value = "QHRlc3Q="
			o(decryptValue("test", createValueType(ValueType.CompressedString, false, Cardinality.One), value, null)).equals("test")
		})
	})

	o.spec("encryptValue", function () {
		o("encrypt string / number value", function () {
			const valueType = createValueType(ValueType.String, true, Cardinality.One)
			let sk = aes256RandomKey()
			let value = "this is a string value"
			let encryptedValue = neverNull(encryptValue("test", valueType, value, sk))
			let expected = uint8ArrayToBase64(
				aesEncrypt(
					sk,
					stringToUtf8Uint8Array(value),
					base64ToUint8Array(encryptedValue).slice(ENABLE_MAC ? 1 : 0, ENABLE_MAC ? 17 : 16),
					true,
					ENABLE_MAC,
				),
			)
			o(encryptedValue).equals(expected)
			o(decryptValue("test", valueType, encryptedValue, sk)).equals(value)
		})
		o("encrypt boolean value", function () {
			let valueType: ModelValue = createValueType(ValueType.Boolean, true, Cardinality.One)
			let sk = aes256RandomKey()
			let value = false
			let encryptedValue = neverNull(encryptValue("test", valueType, value, sk))
			let expected = uint8ArrayToBase64(
				aesEncrypt(
					sk,
					stringToUtf8Uint8Array(value ? "1" : "0"),
					base64ToUint8Array(encryptedValue).slice(ENABLE_MAC ? 1 : 0, ENABLE_MAC ? 17 : 16),
					true,
					ENABLE_MAC,
				),
			)
			o(encryptedValue).equals(expected)
			o(decryptValue("test", valueType, encryptedValue, sk)).equals(false)
			value = true
			encryptedValue = neverNull(encryptValue("test", valueType, value, sk))
			expected = uint8ArrayToBase64(
				aesEncrypt(
					sk,
					stringToUtf8Uint8Array(value ? "1" : "0"),
					base64ToUint8Array(encryptedValue).slice(ENABLE_MAC ? 1 : 0, ENABLE_MAC ? 17 : 16),
					true,
					ENABLE_MAC,
				),
			)
			o(encryptedValue).equals(expected)
			o(decryptValue("test", valueType, encryptedValue, sk)).equals(true)
		})
		o("encrypt date value", function () {
			let valueType: ModelValue = createValueType(ValueType.Date, true, Cardinality.One)
			let sk = aes256RandomKey()
			let value = new Date()
			let encryptedValue = neverNull(encryptValue("test", valueType, value, sk))
			let expected = uint8ArrayToBase64(
				aesEncrypt(
					sk,
					stringToUtf8Uint8Array(value.getTime().toString()),
					base64ToUint8Array(encryptedValue).slice(ENABLE_MAC ? 1 : 0, ENABLE_MAC ? 17 : 16),
					true,
					ENABLE_MAC,
				),
			)
			o(encryptedValue).equals(expected)
			o(decryptValue("test", valueType, encryptedValue, sk)).deepEquals(value)
		})
		o("encrypt bytes value", function () {
			let valueType: ModelValue = createValueType(ValueType.Bytes, true, Cardinality.One)
			let sk = aes256RandomKey()
			let value = random.generateRandomData(5)
			let encryptedValue = neverNull(encryptValue("test", valueType, value, sk))
			let expected = uint8ArrayToBase64(
				aesEncrypt(sk, value, base64ToUint8Array(encryptedValue).slice(ENABLE_MAC ? 1 : 0, ENABLE_MAC ? 17 : 16), true, ENABLE_MAC),
			)
			o(encryptedValue).equals(expected)
			o(Array.from(decryptValue("test", valueType, encryptedValue, sk))).deepEquals(Array.from(value))
		})
		o("do not encrypt null values", function () {
			let sk = aes256RandomKey()
			o(encryptValue("test", createValueType(ValueType.String, true, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o(encryptValue("test", createValueType(ValueType.Date, true, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o(encryptValue("test", createValueType(ValueType.Bytes, true, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o(encryptValue("test", createValueType(ValueType.Boolean, true, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o(encryptValue("test", createValueType(ValueType.Number, true, Cardinality.ZeroOrOne), null, sk)).equals(null)
		})
		o("accept null _id and _permissions value during encryption", function () {
			let vt: ModelValue = {
				id: 426,
				type: ValueType.GeneratedId,
				cardinality: Cardinality.One,
				final: true,
				encrypted: false,
			}
			o(encryptValue("_id", vt, null, null)).equals(null)
			o(encryptValue("_permissions", vt, null, null)).equals(null)
		})
		o("throw error on ONE null values (enc String)", makeTestForErrorOnNull(ValueType.String))
		o("throw error on ONE null values (enc Date)", makeTestForErrorOnNull(ValueType.Date))
		o("throw error on ONE null values (enc Bytes)", makeTestForErrorOnNull(ValueType.Bytes))
		o("throw error on ONE null values (enc Boolean)", makeTestForErrorOnNull(ValueType.Boolean))
		o("throw error on ONE null values (enc Number)", makeTestForErrorOnNull(ValueType.Number))

		function makeTestForErrorOnNull(type) {
			return async () => {
				let sk = aes256RandomKey()

				const e = await assertThrows(ProgrammingError, async () => encryptValue("test", createValueType(type, true, Cardinality.One), null, sk))
				o(e.message).equals("Value test with cardinality ONE can not be null")
			}
		}

		o("convert unencrypted Date to DB type", function () {
			let value = new Date()
			o(encryptValue("test", createValueType(ValueType.Date, false, Cardinality.One), value, null)).equals(value.getTime().toString())
		})

		o("convert unencrypted Bytes to DB type", function () {
			let valueBytes = random.generateRandomData(15)
			o(encryptValue("test", createValueType(ValueType.Bytes, false, Cardinality.One), valueBytes, null)).equals(uint8ArrayToBase64(valueBytes))
		})

		o("convert unencrypted Boolean to DB type", function () {
			let value = false
			o(encryptValue("test", createValueType(ValueType.Boolean, false, Cardinality.One), value, null)).equals("0")
			value = true
			o(encryptValue("test", createValueType(ValueType.Boolean, false, Cardinality.One), value, null)).equals("1")
		})

		o("convert unencrypted Number to DB type", function () {
			let value = "0"
			o(encryptValue("test", createValueType(ValueType.Number, false, Cardinality.One), value, null)).equals("0")
			value = "1"
			o(encryptValue("test", createValueType(ValueType.Number, false, Cardinality.One), value, null)).equals("1")
		})
	})

	o("decrypt instance", async function () {
		o.timeout(1000)
		let subject = "this is our subject"
		let confidential = true
		let senderName = "TutanotaTeam"
		const user = createTestUser("Alice", entityClient)
		const sk = aes256RandomKey()
		let mail = createMailLiteral(user.mailGroupKey, sk, subject, confidential, senderName, user.name, user.mailGroup._id)
		const MailTypeModel = await resolveTypeReference(MailTypeRef)
		return instanceMapper.decryptAndMapToInstance<Mail>(MailTypeModel, mail, sk).then((decrypted) => {
			o(isSameTypeRef(decrypted._type, MailTypeRef)).equals(true)
			o(decrypted.receivedDate.getTime()).equals(1470039025474)
			o(decrypted.confidential).equals(confidential)
			o(decrypted.subject).equals(subject)
			o(decrypted.replyType).equals("0")
			// aggregates
			o(isSameTypeRef(decrypted.sender._type, MailAddressTypeRef)).equals(true)
			o(decrypted.sender.name).equals(senderName)
			o(decrypted.sender.address).equals("hello@tutao.de")
		})
	})

	o.spec("encryptAndMapToLiteral", function () {
		o.test("encrypt instance", async function () {
			let sk = aes256RandomKey()
			let address = createTestEntity(ContactAddressTypeRef)
			address.type = "0"
			address.address = "Entenhausen"
			address.customTypeName = "0"
			let contact = createTestEntity(ContactTypeRef)
			contact.title = "Dr."
			contact.firstName = "Max"
			contact.lastName = "Meier"
			contact.comment = "what?"
			contact.company = "WIW"
			contact.addresses = [address]
			const ContactTypeModel = await resolveTypeReference(ContactTypeRef)
			const result: any = await instanceMapper.encryptAndMapToLiteral(ContactTypeModel, contact, sk)
			o(result._format).equals("0")
			o(result._ownerGroup).equals(null)
			o(result._ownerEncSessionKey).equals(null)
			o(utf8Uint8ArrayToString(aesDecrypt(sk, base64ToUint8Array(result.addresses[0].type)))).equals(contact.addresses[0].type)
			o(utf8Uint8ArrayToString(aesDecrypt(sk, base64ToUint8Array(result.addresses[0].address)))).equals(contact.addresses[0].address)
			o(utf8Uint8ArrayToString(aesDecrypt(sk, base64ToUint8Array(result.addresses[0].customTypeName)))).equals(contact.addresses[0].customTypeName)
			o(utf8Uint8ArrayToString(aesDecrypt(sk, base64ToUint8Array(result.title)))).equals(contact.title)
			o(utf8Uint8ArrayToString(aesDecrypt(sk, base64ToUint8Array(result.firstName)))).equals(contact.firstName)
			o(utf8Uint8ArrayToString(aesDecrypt(sk, base64ToUint8Array(result.lastName)))).equals(contact.lastName)
			o(utf8Uint8ArrayToString(aesDecrypt(sk, base64ToUint8Array(result.comment)))).equals(contact.comment)
			o(utf8Uint8ArrayToString(aesDecrypt(sk, base64ToUint8Array(result.company)))).equals(contact.company)
		})

		o.test("map unencrypted to DB literal", async function () {
			const dummyDate = new Date()
			const customerAccountTerminationRequest = createTestEntity(CustomerAccountTerminationRequestTypeRef)
			customerAccountTerminationRequest._format = "0"
			customerAccountTerminationRequest.terminationDate = dummyDate
			customerAccountTerminationRequest.terminationRequestDate = dummyDate
			customerAccountTerminationRequest.customer = "customerId"
			const customerAccountTerminationRequestLiteral = {
				_format: "0",
				_id: null,
				_ownerGroup: null,
				_permissions: null,
				terminationDate: dummyDate.getTime().toString(),
				terminationRequestDate: dummyDate.getTime().toString(),
				customer: "customerId",
			}
			const CustomerAccountTerminationRequestTypeModel = await resolveTypeReference(CustomerAccountTerminationRequestTypeRef)
			const result = await instanceMapper.encryptAndMapToLiteral(CustomerAccountTerminationRequestTypeModel, customerAccountTerminationRequest, null)
			o(result).deepEquals(customerAccountTerminationRequestLiteral)
		})

		o.test("when finalIvs has an entry it will reuse the IV", async function () {
			const sk = aes256RandomKey()
			const TypeModel = await resolveTypeReference(MailTypeRef)
			const mail = {
				...createTestEntity(MailTypeRef),
				subject: "some subject",
				sender: createTestEntity(MailAddressTypeRef),
			}
			const iv = new Uint8Array(IV_BYTE_LENGTH)
			iv[1] = 1
			mail["_finalIvs"] = { subject: new Uint8Array(iv) }
			const result: any = await instanceMapper.encryptAndMapToLiteral(TypeModel, mail, sk)
			const encryptedSubject = base64ToUint8Array(result["subject"] as string)
			o(encryptedSubject.slice(1, IV_BYTE_LENGTH + 1)).deepEquals(iv)
		})

		o.test("when finalIvs has an empty entry and the value is default it will write default placeholder back", async function () {
			const sk = aes256RandomKey()
			const TypeModel = await resolveTypeReference(MailTypeRef)
			const mail = {
				...createTestEntity(MailTypeRef),
				subject: "",
				sender: createTestEntity(MailAddressTypeRef),
			}
			const iv = new Uint8Array([])
			mail["_finalIvs"] = { subject: new Uint8Array(iv) }
			const result: any = await instanceMapper.encryptAndMapToLiteral(TypeModel, mail, sk)
			const encryptedSubject = result["subject"]
			o(encryptedSubject).equals("")
		})
	})

	o("map unencrypted to instance", async function () {
		const dummyDate = new Date()
		const customerAccountTerminationRequestLiteral = {
			_format: "0",
			terminationDate: dummyDate.getTime().toString(),
			terminationRequestDate: dummyDate.getTime().toString(),
			customer: "customerId",
		}
		const CustomerAccountTerminationTypeModel = await resolveTypeReference(CustomerAccountTerminationRequestTypeRef)

		const customerAccountTerminationRequest: CustomerAccountTerminationRequest = await instanceMapper.decryptAndMapToInstance(
			CustomerAccountTerminationTypeModel,
			customerAccountTerminationRequestLiteral,
			null,
		)
		o(customerAccountTerminationRequest._format).equals("0")
		o(customerAccountTerminationRequest.customer).equals("customerId")
		o(customerAccountTerminationRequest.terminationDate).deepEquals(dummyDate)
		o(customerAccountTerminationRequest.terminationRequestDate).deepEquals(dummyDate)
	})

	o("decryption errors should be written to _errors field", async function () {
		const testUser = createTestUser("Bob", entityClient)
		configureLoggedInUser(testUser, userFacade, keyLoaderFacade)
		let subject = "this is our subject"
		let confidential = true
		let senderName = "TutanotaTeam"
		let sk = aes256RandomKey()
		let mail = createMailLiteral(testUser.mailGroupKey, sk, subject, confidential, senderName, testUser.name, testUser.mailGroup._id)
		mail.subject = "asdf"
		const MailTypeModel = await resolveTypeReference(MailTypeRef)
		const instance: Mail = await instanceMapper.decryptAndMapToInstance(MailTypeModel, mail, sk)
		o(typeof instance._errors["subject"]).equals("string")
	})
})
