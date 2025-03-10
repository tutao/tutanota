import o from "@tutao/otest"
import { aes256RandomKey, aesDecrypt, aesEncrypt, ENABLE_MAC, IV_BYTE_LENGTH, random } from "@tutao/tutanota-crypto"
import { Cardinality, ValueType } from "../../../../../src/common/api/common/EntityConstants.js"
import { ClientModelParsedInstance, EncryptedParsedInstance, ServerModelEncryptedParsedInstance } from "../../../../../src/common/api/common/EntityTypes.js"
import { base64ToUint8Array, neverNull, stringToUtf8Uint8Array, uint8ArrayToBase64, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import { CryptoMapper, decryptValue, encryptValue } from "../../../../../src/common/api/worker/crypto/CryptoMapper"
import { createEncryptedValueType, dummyResolver, testTypeModel } from "./InstancePipelineTestUtils"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { Type } from "cborg"
import { TypeReferenceResolver } from "../../../../../src/common/api/common/EntityFunctions"

o.spec("CryptoMapper", function () {
	let cryptoMapper: CryptoMapper
	cryptoMapper = new CryptoMapper(dummyResolver as TypeReferenceResolver, dummyResolver as TypeReferenceResolver)

	o.spec("decryptValue", function () {
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
			let decryptedValue = decryptValue(valueType, encryptedValue, sk)
			o(decryptedValue instanceof Uint8Array).equals(true)
			o(Array.from(decryptedValue as Uint8Array)).deepEquals(Array.from(value))
		})
		o("decrypt bytes value with mac", function () {
			let valueType = createEncryptedValueType(ValueType.Bytes, Cardinality.One)
			let sk = aes256RandomKey()
			let value = random.generateRandomData(5)
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, value, random.generateRandomData(IV_BYTE_LENGTH), true, true))
			let decryptedValue = decryptValue(valueType, encryptedValue, sk)
			o(decryptedValue instanceof Uint8Array).equals(true)
			o(Array.from(decryptedValue as Uint8Array)).deepEquals(Array.from(value))
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
			const decryptedValue = decryptValue(valueType, encryptedValue, sk)
			o(Array.from(decryptedValue as Uint8Array)).deepEquals(Array.from(value))
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

	o("decryptParsedInstance happy path works", async function () {
		const sk = [4136869568, 4101282953, 2038999435, 962526794, 1053028316, 3236029410, 1618615449, 3232287205]
		const encryptedInstance: ServerModelEncryptedParsedInstance = {
			1: "AV1kmZZfCms1pNvUtGrdhOlnDAr3zb2JWpmlpWEhgG5zqYK3g7PfRsi0vQAKLxXmrNRGp16SBKBa0gqXeFw9F6l7nbGs3U8uNLvs6Fi+9IWj",
			3: [{ 2: "123", 6: "someCustomId" }],
			7: "AWBaC3ipyi9kxJn7USkbW1SLXPjgU8T5YqpIP/dmTbyRwtXFU9tQbYBm12gNpI9KJfwO14FN25hjC3SlngSBlzs=",
			4: ["associatedListId"],
			5: new Date("2025-01-01T13:00:00.000Z"),
		} as any as ServerModelEncryptedParsedInstance
		const expectedFinalIv = new Uint8Array([93, 100, 153, 150, 95, 10, 107, 53, 164, 219, 212, 180, 106, 221, 132, 233])
		const decryptedInstance = await cryptoMapper.decryptParsedInstance(testTypeModel, encryptedInstance, sk)

		o(decryptedInstance[1]).equals("encrypted string")
		o((decryptedInstance[5] as Date).toISOString()).equals("2025-01-01T13:00:00.000Z")

		o(decryptedInstance[3]![0][2]).equals("123")
		o(decryptedInstance[4]![0]).equals("associatedListId")
		o(typeof decryptedInstance._finalIvs[7]).equals("undefined")
		o(Array.from(decryptedInstance["_finalIvs"][1] as Uint8Array)).deepEquals(Array.from(expectedFinalIv))
		o(typeof decryptedInstance._errors).equals("undefined")
	})
	o("encryptParsedInstance happy path works", async function () {
		const sk = [4136869568, 4101282953, 2038999435, 962526794, 1053028316, 3236029410, 1618615449, 3232287205]

		const parsedInstance: ClientModelParsedInstance = {
			1: "encrypted string",
			5: new Date("2025-01-01T13:00:00.000Z"),
			7: true,
			// 6 is _id and will be generated
			3: [{ 2: "123", 6: "aggregateId" }],
			4: ["associatedListId"],
			_finalIvs: { 1: new Uint8Array([93, 100, 153, 150, 95, 10, 107, 53, 164, 219, 212, 180, 106, 221, 132, 233]) },
		} as unknown as ClientModelParsedInstance
		const encryptedInstance = await cryptoMapper.encryptParsedInstance(testTypeModel, parsedInstance, sk)

		const expectedCipherText = "AV1kmZZfCms1pNvUtGrdhOlnDAr3zb2JWpmlpWEhgG5zqYK3g7PfRsi0vQAKLxXmrNRGp16SBKBa0gqXeFw9F6l7nbGs3U8uNLvs6Fi+9IWj"
		o(encryptedInstance[1]).equals(expectedCipherText)

		const encryptedBytes = base64ToUint8Array(encryptedInstance[1] as string)
		const decryptedValue = utf8Uint8ArrayToString(aesDecrypt(sk, encryptedBytes))
		o(decryptedValue).equals(parsedInstance[1] as string)
		o((encryptedInstance[5] as Date).toISOString()).deepEquals((parsedInstance[5] as Date).toISOString())
		const encryptedAggregate = encryptedInstance[3]![0]
		o(encryptedAggregate[2]).equals(parsedInstance[3]![0][2] as string)
		o(encryptedAggregate[6]).equals("aggregateId")
		o(encryptedAggregate[2])
		o(encryptedInstance[4]![0]).equals("associatedListId")
	})

	o("decryptParsedInstance with missing sk sets _errors", async function () {
		const encryptedInstance: ServerModelEncryptedParsedInstance = {
			1: "AV1kmZZfCms1pNvUtGrdhOlnDAr3zb2JWpmlpWEhgG5zqYK3g7PfRsi0vQAKLxXmrNRGp16SBKBa0gqXeFw9F6l7nbGs3U8uNLvs6Fi+9IWj",
			3: [{ 2: "123", 6: "someCustomId" }],
			4: ["associatedListId"],
			5: new Date("2025-01-01T13:00:00.000Z"),
		} as any as ServerModelEncryptedParsedInstance
		const instance = await cryptoMapper.decryptParsedInstance(testTypeModel, encryptedInstance, null)
		o(instance[1]).equals("") // default value is assigned in case of crypto errors
		o(typeof instance._errors?.[1]).equals("string")
	})

	o("encryptParsedInstance with missing sk throws", async function () {
		const parsedInstance: ClientModelParsedInstance = {
			1: "encrypted string",
			5: new Date("2025-01-01T13:00:00.000Z"),
			// 6 is _id and will be generated
			3: [{ 2: "123" }],
			4: ["associatedListId"],
			_finalIvs: { 1: new Uint8Array([93, 100, 153, 150, 95, 10, 107, 53, 164, 219, 212, 180, 106, 221, 132, 233]) },
		} as unknown as ClientModelParsedInstance
		await assertThrows(CryptoError, () => cryptoMapper.encryptParsedInstance(testTypeModel, parsedInstance, null))
	})

	o("decrypting default values works correctly", async function () {
		const sk = [4136869568, 4101282953, 2038999435, 962526794, 1053028316, 3236029410, 1618615449, 3232287205]

		const encryptedInstance: ServerModelEncryptedParsedInstance = {
			1: "",
			3: [{ 2: "123", 6: "someCustomId" }],
			4: ["associatedListId"],
			5: new Date("2025-01-01T13:00:00.000Z"),
		} as any as ServerModelEncryptedParsedInstance

		const decryptedInstance = await cryptoMapper.decryptParsedInstance(testTypeModel, encryptedInstance, sk)

		o(decryptedInstance[1]).equals("")
		o(decryptedInstance._finalIvs[1]).equals(null)
	})

	o("encrypting default values works correctly", async function () {
		const sk = [4136869568, 4101282953, 2038999435, 962526794, 1053028316, 3236029410, 1618615449, 3232287205]
		const parsedInstance: ClientModelParsedInstance = {
			1: "",
			5: new Date("2025-01-01T13:00:00.000Z"),
			// 6 is _id and will be generated
			3: [{ 2: "123" }],
			4: ["associatedListId"],
			_finalIvs: { 1: null },
		} as unknown as ClientModelParsedInstance

		const encryptedInstance = await cryptoMapper.encryptParsedInstance(testTypeModel, parsedInstance, sk)
		o(encryptedInstance[1]).equals("")
	})

	o("decryption errors are written to _errors field", async function () {
		const sk = [4136869568, 4101282953, 2038999435, 962526794, 1053028316, 3236029410, 1618615449, 3232287205]
		const encryptedInstance: ServerModelEncryptedParsedInstance = {
			1: "AV1kmZZfCms1pNvUtGrdhOlnDAr3zb2pmlpWEhgG5iwzqYK3g7PfRsi0vQAKLxXmrNRGp16SBKBa0gqXeFw9F6l7nbGs3U8uNLvs6Fi+9IWj",
			3: [{ 2: "123", 6: "someCustomId" }],
			4: ["associatedListId"],
			5: new Date("2025-01-01T13:00:00.000Z"),
		} as any as ServerModelEncryptedParsedInstance

		const instanceWithErrors = await cryptoMapper.decryptParsedInstance(testTypeModel, encryptedInstance, sk)
		console.log(instanceWithErrors._errors?.[1])
		o(typeof instanceWithErrors._errors?.[1]).equals("string")
	})
})
