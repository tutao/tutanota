import o, { assertThrows, spy } from "@tutao/otest"
import {
	Aes256Key,
	aes256RandomKey,
	AesKey,
	generateKdfNonce,
	InstanceTypeId,
	KdfNonce,
	random,
	SubKeyInfoWithGroupKey,
	SubKeyInfoWithoutSessionKey,
	SubKeyInfoWithSessionKey,
	SymmetricCipherVersion,
	SubKeyInfoWithGroupKeyAead,
	SubKeyInfoWithSessionKeyAead,
	SubKeyInfoWithSessionKeyCbcThenHmac,
	VersionedKey,
} from "../../../src/platform-kit/crypto"
import { matchers, object, replace, verify, when } from "testdouble"
import { AppNameEnum, Cardinality, ClientTypeModel, EncryptedModelValue, ModelValue, ServerTypeModel, ValueTypeEnum } from "../../../src/platform-kit/meta"
import {
	arrayEquals,
	assertNotNull,
	base64ToUint8Array,
	KeyVersion,
	neverNull,
	stringToUtf8Uint8Array,
	utf8Uint8ArrayToString,
} from "../../../src/platform-kit/utils"
import {
	CryptoMapper,
	DecryptedParsedInstance,
	EncryptedParsedInstance,
	EncryptedParsedValue,
	ModelMapper,
	SymmetricGroupKeyLoader,
} from "../../../src/platform-kit/instance-pipeline"
import { createEncryptedValueType, testAggregateModel, testAggregateOnAggregateModel, testTypeModel } from "./InstancePipelineTestUtils"
import { CryptoError, SessionKeyNotFoundError } from "../../../src/platform-kit/crypto/error"
import { InstanceDecryptor } from "../../../src/platform-kit/crypto/instance-pipeline-crypto/decryption/InstanceDecryptor"
import { ValueDecryptor } from "../../../src/platform-kit/crypto/instance-pipeline-crypto/decryption/ValueDecryptor"
import { SYMMETRIC_CIPHER_FACADE, SymmetricCipherFacade } from "../../../src/platform-kit/crypto/instance-pipeline-crypto/SymmetricCipherFacade"
import { aesDecrypt, aesEncrypt } from "../../../src/platform-kit/crypto/instance-pipeline-crypto/Aes"
import { ParsedValue } from "../../../src/platform-kit/instance-pipeline/ParsedValue"
import { base64Decode } from "../TestUtils"

o.spec("CryptoMapperTest", () => {
	const symmetricCipherFacade: SymmetricCipherFacade = SYMMETRIC_CIPHER_FACADE
	const keyLoader: SymmetricGroupKeyLoader = object()
	const modelMapper: ModelMapper = object()
	const cryptoMapper: CryptoMapper = new CryptoMapper(symmetricCipherFacade, () => keyLoader, modelMapper)
	const instanceTypeId: InstanceTypeId = {
		app: AppNameEnum.Tutanota,
		id: 0,
		name: "name",
	}

	let decryptedParsedInstance: DecryptedParsedInstance
	const sampleEncryptedParsedInstance = (sk: AesKey) => {
		const encryptedAggregate = EncryptedParsedInstance.incomingFromServer(testAggregateModel as ServerTypeModel)
			.addAttributeById(2, ParsedValue.fromString("123"))
			.addAttributeById(6, ParsedValue.fromId("someCustomId"))
			.addAttributeById(
				9,
				ParsedValue.fromNestedItems([
					EncryptedParsedInstance.incomingFromServer(testAggregateOnAggregateModel as ServerTypeModel)
						.addAttributeById(17, ParsedValue.fromByteArray(aesEncrypt(sk, Uint8Array.of(42))))
						.addAttributeById(10, ParsedValue.fromNull())
						.addAttributeById(11, ParsedValue.fromId("anotherCustomId")),
				]),
			)
			.addAttributeById(10, ParsedValue.fromIdList([]))
		return EncryptedParsedInstance.incomingFromServer(testTypeModel as ServerTypeModel)
			.addAttributeById(1, ParsedValue.fromByteArray(aesEncrypt(sk, stringToUtf8Uint8Array("encrypted string"))))
			.addAttributeById(7, ParsedValue.fromByteArray(aesEncrypt(sk, stringToUtf8Uint8Array("1"))))
			.addAttributeById(15, ParsedValue.fromByteArray(aesEncrypt(sk, stringToUtf8Uint8Array("0"))))
			.addAttributeById(2, ParsedValue.fromNull())
			.addAttributeById(3, ParsedValue.fromNestedItems([encryptedAggregate]))
			.addAttributeById(4, ParsedValue.fromIdList(["associatedElementId"]))
			.addAttributeById(5, ParsedValue.fromString(new Date("2025-01-01T13:00:00.000Z").getTime().toString()))
			.addAttributeById(8, ParsedValue.fromIdTupleList([]))
			.addAttributeById(12, ParsedValue.fromId("some-id"))
			.addAttributeById(13, ParsedValue.fromIdTuple(["listId", "listElementId"]))
			.addAttributeById(14, ParsedValue.fromNull())
			.addAttributeById(16, ParsedValue.fromNull())
			.addAttributeById(17, ParsedValue.fromIdTupleList([]))
	}

	o.beforeEach(async () => {
		const parsedAggregate = DecryptedParsedInstance.outgoingToServer(testAggregateModel as ClientTypeModel)
			.addAttributeById(2, ParsedValue.fromString("123"))
			.addAttributeById(6, ParsedValue.fromString("aggregateId"))
			.addAttributeById(
				9,
				ParsedValue.fromNestedItems([
					DecryptedParsedInstance.outgoingToServer(testAggregateOnAggregateModel as ClientTypeModel)
						.addAttributeById(17, ParsedValue.fromByteArray(Uint8Array.of(42)))
						.addAttributeById(10, ParsedValue.fromNull())
						.addAttributeById(11, ParsedValue.fromId("anotherCustomId")),
				]),
			)
			.addAttributeById(10, ParsedValue.fromIdList([]))
		decryptedParsedInstance = DecryptedParsedInstance.outgoingToServer(testTypeModel as ClientTypeModel)
			.addAttributeById(1, ParsedValue.fromString("encrypted string"))
			.addAttributeById(2, ParsedValue.fromNull())
			.addAttributeById(3, ParsedValue.fromNestedItems([parsedAggregate]))
			.addAttributeById(4, ParsedValue.fromIdList(["associatedElementId"]))
			.addAttributeById(5, ParsedValue.fromString(new Date("2025-01-01T13:00:00.000Z").getTime().toString()))
			.addAttributeById(7, ParsedValue.fromBoolean(true))
			.addAttributeById(8, ParsedValue.fromIdTupleList([]))
			.addAttributeById(12, ParsedValue.fromId("some-id"))
			.addAttributeById(13, ParsedValue.fromIdTuple(["listId", "listElementId"]))
			.addAttributeById(14, ParsedValue.fromNull())
			.addAttributeById(15, ParsedValue.fromBoolean(true))
			.addAttributeById(16, ParsedValue.fromNull())
			.addAttributeById(17, ParsedValue.fromIdTupleList([]))
	})

	o.spec("decryptValue aesCbc", () => {
		o.test("decrypt string / number value", async () => {
			const sk = aes256RandomKey()
			const value = "this is a string value"
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sk, null, instanceTypeId)
			const decryptedValue = await cryptoMapper.decryptValue(
				createEncryptedValueType(ValueTypeEnum.String, Cardinality.One),
				ParsedValue.fromByteArray(aesEncrypt(sk, stringToUtf8Uint8Array(value))),
				instanceDecryptor,
				null,
				"",
			)
			o.check(decryptedValue.asString()).equals(value)
		})

		o.test("decrypt number value", async () => {
			const sk = aes256RandomKey()
			const value = "516546"
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sk, null, instanceTypeId)
			const decryptedValue = await cryptoMapper.decryptValue(
				createEncryptedValueType(ValueTypeEnum.Number, Cardinality.One),
				ParsedValue.fromByteArray(aesEncrypt(sk, stringToUtf8Uint8Array(value))),
				instanceDecryptor,
				null,
				"",
			)
			o.check(decryptedValue.asString()).equals(value)
		})

		o.test("decrypt boolean value", async () => {
			const valueType = createEncryptedValueType(ValueTypeEnum.Boolean, Cardinality.One)
			const sk = aes256RandomKey()
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sk, null, instanceTypeId)

			let value = "0"
			let encryptedValue = aesEncrypt(sk, stringToUtf8Uint8Array(value))
			let decryptedValue = await cryptoMapper.decryptValue(valueType, ParsedValue.fromByteArray(encryptedValue), instanceDecryptor, null, "")
			o.check(decryptedValue.asBoolean()).equals(false)

			value = "1"
			encryptedValue = aesEncrypt(sk, stringToUtf8Uint8Array(value))
			decryptedValue = await cryptoMapper.decryptValue(valueType, ParsedValue.fromByteArray(encryptedValue), instanceDecryptor, null, "")
			o.check(decryptedValue.asBoolean()).equals(true)

			value = "32498"
			encryptedValue = aesEncrypt(sk, stringToUtf8Uint8Array(value))
			decryptedValue = await cryptoMapper.decryptValue(valueType, ParsedValue.fromByteArray(encryptedValue), instanceDecryptor, null, "")
			o.check(decryptedValue.asBoolean()).equals(true)
		})

		o.test("decrypt date value", async () => {
			const valueType = createEncryptedValueType(ValueTypeEnum.Date, Cardinality.One)
			const sk = aes256RandomKey()
			const value = new Date()
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sk, null, instanceTypeId)
			const encryptedValue: EncryptedParsedValue = ParsedValue.fromByteArray(aesEncrypt(sk, stringToUtf8Uint8Array(value.getTime().toString())))
			const decryptedValue = await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, "")
			o.check(decryptedValue.asDate()).deepEquals(value)
		})

		o.test("decrypt bytes value", async () => {
			const valueType = createEncryptedValueType(ValueTypeEnum.Bytes, Cardinality.One)
			const sk = aes256RandomKey()
			const value = random.generateRandomData(5)
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sk, null, instanceTypeId)
			const encryptedValue: EncryptedParsedValue = ParsedValue.fromByteArray(aesEncrypt(sk, value))
			const decryptedValue = await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, "")
			o.check(Array.from(decryptedValue.asByteArray())).deepEquals(Array.from(value))
		})

		o.test("decrypt compressedString", async () => {
			const valueType = createEncryptedValueType(ValueTypeEnum.CompressedString, Cardinality.One)
			const sk = aes256RandomKey()
			const value = base64ToUint8Array("QHRlc3Q=")
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sk, null, instanceTypeId)
			const encryptedValue: EncryptedParsedValue = ParsedValue.fromByteArray(aesEncrypt(sk, value))
			const decryptedValue = await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, "")
			o.check(decryptedValue.asString()).equals("test")
		})

		o.test("decrypt compressedString w resize", async () => {
			const valueType = createEncryptedValueType(ValueTypeEnum.CompressedString, Cardinality.One)
			const sk = aes256RandomKey()
			const value = base64ToUint8Array("X3RleHQgBQD//1FQdGV4dCA=")
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sk, null, instanceTypeId)
			const encryptedValue: EncryptedParsedValue = ParsedValue.fromByteArray(aesEncrypt(sk, value))
			const decryptedValue = await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, "")
			o.check(decryptedValue.asString()).equals(
				"text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text ",
			)
		})

		o.test("decrypt empty compressedString", async () => {
			const valueType = createEncryptedValueType(ValueTypeEnum.CompressedString, Cardinality.One)
			const sk = aes256RandomKey()
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sk, null, instanceTypeId)
			const encryptedValue: EncryptedParsedValue = ParsedValue.fromByteArray(aesEncrypt(sk, new Uint8Array([])))
			const decryptedValue = await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, "")
			o.check(decryptedValue.asString()).equals("")
		})

		o.test("do not decrypt null values", async () => {
			const sk = aes256RandomKey()
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sk, null, instanceTypeId)

			const decryptNullValue = async (modelValue: ModelValue) => {
				const dec = await cryptoMapper.decryptValue(modelValue, ParsedValue.fromNull(), instanceDecryptor, null, "")
				return dec.getNullWhenNull()
			}

			o.check(await decryptNullValue(createEncryptedValueType(ValueTypeEnum.String, Cardinality.ZeroOrOne))).equals(null)
			o.check(await decryptNullValue(createEncryptedValueType(ValueTypeEnum.Date, Cardinality.ZeroOrOne))).equals(null)
			o.check(await decryptNullValue(createEncryptedValueType(ValueTypeEnum.Bytes, Cardinality.ZeroOrOne))).equals(null)
			o.check(await decryptNullValue(createEncryptedValueType(ValueTypeEnum.Boolean, Cardinality.ZeroOrOne))).equals(null)
			o.check(await decryptNullValue(createEncryptedValueType(ValueTypeEnum.Number, Cardinality.ZeroOrOne))).equals(null)
			o.check(await decryptNullValue(createEncryptedValueType(ValueTypeEnum.CompressedString, Cardinality.ZeroOrOne))).equals(null)
		})

		o.test("do not decrypt empty values with Cardinality.ZeroOrOne", async () => {
			const sk = aes256RandomKey()
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sk, null, instanceTypeId)
			const decryptEmptyValue = async (modelValue: ModelValue) => {
				const dec = await cryptoMapper.decryptValue(modelValue, ParsedValue.fromString(""), instanceDecryptor, null, "")
				return dec.getNullWhenNull()
			}

			o.check(await decryptEmptyValue(createEncryptedValueType(ValueTypeEnum.String, Cardinality.ZeroOrOne))).equals(null)
			o.check(await decryptEmptyValue(createEncryptedValueType(ValueTypeEnum.Date, Cardinality.ZeroOrOne))).equals(null)
			o.check(await decryptEmptyValue(createEncryptedValueType(ValueTypeEnum.Bytes, Cardinality.ZeroOrOne))).equals(null)
			o.check(await decryptEmptyValue(createEncryptedValueType(ValueTypeEnum.Boolean, Cardinality.ZeroOrOne))).equals(null)
			o.check(await decryptEmptyValue(createEncryptedValueType(ValueTypeEnum.Number, Cardinality.ZeroOrOne))).equals(null)
			o.check(await decryptEmptyValue(createEncryptedValueType(ValueTypeEnum.CompressedString, Cardinality.ZeroOrOne))).equals(null)
		})
	})

	o.spec("encryptValue", () => {
		o.test("encrypt string / number value", async () => {
			const valueType = createEncryptedValueType(ValueTypeEnum.String, Cardinality.One)
			const sk = aes256RandomKey()
			const value = "this is a string value"
			const subKeyInfo = new SubKeyInfoWithSessionKeyCbcThenHmac(sk)
			const subKeyProvider = symmetricCipherFacade.getSubKeyProvider(subKeyInfo, object())
			const encryptedValue = assertNotNull(cryptoMapper.encryptValue(valueType, ParsedValue.fromString(value), subKeyProvider, ""))
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sk, null, instanceTypeId)
			const decryptedValue = await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, "")
			o.check(decryptedValue.asString()).equals(value)
		})
		o.test("encrypt boolean value", async () => {
			const valueType = createEncryptedValueType(ValueTypeEnum.Boolean, Cardinality.One)
			const sk = aes256RandomKey()
			let value = false
			const subKeyInfo = new SubKeyInfoWithSessionKeyCbcThenHmac(sk)
			const subKeyProvider = symmetricCipherFacade.getSubKeyProvider(subKeyInfo, object())
			let encryptedValue = assertNotNull(cryptoMapper.encryptValue(valueType, ParsedValue.fromBoolean(value), subKeyProvider, ""))
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sk, null, instanceTypeId)
			let decryptedValue = await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, "")
			o.check(decryptedValue.asBoolean()).equals(false)

			value = true
			encryptedValue = assertNotNull(cryptoMapper.encryptValue(valueType, ParsedValue.fromBoolean(value), subKeyProvider, ""))
			decryptedValue = await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, "")
			o.check(decryptedValue.asBoolean()).equals(true)
		})

		o.test("encrypt date value", async () => {
			const valueType = createEncryptedValueType(ValueTypeEnum.Date, Cardinality.One)
			const sk = aes256RandomKey()
			const value = new Date()
			const subKeyInfo = new SubKeyInfoWithSessionKeyCbcThenHmac(sk)
			const subKeyProvider = symmetricCipherFacade.getSubKeyProvider(subKeyInfo, object())
			const encryptedValue = assertNotNull(cryptoMapper.encryptValue(valueType, ParsedValue.fromString(value.getTime().toString()), subKeyProvider, ""))
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sk, null, instanceTypeId)
			const decryptedValue = await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, "")
			o.check(decryptedValue.asDate()).deepEquals(value)
		})

		o.test("encrypt bytes value", async () => {
			const valueType = createEncryptedValueType(ValueTypeEnum.Bytes, Cardinality.One)
			const sk = aes256RandomKey()
			const value = random.generateRandomData(5)
			const subKeyInfo = new SubKeyInfoWithSessionKeyCbcThenHmac(sk)
			const subKeyProvider = symmetricCipherFacade.getSubKeyProvider(subKeyInfo, object())
			const encryptedValue = cryptoMapper.encryptValue(valueType, ParsedValue.fromByteArray(value), subKeyProvider, "")
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sk, null, instanceTypeId)
			const decryptedValue = await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, "")
			// FIXME: it's weird that we need to base64 decode it here.
			// then .encryptValue gets an encryptedByteArray and base64 encode that again
			// then .decryptValue gets an decryptedByte Array and puts back tht byteArray as base64 enocded again
			// cuasing all encrypted Bytes type to be base64 encoded twice.
			// FIXME: Ensure this is not causing error in prod
			o.check(Array.from(decryptedValue.asByteArray())).deepEquals(Array.from(value))
		})

		o.test("do not encrypt null values", () => {
			const dummyValueType = createEncryptedValueType(ValueTypeEnum.Bytes, Cardinality.One)

			const sk = aes256RandomKey()
			const subKeyInfo = new SubKeyInfoWithSessionKeyCbcThenHmac(sk)
			const subKeyProvider = symmetricCipherFacade.getSubKeyProvider(subKeyInfo, object())

			const encryptedValue = cryptoMapper.encryptValue(dummyValueType, ParsedValue.fromNull(), subKeyProvider, "").getNullWhenNull()
			o.check(encryptedValue).equals(null)
		})

		o.test("encrypt bytes with AEAD with session key roundtrip", async () => {
			const valueType = createEncryptedValueType(ValueTypeEnum.Bytes, Cardinality.One) as ModelValue
			const sessionKey = aes256RandomKey()
			const value = random.generateRandomData(5)
			const subKeyInfo = new SubKeyInfoWithSessionKeyAead(sessionKey)
			const clientTypeModel: ClientTypeModel = object()
			clientTypeModel.app = AppNameEnum.Tutanota
			clientTypeModel.id = 17
			const fieldPath: string = "19/something/23"
			const subKeyProvider = symmetricCipherFacade.getSubKeyProvider(subKeyInfo, clientTypeModel)
			const encryptedValue = neverNull(cryptoMapper.encryptValue(valueType, ParsedValue.fromByteArray(value), subKeyProvider, fieldPath))
			const instanceTypeId: InstanceTypeId = {
				app: clientTypeModel.app,
				id: clientTypeModel.id,
				name: "name",
			}
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sessionKey, null, instanceTypeId)
			const decryptedValue = await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, fieldPath)
			o.check(Array.from(decryptedValue.asByteArray())).deepEquals(Array.from(value))
		})

		o.test("encrypt bytes with AEAD with group key roundtrip", async () => {
			const valueType = createEncryptedValueType(ValueTypeEnum.Bytes, Cardinality.One) as ModelValue
			const value = random.generateRandomData(5)
			const groupKey: VersionedKey = { object: aes256RandomKey(), version: 0 }
			const kdfNonce: KdfNonce = generateKdfNonce()
			const subKeyInfo = new SubKeyInfoWithGroupKeyAead(groupKey, kdfNonce)
			const clientTypeModel: ClientTypeModel = object()
			clientTypeModel.app = AppNameEnum.Tutanota
			clientTypeModel.id = 29
			const fieldPath: string = "31/something/37"
			const subKeyProvider = symmetricCipherFacade.getSubKeyProvider(subKeyInfo, clientTypeModel)
			const encryptedValue = neverNull(cryptoMapper.encryptValue(valueType, ParsedValue.fromByteArray(value), subKeyProvider, fieldPath))
			const instanceTypeId: InstanceTypeId = {
				app: clientTypeModel.app,
				id: clientTypeModel.id,
				name: "name",
			}
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(null, kdfNonce, instanceTypeId)
			const groupId = "groupId"
			when(keyLoader.loadSymGroupKey(groupId, groupKey.version)).thenResolve(groupKey.object)
			const ownerKeyProvider = (groupKeyVersion: KeyVersion) => keyLoader.loadSymGroupKey(groupId, groupKeyVersion)
			const decryptedValue = await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, ownerKeyProvider, fieldPath)
			o.check(Array.from(decryptedValue.asByteArray())).deepEquals(Array.from(value))
		})
	})

	o.test("decryptParsedInstance happy path works", async () => {
		const sk = new Aes256Key([4136869568, 4101282953, 2038999435, 962526794, 1053028316, 3236029410, 1618615449, 3232287205])
		const encryptedParsedInstance = sampleEncryptedParsedInstance(sk)
		const ownerKeyProvider = async (_groupKeyVersion: KeyVersion) => aes256RandomKey()
		const decryptedInstance = await cryptoMapper.decryptParsedInstance(encryptedParsedInstance, sk, null, ownerKeyProvider, "")

		o.check(decryptedInstance.getAttributeById(1).asString()).equals("encrypted string")
		o.check(decryptedInstance.getAttributeById(5).asDate().toISOString()).equals("2025-01-01T13:00:00.000Z")

		o.check(decryptedInstance.getAttributeById(3).asNestedObjList()[0].getAttributeById(2).asString()).equals("123")
		o.check(decryptedInstance.getAttributeById(4).asIdList()[0]).equals("associatedElementId")
		o.check(decryptedInstance.hasError()).equals(false)
	})
	o.test("encryptParsedInstance happy path works", async () => {
		const sk = new Aes256Key([4136869568, 4101282953, 2038999435, 962526794, 1053028316, 3236029410, 1618615449, 3232287205])

		const subKeyInfo = new SubKeyInfoWithSessionKeyCbcThenHmac(sk)
		const encryptedInstance = await cryptoMapper.encryptParsedInstance(decryptedParsedInstance, subKeyInfo)

		const encryptedBytes = encryptedInstance.getAttributeById(1).asByteArray()
		const decryptedValue = utf8Uint8ArrayToString(aesDecrypt(sk, encryptedBytes))

		o.check(decryptedValue).equals(decryptedParsedInstance.getAttributeById(1).asString())
		o.check(encryptedInstance.getAttributeById(5).asDate()).deepEquals(decryptedParsedInstance.getAttributeById(5).asDate())

		const encryptedAggregate = encryptedInstance.getAttributeById(3).asNestedObjList()[0]
		o.check(encryptedAggregate.getAttributeById(2).asString()).equals("123")
		o.check(encryptedAggregate.getAttributeById(6).asId()).equals("aggregateId")
		o.check(encryptedAggregate.getAttributeById(2)) // fixme: o.check() does is accepts boolean or what is this line doing?
		o.check(encryptedInstance.getAttributeById(4).asIdList()[0]).equals("associatedElementId")
	})

	o.test("decryptParsedInstance with missing sk sets _errors", async () => {
		const sk = aes256RandomKey()
		const ownerKeyProvider = async (_groupKeyVersion: KeyVersion) => sk
		const encryptedParsedInstance = sampleEncryptedParsedInstance(sk).addAttributeById(
			1,
			ParsedValue.fromString("AV1kmZZfCms1pNvUtGrdhOlnDAr3zb2JWpmlpWEhgG5zqYK3g7PfRsi0vQAKLxXmrNRGp16SBKBa0gqXeFw9F6l7nbGs3U8uNLvs6Fi+9IWj"),
		)

		const instance = await cryptoMapper.decryptParsedInstance(encryptedParsedInstance, null, null, ownerKeyProvider, "")
		o.check(instance.getAttributeById(1).asString()).equals("") // default value is assigned in case of crypto errors
		o.check(instance.getErrors()[14]).equals("Probably temporary SessionKeyNotFound")
	})

	o.test("encryptParsedInstance with missing sk throws", async () => {
		const err = await assertThrows(CryptoError, () => cryptoMapper.encryptParsedInstance(decryptedParsedInstance, null))
		o.check(err.message).equals("Encrypting testValue requires keys!")
	})

	o.test("decrypting default values works correctly", async () => {
		const sk = new Aes256Key([4136869568, 4101282953, 2038999435, 962526794, 1053028316, 3236029410, 1618615449, 3232287205])
		const encryptedParsedInstance = sampleEncryptedParsedInstance(sk)
			.addAttributeById(1, ParsedValue.fromString(""))
			.addAttributeById(2, ParsedValue.fromString(""))

		const ownerKeyProvider = async (_groupKeyVersion: KeyVersion) => aes256RandomKey()
		const decryptedInstance = await cryptoMapper.decryptParsedInstance(encryptedParsedInstance, sk, null, ownerKeyProvider, "")

		o.check(decryptedInstance.getAttributeById(1).asString()).equals("")
		o.check(decryptedInstance.getAttributeById(2).getNullWhenNull()).equals(null)
		o.check(decryptedInstance.hasError()).equals(false)
	})

	o.test("decryption errors are written to _errors field", async () => {
		const sk = new Aes256Key([4136869568, 4101282953, 2038999435, 962526794, 1053028316, 3236029410, 1618615449, 3232287205])
		const encryptedParsedInstance = sampleEncryptedParsedInstance(sk).addAttributeById(
			1,
			ParsedValue.fromString("AV1kmZZfCms1pNvUtGrdhOlnDAr3zb2pmlpWEhgG5iwzqYK3g7PfRsi0vQAKLxXmrNRGp16SBKBa0gqXeFw9F6l7nbGs3U8uNLvs6Fi+9IWj"),
		)

		const ownerKeyProvider = async (_groupKeyVersion: KeyVersion) => aes256RandomKey()
		const instanceWithErrors = await cryptoMapper.decryptParsedInstance(encryptedParsedInstance, sk, null, ownerKeyProvider, "")
		o.check(typeof instanceWithErrors.getErrors()[1]).equals("string")
	})

	o.spec("decryptValue", () => {
		let valueDecryptor: ValueDecryptor
		let instanceDecryptor: InstanceDecryptor
		let valueType: EncryptedModelValue
		let encryptedValue: EncryptedParsedValue

		o.beforeEach(() => {
			valueDecryptor = object()
			when(valueDecryptor.getValue(matchers.anything())).thenReturn(new Uint8Array())
			instanceDecryptor = object()
			valueType = createEncryptedValueType(ValueTypeEnum.String, Cardinality.One)
			const nonEmptyNumberArray = [0]
			const ciphertext = Uint8Array.from(nonEmptyNumberArray)
			encryptedValue = ParsedValue.fromByteArray(ciphertext)
		})

		o.test("value decryption requires a session key and there is a session key", async () => {
			replace(valueDecryptor, "requiredGroupKeyVersion", null)
			when(instanceDecryptor.getValueDecryptor(matchers.anything(), matchers.anything())).thenReturn(valueDecryptor)

			await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, "")
			verify(valueDecryptor.getValue(null))
		})

		o.test("value decryption requires a session key but there is no session key", async () => {
			when(instanceDecryptor.getValueDecryptor(matchers.anything(), matchers.anything())).thenThrow(new SessionKeyNotFoundError("no session key"))

			await assertThrows(SessionKeyNotFoundError, () => cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, ""))
		})

		o.test("value decryption requires a group key and the group ID is present", async () => {
			replace(valueDecryptor, "requiredGroupKeyVersion", 0)
			when(instanceDecryptor.getValueDecryptor(matchers.anything(), matchers.anything())).thenReturn(valueDecryptor)
			const groupId = "groupId"
			const aes256Key = aes256RandomKey()
			when(keyLoader.loadSymGroupKey(groupId, matchers.anything())).thenReturn(Promise.resolve(aes256Key))

			const ownerKeyProvider = (groupKeyVersion: KeyVersion) => keyLoader.loadSymGroupKey(groupId, groupKeyVersion)
			await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, ownerKeyProvider, "")
			verify(valueDecryptor.getValue(aes256Key))
		})

		o.test("value decryption requires a group key but the group ID is missing", async () => {
			replace(valueDecryptor, "requiredGroupKeyVersion", 0)
			when(instanceDecryptor.getValueDecryptor(matchers.anything(), matchers.anything())).thenReturn(valueDecryptor)

			await assertThrows(CryptoError, () => cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, ""))
		})
	})
	o.spec("decryptParsedInstance", () => {
		o.test("assembles correct field path", async () => {
			let valueDecryptor: ValueDecryptor = object()
			replace(valueDecryptor, "requiredGroupKeyVersion", null)
			let instanceDecryptor: InstanceDecryptor = object()
			when(instanceDecryptor.getValueDecryptor(matchers.anything(), matchers.anything())).thenReturn(valueDecryptor)
			const symmetricCipherFacade: SymmetricCipherFacade = object()
			when(symmetricCipherFacade.getInstanceDecryptor(matchers.anything(), matchers.anything(), matchers.anything())).thenReturn(instanceDecryptor)
			replace(cryptoMapper, "symmetricCipherFacade", symmetricCipherFacade)
			const sessionKey = aes256RandomKey()
			const encryptedInstance = sampleEncryptedParsedInstance(sessionKey)
			const ownerKeyProvider = async (_groupKeyVersion: KeyVersion) => aes256RandomKey()
			try {
				await cryptoMapper.decryptParsedInstance(encryptedInstance, sessionKey, null, ownerKeyProvider, "")
			} catch (_) {
				/* empty */
			}
			verify(instanceDecryptor.getValueDecryptor(matchers.anything(), "3/someCustomId/9/anotherCustomId/17"))
		})
	})
	o.test("encryptParsedInstance assembles correct field paths", async () => {
		const sessionKey = new Aes256Key([4136869568, 4101282953, 2038999435, 962526794, 1053028316, 3236029410, 1618615449, 3232287205])
		const encryptBytesWithAead = (symmetricCipherFacade.encryptBytesWithAead = spy(symmetricCipherFacade.encryptBytesWithAead))

		const subKeyInfo = new SubKeyInfoWithSessionKeyAead(sessionKey)
		await cryptoMapper.encryptParsedInstance(decryptedParsedInstance, subKeyInfo)
		o.check(
			encryptBytesWithAead.invocations.some((invocationParameters) =>
				arrayEquals(stringToUtf8Uint8Array("attributeEncSK3/aggregateId/9/anotherCustomId/17"), invocationParameters[2]),
			),
		).equals(true)
	})
})
