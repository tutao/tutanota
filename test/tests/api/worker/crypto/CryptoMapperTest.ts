import o from "@tutao/otest"
import {
	aes256RandomKey,
	aesDecrypt,
	aesEncrypt,
	InstanceDecryptor,
	MissingSessionKey,
	random,
	SYMMETRIC_CIPHER_FACADE,
	SymmetricCipherFacade,
	ValueDecryptor,
} from "@tutao/crypto"
import { Cardinality, ValueType } from "../../../../../src/common/api/common/EntityConstants.js"
import { base64ToUint8Array, neverNull, stringToUtf8Uint8Array, uint8ArrayToBase64, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import { CryptoMapper, encryptValue } from "../../../../../src/common/api/worker/crypto/CryptoMapper"
import { createEncryptedValueType, dummyResolver, testTypeModel } from "./InstancePipelineTestUtils"
import { ClientTypeReferenceResolver, ServerTypeReferenceResolver } from "../../../../../src/common/api/common/EntityFunctions"
import { matchers, object, replace, verify, when } from "testdouble"
import { KeyLoaderFacade } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade"
import {
	ClientModelParsedInstance,
	ClientTypeModel,
	ModelValue,
	ServerModelEncryptedParsedInstance,
	ServerTypeModel,
} from "../../../../../src/common/api/common/EntityTypes.js"
import { base64ToUint8Array, neverNull, stringToUtf8Uint8Array, uint8ArrayToBase64, utf8Uint8ArrayToString } from "@tutao/utils"
import { CryptoMapper, decryptValue, encryptValue } from "../../../../../src/common/api/worker/crypto/CryptoMapper"
import { createEncryptedValueType, dummyResolver, testTypeModel } from "./InstancePipelineTestUtils"
import { assertThrows } from "@tutao/otest"
import { CryptoError, SessionKeyNotFoundError } from "@tutao/crypto/error"
import { ClientTypeReferenceResolver, ServerTypeReferenceResolver, ModelMapper } from "../../../../../src/common/api/common/EntityFunctions"

o.spec("CryptoMapper", () => {
	const symmetricCipherFacade: SymmetricCipherFacade = SYMMETRIC_CIPHER_FACADE
	const keyLoader: KeyLoaderFacade = object()
	const modelMapper: ModelMapper = object()
	const cryptoMapper: CryptoMapper = new CryptoMapper(
		dummyResolver as ClientTypeReferenceResolver,
		dummyResolver as ServerTypeReferenceResolver,
		symmetricCipherFacade,
		() => keyLoader,
		modelMapper,
	)
	o.spec("decryptValue aesCbc", () => {
		o.test("decrypt string / number value", async () => {
			const sk = aes256RandomKey()
			let value = "this is a string value"
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sk, null, "")
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value)))
			o.check(
				await cryptoMapper.decryptValue(createEncryptedValueType(ValueType.String, Cardinality.One), encryptedValue, instanceDecryptor, null, ""),
			).equals(value)
			value = "516546"
			encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value)))
			o.check(
				await cryptoMapper.decryptValue(createEncryptedValueType(ValueType.String, Cardinality.One), encryptedValue, instanceDecryptor, null, ""),
			).equals(value)
		})
		o.test("decrypt boolean value", async () => {
			const valueType = createEncryptedValueType(ValueType.Boolean, Cardinality.One)
			const sk = aes256RandomKey()
			let value = "0"
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sk, null, "")
			let encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value)))
			o.check(await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, "")).equals(false)
			value = "1"
			encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value)))
			o.check(await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, "")).equals(true)
			value = "32498"
			encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value)))
			o.check(await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, "")).equals(true)
		})
		o.test("decrypt date value", async () => {
			const valueType = createEncryptedValueType(ValueType.Date, Cardinality.One)
			const sk = aes256RandomKey()
			const value = new Date().getTime().toString()
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sk, null, "")
			const encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, stringToUtf8Uint8Array(value)))
			o.check(await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, "")).deepEquals(new Date(parseInt(value)))
		})
		o.test("decrypt bytes value", async () => {
			const valueType = createEncryptedValueType(ValueType.Bytes, Cardinality.One)
			const sk = aes256RandomKey()
			const value = random.generateRandomData(5)
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sk, null, "")
			const encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, value))
			const decryptedValue = await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, "")
			o.check(decryptedValue instanceof Uint8Array).equals(true)
			o.check(Array.from(decryptedValue as Uint8Array)).deepEquals(Array.from(value))
		})
		o.test("decrypt compressedString", async () => {
			const valueType = createEncryptedValueType(ValueType.CompressedString, Cardinality.One)
			const sk = aes256RandomKey()
			const value = base64ToUint8Array("QHRlc3Q=")
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sk, null, "")
			const encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, value))
			const decryptedValue = await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, "")
			o.check(typeof decryptedValue === "string").equals(true)
			o.check(decryptedValue).equals("test")
		})
		o.test("decrypt compressedString w resize", async () => {
			const valueType = createEncryptedValueType(ValueType.CompressedString, Cardinality.One)
			const sk = aes256RandomKey()
			const value = base64ToUint8Array("X3RleHQgBQD//1FQdGV4dCA=")
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sk, null, "")
			const encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, value))
			const decryptedValue = await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, "")
			o.check(typeof decryptedValue === "string").equals(true)
			o.check(decryptedValue).equals(
				"text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text ",
			)
		})
		o.test("decrypt empty compressedString", async () => {
			const valueType = createEncryptedValueType(ValueType.CompressedString, Cardinality.One)
			const sk = aes256RandomKey()
			const encryptedValue = uint8ArrayToBase64(aesEncrypt(sk, new Uint8Array([])))
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sk, null, "")
			const decryptedValue = await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, "")
			o.check(typeof decryptedValue === "string").equals(true)
			o.check(decryptedValue).equals("")
		})
		o.test("do not decrypt null values", async () => {
			const sk = aes256RandomKey()
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sk, null, "")
			o.check(
				await cryptoMapper.decryptValue(createEncryptedValueType(ValueType.String, Cardinality.ZeroOrOne), null, instanceDecryptor, null, ""),
			).equals(null)
			o.check(await cryptoMapper.decryptValue(createEncryptedValueType(ValueType.Date, Cardinality.ZeroOrOne), null, instanceDecryptor, null, "")).equals(
				null,
			)
			o.check(
				await cryptoMapper.decryptValue(createEncryptedValueType(ValueType.Bytes, Cardinality.ZeroOrOne), null, instanceDecryptor, null, ""),
			).equals(null)
			o.check(
				await cryptoMapper.decryptValue(createEncryptedValueType(ValueType.Boolean, Cardinality.ZeroOrOne), null, instanceDecryptor, null, ""),
			).equals(null)
			o.check(
				await cryptoMapper.decryptValue(createEncryptedValueType(ValueType.Number, Cardinality.ZeroOrOne), null, instanceDecryptor, null, ""),
			).equals(null)
		})
		o.test("do not decrypt empty values with Cardinality.ZeroOrOne", async () => {
			const sk = aes256RandomKey()
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sk, null, "")
			o.check(await cryptoMapper.decryptValue(createEncryptedValueType(ValueType.String, Cardinality.ZeroOrOne), "", instanceDecryptor, null, "")).equals(
				null,
			)
			o.check(await cryptoMapper.decryptValue(createEncryptedValueType(ValueType.Date, Cardinality.ZeroOrOne), "", instanceDecryptor, null, "")).equals(
				null,
			)
			o.check(await cryptoMapper.decryptValue(createEncryptedValueType(ValueType.Bytes, Cardinality.ZeroOrOne), "", instanceDecryptor, null, "")).equals(
				null,
			)
			o.check(
				await cryptoMapper.decryptValue(createEncryptedValueType(ValueType.Boolean, Cardinality.ZeroOrOne), "", instanceDecryptor, null, ""),
			).equals(null)
			o.check(await cryptoMapper.decryptValue(createEncryptedValueType(ValueType.Number, Cardinality.ZeroOrOne), "", instanceDecryptor, null, "")).equals(
				null,
			)
		})
	})
	o.spec("encryptValue", () => {
		o.test("encrypt string / number value", async () => {
			const valueType = createEncryptedValueType(ValueType.String, Cardinality.One)
			const sk = aes256RandomKey()
			const value = "this is a string value"
			const encryptedValue = neverNull(encryptValue(valueType, value, sk))
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sk, null, "")
			o.check(await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, "")).equals(value)
		})
		o.test("encrypt boolean value", async () => {
			const valueType = createEncryptedValueType(ValueType.Boolean, Cardinality.One)
			const sk = aes256RandomKey()
			let value = false
			let encryptedValue = neverNull(encryptValue(valueType, value, sk))
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sk, null, "")
			o.check(await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, "")).equals(false)
			value = true
			encryptedValue = neverNull(encryptValue(valueType, value, sk))
			o.check(await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, "")).equals(true)
		})
		o.test("encrypt date value", async () => {
			const valueType = createEncryptedValueType(ValueType.Date, Cardinality.One)
			const sk = aes256RandomKey()
			const value = new Date()
			const encryptedValue = neverNull(encryptValue(valueType, value, sk))
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sk, null, "")
			o.check(await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, "")).deepEquals(value)
		})
		o.test("encrypt bytes value", async () => {
			const valueType = createEncryptedValueType(ValueType.Bytes, Cardinality.One)
			const sk = aes256RandomKey()
			const value = random.generateRandomData(5)
			const encryptedValue = neverNull(encryptValue(valueType, value, sk))
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(sk, null, "")
			const decryptedValue = await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, "")
			o.check(Array.from(decryptedValue as Uint8Array)).deepEquals(Array.from(value))
		})
		o.test("do not encrypt null values", () => {
			const sk = aes256RandomKey()
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
		const decryptedInstance = await cryptoMapper.decryptParsedInstance(testTypeModel as ServerTypeModel, encryptedInstance, sk, null, "")

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
		const instance = await cryptoMapper.decryptParsedInstance(testTypeModel as ServerTypeModel, encryptedInstance, null, null, "")
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

		const decryptedInstance = await cryptoMapper.decryptParsedInstance(testTypeModel as ServerTypeModel, encryptedInstance, sk, null, "")

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

		const instanceWithErrors = await cryptoMapper.decryptParsedInstance(testTypeModel as ServerTypeModel, encryptedInstance, sk, null, "")
		console.log(instanceWithErrors._errors?.[1])
		o.check(typeof instanceWithErrors._errors?.[1]).equals("string")
	})

	o.spec("decryptValue", () => {
		let valueDecryptor: ValueDecryptor
		let instanceDecryptor: InstanceDecryptor
		let valueType: ModelValue & { encrypted: true }
		let encryptedValue: string

		o.before(() => {
			valueDecryptor = object()
			when(valueDecryptor.getValue(matchers.anything())).thenReturn(new Uint8Array())
			instanceDecryptor = object()
			valueType = createEncryptedValueType(ValueType.String, Cardinality.One)
			const nonEmptyNumberArray = [0]
			const ciphertext = Uint8Array.from(nonEmptyNumberArray)
			encryptedValue = uint8ArrayToBase64(ciphertext)
		})

		o.test("value decryption requires a session key and there is a session key", async () => {
			replace(valueDecryptor, "requiredGroupKeyVersion", "none")
			when(instanceDecryptor.getValueDecryptor(matchers.anything(), matchers.anything())).thenReturn(valueDecryptor)

			await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, "")
			verify(valueDecryptor.getValue(null))
		})

		o.test("value decryption requires a session key but there is no session key", async () => {
			when(instanceDecryptor.getValueDecryptor(matchers.anything(), matchers.anything())).thenReturn(MissingSessionKey)

			await assertThrows(SessionKeyNotFoundError, () => cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, null, ""))
		})

		o.test("value decryption requires a group key and the group ID is present", async () => {
			replace(valueDecryptor, "requiredGroupKeyVersion", 0)
			when(instanceDecryptor.getValueDecryptor(matchers.anything(), matchers.anything())).thenReturn(valueDecryptor)
			const groupId = "groupId"
			const aes256Key = aes256RandomKey()
			when(keyLoader.loadSymGroupKey(groupId, matchers.anything())).thenReturn(Promise.resolve(aes256Key))

			await cryptoMapper.decryptValue(valueType, encryptedValue, instanceDecryptor, groupId, "")
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
			replace(valueDecryptor, "requiredGroupKeyVersion", "none")
			let instanceDecryptor: InstanceDecryptor = object()
			when(instanceDecryptor.getValueDecryptor(matchers.anything(), matchers.anything())).thenReturn(valueDecryptor)
			const symmetricCipherFacade: SymmetricCipherFacade = object()
			when(symmetricCipherFacade.getInstanceDecryptor(matchers.anything(), matchers.anything(), matchers.anything())).thenReturn(instanceDecryptor)
			replace(cryptoMapper, "symmetricCipherFacade", symmetricCipherFacade)
			const sessionKey = aes256RandomKey()
			const encryptedInstance: ServerModelEncryptedParsedInstance = {
				3: [{ 6: "someCustomId", 9: [{ 17: uint8ArrayToBase64(Uint8Array.of(42)), 11: "anotherCustomId" }], 10: [] }],
			} as any as ServerModelEncryptedParsedInstance
			try {
				await cryptoMapper.decryptParsedInstance(testTypeModel as ServerTypeModel, encryptedInstance, sessionKey, null, "")
			} catch (_) {
				/* empty */
			}
			verify(instanceDecryptor.getValueDecryptor(matchers.anything(), "3/someCustomId/9/anotherCustomId/17"))
		})
	})
})
