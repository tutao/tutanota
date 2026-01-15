import o from "@tutao/otest"
import { aes256RandomKey, aesDecrypt, aesEncrypt, random } from "@tutao/tutanota-crypto"
import { Cardinality, ValueType } from "../../../../../src/common/api/common/EntityConstants.js"
import {
	ClientModelParsedInstance,
	ClientTypeModel,
	ServerModelEncryptedParsedInstance,
	ServerTypeModel,
} from "../../../../../src/common/api/common/EntityTypes.js"
import { base64ToUint8Array, neverNull, stringToUtf8Uint8Array, uint8ArrayToBase64, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import { CryptoMapper, decryptValue, encryptValue } from "../../../../../src/common/api/worker/crypto/CryptoMapper"
import { createEncryptedValueType, dummyResolver, testTypeModel } from "./InstancePipelineTestUtils"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { ClientTypeReferenceResolver, ServerTypeReferenceResolver } from "../../../../../src/common/api/common/EntityFunctions"

o.spec("CryptoMapper", () => {
	let cryptoMapper: CryptoMapper
	cryptoMapper = new CryptoMapper(dummyResolver as ClientTypeReferenceResolver, dummyResolver as ServerTypeReferenceResolver)

	o.spec("decryptValue", () => {
		o.test("decrypt string / number value without mac", () => {
			let sk = aes256RandomKey()
			let value = "this is a string value"
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value)))
			o.check(decryptValue(createEncryptedValueType(ValueType.String, Cardinality.One), encryptedValue, sk)).equals(value)
			value = "516546"
			encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value)))
			o.check(decryptValue(createEncryptedValueType(ValueType.String, Cardinality.One), encryptedValue, sk)).equals(value)
		})
		o.test("decrypt string / number value with mac", () => {
			let sk = aes256RandomKey()
			let value = "this is a string value"
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value)))
			o.check(decryptValue(createEncryptedValueType(ValueType.String, Cardinality.One), encryptedValue, sk)).equals(value)
			value = "516546"
			encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value)))
			o.check(decryptValue(createEncryptedValueType(ValueType.String, Cardinality.One), encryptedValue, sk)).equals(value)
		})
		o.test("decrypt boolean value without mac", () => {
			let valueType = createEncryptedValueType(ValueType.Boolean, Cardinality.One)
			let sk = aes256RandomKey()
			let value = "0"
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value)))
			o.check(decryptValue(valueType, encryptedValue, sk)).equals(false)
			value = "1"
			encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value)))
			o.check(decryptValue(valueType, encryptedValue, sk)).equals(true)
			value = "32498"
			encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value)))
			o.check(decryptValue(valueType, encryptedValue, sk)).equals(true)
		})
		o.test("decrypt boolean value with mac", () => {
			let valueType = createEncryptedValueType(ValueType.Boolean, Cardinality.One)
			let sk = aes256RandomKey()
			let value = "0"
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value)))
			o.check(decryptValue(valueType, encryptedValue, sk)).equals(false)
			value = "1"
			encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value)))
			o.check(decryptValue(valueType, encryptedValue, sk)).equals(true)
			value = "32498"
			encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value)))
			o.check(decryptValue(valueType, encryptedValue, sk)).equals(true)
		})
		o.test("decrypt date value without mac", () => {
			let valueType = createEncryptedValueType(ValueType.Date, Cardinality.One)
			let sk = aes256RandomKey()
			let value = new Date().getTime().toString()
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value)))
			o.check(decryptValue(valueType, encryptedValue, sk)).deepEquals(new Date(parseInt(value)))
		})
		o.test("decrypt date value with mac", () => {
			let valueType = createEncryptedValueType(ValueType.Date, Cardinality.One)
			let sk = aes256RandomKey()
			let value = new Date().getTime().toString()
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value)))
			o.check(decryptValue(valueType, encryptedValue, sk)).deepEquals(new Date(parseInt(value)))
		})
		o.test("decrypt bytes value without mac", () => {
			let valueType = createEncryptedValueType(ValueType.Bytes, Cardinality.One)
			let sk = aes256RandomKey()
			let value = random.generateRandomData(5)
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, value))
			let decryptedValue = decryptValue(valueType, encryptedValue, sk)
			o.check(decryptedValue instanceof Uint8Array).equals(true)
			o.check(Array.from(decryptedValue as Uint8Array)).deepEquals(Array.from(value))
		})
		o.test("decrypt bytes value with mac", () => {
			let valueType = createEncryptedValueType(ValueType.Bytes, Cardinality.One)
			let sk = aes256RandomKey()
			let value = random.generateRandomData(5)
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, value))
			let decryptedValue = decryptValue(valueType, encryptedValue, sk)
			o.check(decryptedValue instanceof Uint8Array).equals(true)
			o.check(Array.from(decryptedValue as Uint8Array)).deepEquals(Array.from(value))
		})
		o.test("decrypt compressedString", () => {
			let valueType = createEncryptedValueType(ValueType.CompressedString, Cardinality.One)
			let sk = aes256RandomKey()
			let value = base64ToUint8Array("QHRlc3Q=")
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, value))
			let decryptedValue = decryptValue(valueType, encryptedValue, sk)
			o.check(typeof decryptedValue === "string").equals(true)
			o.check(decryptedValue).equals("test")
		})
		o.test("decrypt compressedString w resize", () => {
			let valueType = createEncryptedValueType(ValueType.CompressedString, Cardinality.One)
			let sk = aes256RandomKey()
			let value = base64ToUint8Array("X3RleHQgBQD//1FQdGV4dCA=")
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, value))
			let decryptedValue = decryptValue(valueType, encryptedValue, sk)
			o.check(typeof decryptedValue === "string").equals(true)
			o.check(decryptedValue).equals(
				"text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text ",
			)
		})
		o.test("decrypt empty compressedString", () => {
			let valueType = createEncryptedValueType(ValueType.CompressedString, Cardinality.One)
			let sk = aes256RandomKey()
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, new Uint8Array([])))
			let decryptedValue = decryptValue(valueType, encryptedValue, sk)
			o.check(typeof decryptedValue === "string").equals(true)
			o.check(decryptedValue).equals("")
		})
		o.test("do not decrypt null values", () => {
			let sk = aes256RandomKey()
			o.check(decryptValue(createEncryptedValueType(ValueType.String, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o.check(decryptValue(createEncryptedValueType(ValueType.Date, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o.check(decryptValue(createEncryptedValueType(ValueType.Bytes, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o.check(decryptValue(createEncryptedValueType(ValueType.Boolean, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o.check(decryptValue(createEncryptedValueType(ValueType.Number, Cardinality.ZeroOrOne), null, sk)).equals(null)
		})
		o.test("do not decrypt empty values with Cardinality.ZeroOrOne", () => {
			let sk = aes256RandomKey()
			o.check(decryptValue(createEncryptedValueType(ValueType.String, Cardinality.ZeroOrOne), "", sk)).equals(null)
			o.check(decryptValue(createEncryptedValueType(ValueType.Date, Cardinality.ZeroOrOne), "", sk)).equals(null)
			o.check(decryptValue(createEncryptedValueType(ValueType.Bytes, Cardinality.ZeroOrOne), "", sk)).equals(null)
			o.check(decryptValue(createEncryptedValueType(ValueType.Boolean, Cardinality.ZeroOrOne), "", sk)).equals(null)
			o.check(decryptValue(createEncryptedValueType(ValueType.Number, Cardinality.ZeroOrOne), "", sk)).equals(null)
		})
	})
	o.spec("encryptValue", () => {
		o.test("encrypt string / number value", () => {
			const valueType = createEncryptedValueType(ValueType.String, Cardinality.One)
			let sk = aes256RandomKey()
			let value = "this is a string value"
			let encryptedValue = neverNull(encryptValue(valueType, value, sk))
			o.check(decryptValue(valueType, encryptedValue, sk)).equals(value)
		})
		o.test("encrypt boolean value", () => {
			let valueType = createEncryptedValueType(ValueType.Boolean, Cardinality.One)
			let sk = aes256RandomKey()
			let value = false
			let encryptedValue = neverNull(encryptValue(valueType, value, sk))
			o.check(decryptValue(valueType, encryptedValue, sk)).equals(false)
			value = true
			encryptedValue = neverNull(encryptValue(valueType, value, sk))
			o.check(decryptValue(valueType, encryptedValue, sk)).equals(true)
		})
		o.test("encrypt date value", () => {
			let valueType = createEncryptedValueType(ValueType.Date, Cardinality.One)
			let sk = aes256RandomKey()
			let value = new Date()
			let encryptedValue = neverNull(encryptValue(valueType, value, sk))
			o.check(decryptValue(valueType, encryptedValue, sk)).deepEquals(value)
		})
		o.test("encrypt bytes value", () => {
			let valueType = createEncryptedValueType(ValueType.Bytes, Cardinality.One)
			let sk = aes256RandomKey()
			let value = random.generateRandomData(5)
			let encryptedValue = neverNull(encryptValue(valueType, value, sk))
			const decryptedValue = decryptValue(valueType, encryptedValue, sk)
			o.check(Array.from(decryptedValue as Uint8Array)).deepEquals(Array.from(value))
		})
		o.test("do not encrypt null values", () => {
			let sk = aes256RandomKey()
			o.check(encryptValue(createEncryptedValueType(ValueType.String, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o.check(encryptValue(createEncryptedValueType(ValueType.Date, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o.check(encryptValue(createEncryptedValueType(ValueType.Bytes, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o.check(encryptValue(createEncryptedValueType(ValueType.Boolean, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o.check(encryptValue(createEncryptedValueType(ValueType.Number, Cardinality.ZeroOrOne), null, sk)).equals(null)
		})
	})

	o.test("decryptParsedInstance happy path works", async () => {
		const sk = [4136869568, 4101282953, 2038999435, 962526794, 1053028316, 3236029410, 1618615449, 3232287205]
		const encryptedInstance: ServerModelEncryptedParsedInstance = {
			1: "AV1kmZZfCms1pNvUtGrdhOlnDAr3zb2JWpmlpWEhgG5zqYK3g7PfRsi0vQAKLxXmrNRGp16SBKBa0gqXeFw9F6l7nbGs3U8uNLvs6Fi+9IWj",
			3: [{ 2: "123", 6: "someCustomId", 9: [], 10: [] }],
			7: "AWBaC3ipyi9kxJn7USkbW1SLXPjgU8T5YqpIP/dmTbyRwtXFU9tQbYBm12gNpI9KJfwO14FN25hjC3SlngSBlzs=",
			4: ["associatedElementId"],
			5: new Date("2025-01-01T13:00:00.000Z"),
		} as any as ServerModelEncryptedParsedInstance
		const decryptedInstance = await cryptoMapper.decryptParsedInstance(testTypeModel as ServerTypeModel, encryptedInstance, sk)

		o.check(decryptedInstance[1]).equals("encrypted string")
		o.check((decryptedInstance[5] as Date).toISOString()).equals("2025-01-01T13:00:00.000Z")

		o.check(decryptedInstance[3]![0][2]).equals("123")
		o.check(decryptedInstance[4]![0]).equals("associatedElementId")
		o.check(typeof decryptedInstance._errors).equals("undefined")
	})
	o.test("encryptParsedInstance happy path works", async () => {
		const sk = [4136869568, 4101282953, 2038999435, 962526794, 1053028316, 3236029410, 1618615449, 3232287205]

		const parsedInstance: ClientModelParsedInstance = {
			1: "encrypted string",
			5: new Date("2025-01-01T13:00:00.000Z"),
			7: true,
			// 6 is _id and will be generated
			3: [{ 2: "123", 6: "aggregateId", 9: [], 10: [] }],
			4: ["associatedElementId"],
		} as unknown as ClientModelParsedInstance
		const encryptedInstance = await cryptoMapper.encryptParsedInstance(testTypeModel as ClientTypeModel, parsedInstance, sk)

		const encryptedBytes = base64ToUint8Array(encryptedInstance[1] as string)
		const decryptedValue = utf8Uint8ArrayToString(aesDecrypt(sk, encryptedBytes))
		o.check(decryptedValue).equals(parsedInstance[1] as string)
		o.check((encryptedInstance[5] as Date).toISOString()).deepEquals((parsedInstance[5] as Date).toISOString())
		const encryptedAggregate = encryptedInstance[3]![0]
		o.check(encryptedAggregate[2]).equals(parsedInstance[3]![0][2] as string)
		o.check(encryptedAggregate[6]).equals("aggregateId")
		o.check(encryptedAggregate[2])
		o.check(encryptedInstance[4]![0]).equals("associatedElementId")
	})

	o.test("decryptParsedInstance with missing sk sets _errors", async () => {
		const encryptedInstance: ServerModelEncryptedParsedInstance = {
			1: "AV1kmZZfCms1pNvUtGrdhOlnDAr3zb2JWpmlpWEhgG5zqYK3g7PfRsi0vQAKLxXmrNRGp16SBKBa0gqXeFw9F6l7nbGs3U8uNLvs6Fi+9IWj",
			3: [{ 2: "123", 6: "someCustomId", 9: [], 10: [] }],
			4: ["associatedElementId"],
			5: new Date("2025-01-01T13:00:00.000Z"),
		} as any as ServerModelEncryptedParsedInstance
		const instance = await cryptoMapper.decryptParsedInstance(testTypeModel as ServerTypeModel, encryptedInstance, null)
		o.check(instance[1]).equals("") // default value is assigned in case of crypto errors
		o.check(instance._errors?.[14]).equals("Probably temporary SessionKeyNotFound")
	})

	o.test("encryptParsedInstance with missing sk throws", async () => {
		const parsedInstance: ClientModelParsedInstance = {
			1: "encrypted string",
			5: new Date("2025-01-01T13:00:00.000Z"),
			// 6 is _id and will be generated
			3: [{ 2: "123", 9: [], 10: [] }],
			4: ["associatedElementId"],
		} as unknown as ClientModelParsedInstance
		await assertThrows(CryptoError, () => cryptoMapper.encryptParsedInstance(testTypeModel as ClientTypeModel, parsedInstance, null))
	})

	o.test("decrypting default values works correctly", async () => {
		const sk = [4136869568, 4101282953, 2038999435, 962526794, 1053028316, 3236029410, 1618615449, 3232287205]

		const encryptedInstance: ServerModelEncryptedParsedInstance = {
			1: "",
			2: "",
			3: [{ 2: "123", 6: "someCustomId", 9: [], 10: [] }],
			4: ["associatedElementId"],
			5: new Date("2025-01-01T13:00:00.000Z"),
		} as any as ServerModelEncryptedParsedInstance

		const decryptedInstance = await cryptoMapper.decryptParsedInstance(testTypeModel as ServerTypeModel, encryptedInstance, sk)

		o.check(decryptedInstance[1]).equals("")
		o.check(decryptedInstance[2]).equals(null)
		o.check(decryptedInstance._errors).equals(undefined)
	})

	o.test("decryption errors are written to _errors field", async () => {
		const sk = [4136869568, 4101282953, 2038999435, 962526794, 1053028316, 3236029410, 1618615449, 3232287205]
		const encryptedInstance: ServerModelEncryptedParsedInstance = {
			1: "AV1kmZZfCms1pNvUtGrdhOlnDAr3zb2pmlpWEhgG5iwzqYK3g7PfRsi0vQAKLxXmrNRGp16SBKBa0gqXeFw9F6l7nbGs3U8uNLvs6Fi+9IWj",
			3: [{ 2: "123", 6: "someCustomId", 9: [], 10: [] }],
			4: ["associatedElementId"],
			5: new Date("2025-01-01T13:00:00.000Z"),
		} as any as ServerModelEncryptedParsedInstance

		const instanceWithErrors = await cryptoMapper.decryptParsedInstance(testTypeModel as ServerTypeModel, encryptedInstance, sk)
		console.log(instanceWithErrors._errors?.[1])
		o.check(typeof instanceWithErrors._errors?.[1]).equals("string")
	})
})
