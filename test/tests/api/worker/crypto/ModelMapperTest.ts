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
import { resolveTypeReference } from "../../../../../src/common/api/common/EntityFunctions.js"
import { Mail, MailAddressTypeRef, MailTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { createTestEntity } from "../../../TestUtils.js"
import { configureLoggedInUser, createEncryptedUntypedMailInstance, createTestUser } from "./CryptoFacadeTest.js"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient.js"
import { UserFacade } from "../../../../../src/common/api/worker/facades/UserFacade.js"
import { object } from "testdouble"
import { KeyLoaderFacade } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade.js"
import { decryptValue, encryptValue, CryptoMapper } from "../../../../../src/common/api/worker/crypto/CryptoMapper"
import { Type } from "../../../../../src/common/api/common/EntityConstants"
import { AttributeModel } from "../../../../../src/common/api/common/AttributeModel"

o.spec("InstanceMapper", function () {
	let entityClient: EntityClient
	let userFacade: UserFacade
	let keyLoaderFacade: KeyLoaderFacade

	let instanceMapper: ModelMapper
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
		let mail = await createEncryptedUntypedMailInstance(user.mailGroupKey, sk, confidential, user.mailGroup._id)
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
		let mail = await createEncryptedUntypedMailInstance(testUser.mailGroupKey, sk, confidential, testUser.mailGroup._id)
		const MailTypeModel = await resolveTypeReference(MailTypeRef)
		// change the subject
		mail[assertNotNull(AttributeModel.getAttributeId(MailTypeModel, "subject"))] = "random subject that was not encoded"

		const instance: ParsedInstance = await instanceCryptoMapper.decryptParsedInstance(MailTypeModel, mail, sk)
		o(typeof instance._errors?.["subject"]).equals("string")
	})
})
