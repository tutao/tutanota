import o from "@tutao/otest"
import { CustomerAccountTerminationRequestTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { aes256RandomKey, aesDecrypt, aesEncrypt, ENABLE_MAC, IV_BYTE_LENGTH, random } from "@tutao/tutanota-crypto"
import { convertDbToJsType, convertJsToDbType, ModelMapper } from "../../../../../src/common/api/worker/crypto/ModelMapper.js"
import { AssociationType, Cardinality, ValueType } from "../../../../../src/common/api/common/EntityConstants.js"
import { ModelValue, ParsedInstance, TypeModel, UntypedInstance } from "../../../../../src/common/api/common/EntityTypes.js"
import {
	assertNotNull,
	base64ToUint8Array,
	isSameTypeRef,
	neverNull,
	stringToUtf8Uint8Array,
	TypeRef,
	uint8ArrayToBase64,
	utf8Uint8ArrayToString,
} from "@tutao/tutanota-utils"
import { AttributeModel, resolveTypeReference } from "../../../../../src/common/api/common/EntityFunctions.js"
import { Mail, MailAddressTypeRef, MailTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { createTestEntity } from "../../../TestUtils.js"
import { configureLoggedInUser, createEnryptedUntypedMailInstance, createTestUser } from "./CryptoFacadeTest.js"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient.js"
import { UserFacade } from "../../../../../src/common/api/worker/facades/UserFacade.js"
import { object } from "testdouble"
import { KeyLoaderFacade } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade.js"
import { decryptValue, encryptValue, CryptoMapper } from "../../../../../src/common/api/worker/crypto/CryptoMapper"
import { Type } from "../../../../../src/common/api/common/EntityConstants"

const testTypeModel: TypeModel = {
	app: "tutanota",
	encrypted: true,
	id: 42,
	name: "TestType",
	rootId: "SoMeId",
	since: 41,
	type: Type.ListElement,
	values: {
		"1": {
			id: 1,
			name: "testValue",
			type: ValueType.String,
			cardinality: Cardinality.One,
			final: false,
			encrypted: true,
		},
	},
	associations: {
		"3": {
			id: 3,
			name: "testAssociation",
			type: AssociationType.Aggregation,
			cardinality: Cardinality.One,
			refTypeId: 43,
			final: false,
			dependency: "tutanota",
		},
	},
	version: "0",
	versioned: false,
}

const testAggregateModel: TypeModel = {
	app: "tutanota",
	encrypted: true,
	id: 43,
	name: "TestAggregate",
	rootId: "SoMeId",
	since: 41,
	type: Type.ListElement,
	values: {
		"2": {
			id: 2,
			name: "testNumber",
			type: ValueType.Number,
			cardinality: Cardinality.One,
			final: false,
			encrypted: true,
		},
	},
	associations: {},
	version: "0",
	versioned: false,
}

o.spec("InstanceMapper", function () {
	let entityClient: EntityClient
	let userFacade: UserFacade
	let keyLoaderFacade: KeyLoaderFacade

	let instanceMapper: ModelMapper
	let instanceCryptoMapper: CryptoMapper
	o.beforeEach(() => {
		instanceMapper = new ModelMapper()
		const dummyResolver = (tr: TypeRef<unknown>) => {
			const model = tr.typeId === 42 ? testTypeModel : testAggregateModel
			return Promise.resolve(model)
		}
		instanceCryptoMapper = new CryptoMapper(dummyResolver)
		userFacade = object()
		keyLoaderFacade = object()
		entityClient = object()
	})

	function createEncryptedValueType(type: Values<typeof ValueType>, cardinality: Values<typeof Cardinality>): ModelValue & { encrypted: true } {
		return {
			name: "test",
			id: 426,
			type: type,
			cardinality: cardinality,
			final: true,
			encrypted: true,
		} satisfies ModelValue
	}

	o.spec("decrypt value", function () {
		o("decrypt string / number value without mac", function () {
			let sk = aes256RandomKey()
			let value = "this is a string value"
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue(createEncryptedValueType(ValueType.String, Cardinality.One), encryptedValue, sk)).equals(value)
			value = "516546"
			encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue(createEncryptedValueType(ValueType.String, Cardinality.One), encryptedValue, sk)).equals(value)
		})
		o("decrypt string / number value with mac", function () {
			let sk = aes256RandomKey()
			let value = "this is a string value"
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue(createEncryptedValueType(ValueType.String, Cardinality.One), encryptedValue, sk)).equals(value)
			value = "516546"
			encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue(createEncryptedValueType(ValueType.String, Cardinality.One), encryptedValue, sk)).equals(value)
		})
		o("decrypt boolean value without mac", function () {
			let valueType = createEncryptedValueType(ValueType.Boolean, Cardinality.One)
			let sk = aes256RandomKey()
			let value = "0"
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue(valueType, encryptedValue, sk)).equals(false)
			value = "1"
			encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue(valueType, encryptedValue, sk)).equals(true)
			value = "32498"
			encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue(valueType, encryptedValue, sk)).equals(true)
		})
		o("decrypt boolean value with mac", function () {
			let valueType = createEncryptedValueType(ValueType.Boolean, Cardinality.One)
			let sk = aes256RandomKey()
			let value = "0"
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue(valueType, encryptedValue, sk)).equals(false)
			value = "1"
			encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue(valueType, encryptedValue, sk)).equals(true)
			value = "32498"
			encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue(valueType, encryptedValue, sk)).equals(true)
		})
		o("decrypt date value without mac", function () {
			let valueType = createEncryptedValueType(ValueType.Date, Cardinality.One)
			let sk = aes256RandomKey()
			let value = new Date().getTime().toString()
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue(valueType, encryptedValue, sk)).deepEquals(new Date(parseInt(value)))
		})
		o("decrypt date value with mac", function () {
			let valueType = createEncryptedValueType(ValueType.Date, Cardinality.One)
			let sk = aes256RandomKey()
			let value = new Date().getTime().toString()
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue(valueType, encryptedValue, sk)).deepEquals(new Date(parseInt(value)))
		})
		o("decrypt bytes value without mac", function () {
			let valueType = createEncryptedValueType(ValueType.Bytes, Cardinality.One)
			let sk = aes256RandomKey()
			let value = random.generateRandomData(5)
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, value, random.generateRandomData(IV_BYTE_LENGTH), true, true))
			let decryptedValue = decryptValue("test", valueType, encryptedValue, sk)
			o(decryptedValue instanceof Uint8Array).equals(true)
			o(Array.from(decryptedValue)).deepEquals(Array.from(value))
		})
		o("decrypt bytes value with mac", function () {
			let valueType = createEncryptedValueType(ValueType.Bytes, Cardinality.One)
			let sk = aes256RandomKey()
			let value = random.generateRandomData(5)
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, value, random.generateRandomData(IV_BYTE_LENGTH), true, true))
			let decryptedValue = decryptValue(valueType, encryptedValue, sk)
			o(decryptedValue instanceof Uint8Array).equals(true)
			o(Array.from(decryptedValue)).deepEquals(Array.from(value))
		})
		o("decrypt compressedString", function () {
			let valueType = createEncryptedValueType(ValueType.CompressedString, Cardinality.One)
			let sk = aes256RandomKey()
			let value = base64ToUint8Array("QHRlc3Q=")
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, value, random.generateRandomData(IV_BYTE_LENGTH), true, true))
			let decryptedValue = decryptValue(valueType, encryptedValue, sk)
			o(typeof decryptedValue === "string").equals(true)
			o(decryptedValue).equals("test")
		})
		o("decrypt compressedString w resize", function () {
			let valueType = createEncryptedValueType(ValueType.CompressedString, Cardinality.One)
			let sk = aes256RandomKey()
			let value = base64ToUint8Array("X3RleHQgBQD//1FQdGV4dCA=")
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, value, random.generateRandomData(IV_BYTE_LENGTH), true, true))
			let decryptedValue = decryptValue(valueType, encryptedValue, sk)
			o(typeof decryptedValue === "string").equals(true)
			o(decryptedValue).equals(
				"text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text ",
			)
		})
		o("decrypt empty compressedString", function () {
			let valueType = createEncryptedValueType(ValueType.CompressedString, Cardinality.One)
			let sk = aes256RandomKey()
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, new Uint8Array([]), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			let decryptedValue = decryptValue(valueType, encryptedValue, sk)
			o(typeof decryptedValue === "string").equals(true)
			o(decryptedValue).equals("")
		})
		o("do not decrypt null values", function () {
			let sk = aes256RandomKey()
			o(decryptValue(createEncryptedValueType(ValueType.String, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o(decryptValue(createEncryptedValueType(ValueType.Date, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o(decryptValue(createEncryptedValueType(ValueType.Bytes, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o(decryptValue(createEncryptedValueType(ValueType.Boolean, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o(decryptValue(createEncryptedValueType(ValueType.Number, Cardinality.ZeroOrOne), null, sk)).equals(null)
		})
	})
	o.spec("encryptValue", function () {
		o("encrypt string / number value", function () {
			const valueType = createEncryptedValueType(ValueType.String, Cardinality.One)
			let sk = aes256RandomKey()
			let value = "this is a string value"
			let encryptedValue = neverNull(encryptValue(valueType, value, sk))
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
			o(decryptValue(valueType, encryptedValue, sk)).equals(value)
		})
		o("encrypt boolean value", function () {
			let valueType = createEncryptedValueType(ValueType.Boolean, Cardinality.One)
			let sk = aes256RandomKey()
			let value = false
			let encryptedValue = neverNull(encryptValue(valueType, value, sk))
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
			o(decryptValue(valueType, encryptedValue, sk)).equals(false)
			value = true
			encryptedValue = neverNull(encryptValue(valueType, value, sk))
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
			o(decryptValue(valueType, encryptedValue, sk)).equals(true)
		})
		o("encrypt date value", function () {
			let valueType = createEncryptedValueType(ValueType.Date, Cardinality.One)
			let sk = aes256RandomKey()
			let value = new Date()
			let encryptedValue = neverNull(encryptValue(valueType, value, sk))
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
			o(decryptValue(valueType, encryptedValue, sk)).deepEquals(value)
		})
		o("encrypt bytes value", function () {
			let valueType = createEncryptedValueType(ValueType.Bytes, Cardinality.One)
			let sk = aes256RandomKey()
			let value = random.generateRandomData(5)
			let encryptedValue = neverNull(encryptValue(valueType, value, sk))
			let expected = uint8ArrayToBase64(
				aesEncrypt(sk, value, base64ToUint8Array(encryptedValue).slice(ENABLE_MAC ? 1 : 0, ENABLE_MAC ? 17 : 16), true, ENABLE_MAC),
			)
			o(encryptedValue).equals(expected)
			o(Array.from(decryptValue(valueType, encryptedValue, sk))).deepEquals(Array.from(value))
		})
		o("do not encrypt null values", function () {
			let sk = aes256RandomKey()
			o(encryptValue(createEncryptedValueType(ValueType.String, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o(encryptValue(createEncryptedValueType(ValueType.Date, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o(encryptValue(createEncryptedValueType(ValueType.Bytes, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o(encryptValue(createEncryptedValueType(ValueType.Boolean, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o(encryptValue(createEncryptedValueType(ValueType.Number, Cardinality.ZeroOrOne), null, sk)).equals(null)
		})
	})
	o.spec("convertDbToJsType", function () {
		o("convert value to JS Date", function () {
			let value = new Date().getTime().toString()
			o(convertDbToJsType(ValueType.Date, value)).deepEquals(new Date(parseInt(value)))
		})
		o("convert unencrypted Bytes to JS type", function () {
			let valueBytes = random.generateRandomData(15)
			let value = uint8ArrayToBase64(valueBytes)
			o(Array.from(convertDbToJsType(ValueType.Bytes, value))).deepEquals(Array.from(valueBytes))
		})
		o("convert unencrypted Boolean to JS type", function () {
			o(convertDbToJsType(ValueType.Boolean, "0")).equals(false)
			o(convertDbToJsType(ValueType.Boolean, "1")).equals(true)
		})
		o("convert unencrypted Number to JS type", function () {
			o(convertDbToJsType(ValueType.Number, "")).equals(0)
			o(convertDbToJsType(ValueType.Number, "0")).equals(0)
			o(convertDbToJsType(ValueType.Number, "1")).equals(1)
		})
		o("convert unencrypted compressedString to JS type", function () {
			o(convertDbToJsType(ValueType.CompressedString, "")).equals("")
			o(convertDbToJsType(ValueType.CompressedString, "QHRlc3Q=")).equals("test")
		})
	})
	o.spec("convertJsToDbType", function () {
		o("convert unencrypted Date to DB type", function () {
			let value = new Date()
			o(convertJsToDbType(ValueType.Date, value)).equals(value.getTime().toString())
		})

		o("convert unencrypted Bytes to DB type", function () {
			let valueBytes = random.generateRandomData(15)
			o(convertJsToDbType(ValueType.Bytes, valueBytes)).equals(uint8ArrayToBase64(valueBytes))
		})

		o("convert unencrypted Boolean to DB type", function () {
			let value = false
			o(convertJsToDbType(ValueType.Boolean, value)).equals("0")
			value = true
			o(convertJsToDbType(ValueType.Boolean, value)).equals("1")
		})

		o("convert unencrypted Number to DB type", function () {
			let value = 0
			o(convertJsToDbType(ValueType.Number, value)).equals("0")
			value = 1
			o(convertJsToDbType(ValueType.Number, value)).equals("1")
		})
	})

	o("decrypt instance", async function () {
		o.timeout(1000)
		let subject = "this is our subject"
		let confidential = true
		let senderName = "TutanotaTeam"
		const user = createTestUser("Alice", entityClient)
		const sk = aes256RandomKey()
		let mail = await createEnryptedUntypedMailInstance(user.mailGroupKey, sk, confidential, user.mailGroup._id)
		const MailTypeModel = await resolveTypeReference(MailTypeRef)
		// FIXME can't pass UntypedInstance to instanceMapper
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
			let instance = { 1: "test string", 3: [{ 2: 123 }], _finalIvs: {} } as ParsedInstance
			const result: any = await instanceCryptoMapper.encryptParsedInstance(testTypeModel, instance, sk)
			o(utf8Uint8ArrayToString(aesDecrypt(sk, base64ToUint8Array(result[1])))).equals("test string")
			o(parseInt(utf8Uint8ArrayToString(aesDecrypt(sk, base64ToUint8Array(result[3][0][2]))))).equals(123)
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
		const CustomerAccountTerminationTypeModel = await resolveTypeReference(CustomerAccountTerminationRequestTypeRef)
		const formatAttrId = assertNotNull(await AttributeModel.getAttributeId(CustomerAccountTerminationTypeModel, "_format"))
		const terminationDateAttrId = assertNotNull(await AttributeModel.getAttributeId(CustomerAccountTerminationTypeModel, "terminationDate"))
		const terminationRequestDateAttrId = assertNotNull(await AttributeModel.getAttributeId(CustomerAccountTerminationTypeModel, "terminationRequestDate"))
		const customerAttrId = assertNotNull(await AttributeModel.getAttributeId(CustomerAccountTerminationTypeModel, "customer"))

		const customerAccountTerminationRequestLiteral = {
			[formatAttrId]: "0",
			[terminationDateAttrId]: dummyDate.getTime().toString(),
			[terminationRequestDateAttrId]: dummyDate.getTime().toString(),
			[customerAttrId]: "customerId",
		} satisfies UntypedInstance

		const customerAccountTerminationRequest: ParsedInstance = await instanceCryptoMapper.decryptParsedInstance(
			CustomerAccountTerminationTypeModel,
			customerAccountTerminationRequestLiteral,
			null,
		)
		o(customerAccountTerminationRequest[formatAttrId]).equals("0")
		o(customerAccountTerminationRequest[customerAttrId]).equals("customerId")
		o(customerAccountTerminationRequest[terminationDateAttrId]).deepEquals(dummyDate)
		o(customerAccountTerminationRequest[terminationRequestDateAttrId]).deepEquals(dummyDate)
	})

	o("decryption errors should be written to _errors field", async function () {
		const testUser = createTestUser("Bob", entityClient)
		configureLoggedInUser(testUser, userFacade, keyLoaderFacade)
		let confidential = true
		let sk = aes256RandomKey()
		let mail = await createEnryptedUntypedMailInstance(testUser.mailGroupKey, sk, confidential, testUser.mailGroup._id)
		const MailTypeModel = await resolveTypeReference(MailTypeRef)
		// change the subject
		mail[assertNotNull(AttributeModel.getAttributeId(MailTypeModel, "subject"))] = "random subject that was not encoded"

		const instance: ParsedInstance = await instanceCryptoMapper.decryptParsedInstance(MailTypeModel, mail, sk)
		o(typeof instance._errors?.["subject"]).equals("string")
	})
})
