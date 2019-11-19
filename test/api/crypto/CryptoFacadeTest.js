//@flow
import o from "ospec/ospec.js"
import {aes128Decrypt, aes128Encrypt, aes128RandomKey, ENABLE_MAC, IV_BYTE_LENGTH} from "../../../src/api/worker/crypto/Aes"
import {random} from "../../../src/api/worker/crypto/Randomizer"
import {
	base64ToUint8Array,
	hexToUint8Array,
	stringToUtf8Uint8Array,
	uint8ArrayToBase64,
	utf8Uint8ArrayToString
} from "../../../src/api/common/utils/Encoding"
import {
	decryptAndMapToInstance,
	decryptKey,
	decryptRsaKey,
	decryptValue,
	encryptAndMapToLiteral,
	encryptKey,
	encryptRsaKey,
	encryptValue,
	resolveSessionKey
} from "../../../src/api/worker/crypto/CryptoFacade"
import {ProgrammingError} from "../../../src/api/common/error/ProgrammingError"
import {Cardinality, ValueType} from "../../../src/api/common/EntityConstants"
import {BucketPermissionType, PermissionType} from "../../../src/api/common/TutanotaConstants"
import {hexToPrivateKey, hexToPublicKey, rsaEncrypt} from "../../../src/api/worker/crypto/Rsa"
import * as Mail from "../../../src/api/entities/tutanota/Mail"
import {isSameTypeRef} from "../../../src/api/common/EntityFunctions"
import * as Contact from "../../../src/api/entities/tutanota/Contact"
import * as UserIdReturn from "../../../src/api/entities/sys/UserIdReturn"
import {createUserIdReturn} from "../../../src/api/entities/sys/UserIdReturn"
import {createPermission} from "../../../src/api/entities/sys/Permission"
import {createBucket} from "../../../src/api/entities/sys/Bucket"
import {createGroup} from "../../../src/api/entities/sys/Group"
import {createKeyPair} from "../../../src/api/entities/sys/KeyPair"
import {createBucketPermission} from "../../../src/api/entities/sys/BucketPermission"
import {createUser} from "../../../src/api/entities/sys/User"
import {createGroupMembership} from "../../../src/api/entities/sys/GroupMembership"
import {createContactAddress} from "../../../src/api/entities/tutanota/ContactAddress"
import {MailAddressTypeRef} from "../../../src/api/entities/tutanota/MailAddress"
import {mockAttribute, unmockAttribute} from "../TestUtils"
import {restClient} from "../../../src/api/worker/rest/RestClient"
import {bitArrayToUint8Array} from "../../../src/api/worker/crypto/CryptoUtils"
import {locator} from "../../../src/api/worker/WorkerLocator"
import {LoginFacade} from "../../../src/api/worker/facades/LoginFacade"
import murmurhash3_32_gc from "../../../src/api/worker/crypto/lib/murmurhash3_32"


o.spec("crypto facade", function () {
	let rsaPrivateHexKey = "02008e8bf43e2990a46042da8168aebec699d62e1e1fd068c5582fd1d5433cee8c8b918799e8ee1a22dd9d6e21dd959d7faed8034663225848c21b88c2733c73788875639425a87d54882285e598bf7e8c83861e8b77ab3cf62c53d35e143cee9bb8b3f36850aebd1548c1881dc7485bb51aa13c5a0391b88a8d7afce88ecd4a7e231ca7cfd063216d1d573ad769a6bb557c251ad34beb393a8fff4a886715315ba9eac0bc31541999b92fcb33d15efd2bd50bf77637d3fc5ba1c21082f67281957832ac832fbad6c383779341555993bd945659d7797b9c993396915e6decee9da2d5e060c27c3b5a9bc355ef4a38088af53e5f795ccc837f45d0583052547a736f02002a7622214a3c5dda96cf83f0ececc3381c06ccce69446c54a299fccef49d929c1893ae1326a9fe6cc9727f00048b4ff7833d26806d40a31bbf1bf3e063c779c61c41b765a854fd1338456e691bd1d48571343413479cf72fa920b34b9002fbbbff4ea86a3042fece17683686a055411357a824a01f8e3b277dd54c690d59fd4c8258009707d917ce43d4a337dc58bb55394c4f87b902e7f78fa0abe35e35444bda46bfbc38cf87c60fbe5c4beff49f8e6ddbf50d6caafeb92a6ccef75474879bdb82c9c9c5c35611207dbdb7601c87b254927f4d9fd25ba7694987b5ca70c8184058a91e86cb974a2b7694d6bb08a349b953e4c9a017d9eecada49eb2981dfe10100c7905e44c348447551bea10787da3aa869bbe45f10cff87688e2696474bd18405432f4846dcee886d2a967a61c1adb9a9bc08d75cee678053bf41262f0d9882c230bd5289518569714b961cec3072ed2900f52c9cdc802ee4e63781a3c4acaee4347bd9ab701399a0b96cdf22a75501f7f232069e7f00f5649be5ac3d73edd970100b6dbc3e909e1b69ab3f5dd6a55d7cc68d2b803d3da16941410ab7a5b963e5c50316a52380d4b571633d870ca746b4d6f36e0a9d90cf96a2ddb9c61d5bc9dbe74473f0be99f3642100c1b8ad9d592c6a28fa6570ccbb3f7bb86be8056f76473b978a55d458343dba3d0dcaf152d225f20ccd384706dda9dd2fb0f5f6976e603e901002fd80cc1af8fc3d9dc9f373bf6f5fada257f46610446d7ea9326b4ddc09f1511571e6040df929b6cb754a5e4cd18234e0dc93c20e2599eaca29301557728afdce50a1130898e2c344c63a56f4c928c472f027d76a43f2f74b2966654e3df8a8754d9fe3af964f1ca5cbceae3040adc0ab1105ad5092624872b66d79bdc1ed6410100295bc590e4ea4769f04030e747293b138e6d8e781140c01755b9e33fe9d88afa9c62a6dc04adc0b1c5e23388a71249fe589431f664c7d8eb2c5bcf890f53426b7c5dd72ced14d1965d96b12e19ef4bbc22ef858ae05c01314a05b673751b244d93eb1b1088e3053fa512f50abe1da314811f6a3a1faeadb9b58d419052132e59010032611a3359d91ce3567675726e48aca0601def22111f73a9fea5faeb9a95ec37754d2e52d7ae9444765c39c66264c02b38d096df1cebe6ea9951676663301e577fa5e3aec29a660e0fff36389671f47573d2259396874c33069ddb25dd5b03dcbf803272e68713c320ef7db05765f1088473c9788642e4b80a8eb40968fc0d7c"
	let rsaPublicHexKey = "02008e8bf43e2990a46042da8168aebec699d62e1e1fd068c5582fd1d5433cee8c8b918799e8ee1a22dd9d6e21dd959d7faed8034663225848c21b88c2733c73788875639425a87d54882285e598bf7e8c83861e8b77ab3cf62c53d35e143cee9bb8b3f36850aebd1548c1881dc7485bb51aa13c5a0391b88a8d7afce88ecd4a7e231ca7cfd063216d1d573ad769a6bb557c251ad34beb393a8fff4a886715315ba9eac0bc31541999b92fcb33d15efd2bd50bf77637d3fc5ba1c21082f67281957832ac832fbad6c383779341555993bd945659d7797b9c993396915e6decee9da2d5e060c27c3b5a9bc355ef4a38088af53e5f795ccc837f45d0583052547a736f"


	o.before(function () {
		locator.login = new LoginFacade((null: any))
	})

	o.afterEach(function () {
		locator.login.reset()
	})

	o("encrypt / decrypt key", function () {
		let gk = [3957386659, 354339016, 3786337319, 3366334248]
		let sk = [3229306880, 2716953871, 4072167920, 3901332676]
		let encryptedKey = encryptKey(gk, sk)
		o(Array.from(encryptedKey)).deepEquals(Array.from(base64ToUint8Array("O3cyw7uo5DMm655aQiw0Xw==")))
		o(decryptKey(gk, encryptedKey)).deepEquals(sk)
	})

	o("encrypt / decrypt private rsa key", function () {
		let gk = [3957386659, 354339016, 3786337319, 3366334248]
		let privateKey = hexToPrivateKey(rsaPrivateHexKey)
		let iv = base64ToUint8Array("OhpFcbl6oPjsn3WwhYFnOg==")
		var encryptedPrivateKey = encryptRsaKey(gk, privateKey, iv);
		o(uint8ArrayToBase64(encryptedPrivateKey))
			.equals("OhpFcbl6oPjsn3WwhYFnOiJRZKG9ZSsOzL4ZSzPikn2pc3eSH8rY1aex0iyN2qTl2lsPco8DEmlS7+KXN2gmJz6Lpnw4IFvmVUMF/O7xZFRYIe89qoyuKm2B6noORAXUSKxVYM0B0alT8fxcEbzAW9pv75hmNURkBd1GfYpN35i6bCxgp7l9HKSWpJAFyIYQSiO4aJw+tD87ifu4KBDL6vntBr0uG6yVgXVw+SKcPsaA+RZPXCFSs2QS/l3wZw0w6MIYD0ED+1Sf3/wWr+GZTw1wNowq0c9o5vWQdSG5gc0SYQLJl1G2JpBEIwYg2qu2jc4vJlt6vVOBpQ2D9b5w74EM8lbBfAbCPJmpCaIa1eKRNU+JVEzrAeg/X0/jdUfdxaBbujrhaY/tYJ4Y1l66+lyNgKpznNhFSMUrsLCSJTzXTMoFDPYKztnRYNZ2xxRs2EBbZpK8TSjgfHbfCKn14q81j84lz88yrMo6TkFgWTHV9ndQfg7sDNteYsNx6pa1SyOQQ6TD250oqRltDrCOGbMUVvNBTFWM9w6/ztFaFtMEQf0dptz5PCYFf2DnN7tiWgj4xEYjGnaRd0Y0nT0bfB7gQS2nenppx+nvUGcjND/BCWrVmQhdUQCFygV8QEb9mnEJ4ZoLXzsdlFtWixIhBQfM+RsTRLqn4Crx5kjfRW4pc7Wleo4FtfGkQmWfV4WjetoeWQlPudhL3JpFbSFRu5IKldRHwxqqZKsOaRiI+jh8lfHOfMDo1DwHLxMkI2SF81H6N4DYau0xO6TSa2yz6U0HCslM48kTkFuYTWhES5Hp9YzCohzapL1ekshna+ITNE/vDsEeB/E8AZGSihcbZffnzElrdpIR8adj+f4ZbPsEAb2DqfbYoEXnOExcXVbySDLK8jhaqy7EpkurGhc+tfYBLZ2wpXPUP3JKXfWQ/UcieJ7BPOescTXC4ll2tzdLF1qGXuqOsR7kDUyY7t3SOIojSThn2W9AAb8o/mOLGD1pCa1hIfwP9ee9EGdt56r26LV3s1dCbzHHBUswadbvik5eSvrbjTqLaYW0N7pRRzNaK4KyrLXJEuykuCShvsNefGo+RE93DTeblX+MbOktvONeYQonmOYrUvQQL8o6MGhuFiPu5+QQ8yAybxSMt0zja5KsgdMOn/qFHMwCTdNtwpFc7uULzsRcYgx/qWe4zK7wx+8xBjpLer1Hcylnf1K8pkloPRiADhzOfokN0rOhbD5nyRbklpnKNPO2t3mUBCKAIIETYAFhM9PxAajiBdM1gol9JKH0nCPhNx/uF42+yLGE+iSVodpqlg+jV9uXXYgFfcCGVmA3pVE5zkn2Qoso0Fc16MpQHIAxVenHFSKY7wsCuTUyiYZ9ZdFrp1Bltz23mCUwbRURMuntBHHQ2n9c28X1v1aMTnWSz6zH6IfxI8WVwff8YQQ2v0Wn/T/Xqc5lttQdTEfNZIH4RFZcHWqtHbeFRJXxRlrZpf9PU7SjJ86nbY58dBs2GD62hb/MV/hxw77iYAFuzvfTQoIUd9w8jY8L5UpZlhtDS2ERc0j+asEAVXKV+aSC+UbCApetaUA=")
		o(decryptRsaKey(gk, encryptedPrivateKey)).deepEquals(privateKey)
	})

	function createValueType(type, encrypted, cardinality): ModelValue {
		return {
			"name": "test",
			"id": 426,
			"since": 6,
			"type": type,
			"cardinality": cardinality,
			"final": true,
			"encrypted": encrypted
		}
	}

	o.spec("decrypt value", function () {

		o("decrypt string / number value without mac", () => {
			let sk = aes128RandomKey()
			let value = "this is a string value"
			let encryptedValue = uint8ArrayToBase64(aes128Encrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, false))
			o(decryptValue(createValueType(ValueType.String, true, Cardinality.One), encryptedValue, sk)).equals(value)

			value = "516546"
			encryptedValue = uint8ArrayToBase64(aes128Encrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, false))
			o(decryptValue(createValueType(ValueType.String, true, Cardinality.One), encryptedValue, sk)).equals(value)
		})

		o("decrypt string / number value with mac", () => {
			let sk = aes128RandomKey()
			let value = "this is a string value"
			let encryptedValue = uint8ArrayToBase64(aes128Encrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue(createValueType(ValueType.String, true, Cardinality.One), encryptedValue, sk)).equals(value)

			value = "516546"
			encryptedValue = uint8ArrayToBase64(aes128Encrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue(createValueType(ValueType.String, true, Cardinality.One), encryptedValue, sk)).equals(value)
		})

		o("decrypt boolean value without mac", () => {
			let valueType: ModelValue = createValueType(ValueType.Boolean, true, Cardinality.One)
			let sk = aes128RandomKey()
			let value = "0"
			let encryptedValue = uint8ArrayToBase64(aes128Encrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, false))
			o(decryptValue(valueType, encryptedValue, sk)).equals(false)

			value = "1"
			encryptedValue = uint8ArrayToBase64(aes128Encrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, false))
			o(decryptValue(valueType, encryptedValue, sk)).equals(true)

			value = "32498"
			encryptedValue = uint8ArrayToBase64(aes128Encrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, false))
			o(decryptValue(valueType, encryptedValue, sk)).equals(true)
		})

		o("decrypt boolean value with mac", () => {
			let valueType: ModelValue = createValueType(ValueType.Boolean, true, Cardinality.One)
			let sk = aes128RandomKey()
			let value = "0"
			let encryptedValue = uint8ArrayToBase64(aes128Encrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue(valueType, encryptedValue, sk)).equals(false)

			value = "1"
			encryptedValue = uint8ArrayToBase64(aes128Encrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue(valueType, encryptedValue, sk)).equals(true)

			value = "32498"
			encryptedValue = uint8ArrayToBase64(aes128Encrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue(valueType, encryptedValue, sk)).equals(true)
		})

		o("decrypt date value without mac", () => {
			let valueType: ModelValue = createValueType(ValueType.Date, true, Cardinality.One)
			let sk = aes128RandomKey()
			let value = new Date().getTime().toString()
			let encryptedValue = uint8ArrayToBase64(aes128Encrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, false))
			o(decryptValue(valueType, encryptedValue, sk)).deepEquals(new Date(parseInt(value)))
		})

		o("decrypt date value with mac", () => {
			let valueType: ModelValue = createValueType(ValueType.Date, true, Cardinality.One)
			let sk = aes128RandomKey()
			let value = new Date().getTime().toString()
			let encryptedValue = uint8ArrayToBase64(aes128Encrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			o(decryptValue(valueType, encryptedValue, sk)).deepEquals(new Date(parseInt(value)))
		})

		o("decrypt bytes value without mac", () => {
			let valueType: ModelValue = createValueType(ValueType.Bytes, true, Cardinality.One)
			let sk = aes128RandomKey()
			let value = random.generateRandomData(5)
			let encryptedValue = uint8ArrayToBase64(aes128Encrypt(sk, value, random.generateRandomData(IV_BYTE_LENGTH), true, false))
			let decryptedValue = decryptValue(valueType, encryptedValue, sk)
			o(decryptedValue instanceof Uint8Array).equals(true)
			o(Array.from(decryptedValue)).deepEquals(Array.from(value))
		})

		o("decrypt bytes value with mac", () => {
			let valueType: ModelValue = createValueType(ValueType.Bytes, true, Cardinality.One)
			let sk = aes128RandomKey()
			let value = random.generateRandomData(5)
			let encryptedValue = uint8ArrayToBase64(aes128Encrypt(sk, value, random.generateRandomData(IV_BYTE_LENGTH), true, true))
			let decryptedValue = decryptValue(valueType, encryptedValue, sk)
			o(decryptedValue instanceof Uint8Array).equals(true)
			o(Array.from(decryptedValue)).deepEquals(Array.from(value))
		})

		o("decrypt compressedString", () => {
			let valueType: ModelValue = createValueType(ValueType.CompressedString, true, Cardinality.One)
			let sk = aes128RandomKey()
			let value = base64ToUint8Array("QHRlc3Q=")
			let encryptedValue = uint8ArrayToBase64(aes128Encrypt(sk, value, random.generateRandomData(IV_BYTE_LENGTH), true, true))
			let decryptedValue = decryptValue(valueType, encryptedValue, sk)
			o(typeof decryptedValue === "string").equals(true)
			o(decryptedValue).equals("test")
		})

		o("decrypt compressedString w resize", function () {
			let valueType: ModelValue = createValueType(ValueType.CompressedString, true, Cardinality.One)
			let sk = aes128RandomKey()
			let value = base64ToUint8Array("X3RleHQgBQD//1FQdGV4dCA=")
			let encryptedValue = uint8ArrayToBase64(aes128Encrypt(sk, value, random.generateRandomData(IV_BYTE_LENGTH), true, true))
			let decryptedValue = decryptValue(valueType, encryptedValue, sk)
			o(typeof decryptedValue === "string").equals(true)
			o(decryptedValue)
				.equals("text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text text ")
		})

		o("decrypt empty compressedString", () => {
			let valueType: ModelValue = createValueType(ValueType.CompressedString, true, Cardinality.One)
			let sk = aes128RandomKey()
			let encryptedValue = uint8ArrayToBase64(aes128Encrypt(sk, new Uint8Array([]), random.generateRandomData(IV_BYTE_LENGTH), true, true))
			let decryptedValue = decryptValue(valueType, encryptedValue, sk)
			o(typeof decryptedValue === "string").equals(true)
			o(decryptedValue).equals("")
		})

		o("do not decrypt null values", () => {
			let sk = aes128RandomKey()

			o(decryptValue(createValueType(ValueType.String, true, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o(decryptValue(createValueType(ValueType.Date, true, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o(decryptValue(createValueType(ValueType.Bytes, true, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o(decryptValue(createValueType(ValueType.Boolean, true, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o(decryptValue(createValueType(ValueType.Number, true, Cardinality.ZeroOrOne), null, sk)).equals(null)
		})

		o("throw error on ONE null values (String)", testErrorOnNull(ValueType.String))
		o("throw error on ONE null values (Date)", testErrorOnNull(ValueType.Date))
		o("throw error on ONE null values (Bytes)", testErrorOnNull(ValueType.Bytes))
		o("throw error on ONE null values (Boolean)", testErrorOnNull(ValueType.Boolean))
		o("throw error on ONE null values (Number)", testErrorOnNull(ValueType.Number))

		function testErrorOnNull(type) {
			return (done) => {
				let sk = aes128RandomKey()
				try {
					o(decryptValue(createValueType(type, true, Cardinality.One), null, sk)).equals(null)
				} catch (e) {
					o(e instanceof ProgrammingError).equals(true)
					o(e.message).equals('Value test with cardinality ONE can not be null')
					done()
				}
			}
		}

		o("convert unencrypted Date to JS type", function () {
			let value = new Date().getTime().toString()
			o(decryptValue(createValueType(ValueType.Date, false, Cardinality.One), value, null)).deepEquals(new Date(parseInt(value)))
		})

		o("convert unencrypted Bytes to JS type", function () {
			let valueBytes = random.generateRandomData(15)
			let value = uint8ArrayToBase64(valueBytes)
			o(Array.from(decryptValue(createValueType(ValueType.Bytes, false, Cardinality.One), value, null)))
				.deepEquals(Array.from(valueBytes))
		})

		o("convert unencrypted Boolean to JS type", function () {
			let value = "0"
			o(decryptValue(createValueType(ValueType.Boolean, false, Cardinality.One), value, null)).equals(false)

			value = "1"
			o(decryptValue(createValueType(ValueType.Boolean, false, Cardinality.One), value, null)).equals(true)
		})

		o("convert unencrypted Number to JS type", function () {
			let value = ""
			o(decryptValue(createValueType(ValueType.Number, false, Cardinality.One), value, null)).equals("0")

			value = "0"
			o(decryptValue(createValueType(ValueType.Number, false, Cardinality.One), value, null)).equals("0")

			value = "1"
			o(decryptValue(createValueType(ValueType.Number, false, Cardinality.One), value, null)).equals("1")
		})

		o("convert unencrypted compressedString to JS type", function () {
			let value = ""
			o(decryptValue(createValueType(ValueType.CompressedString, false, Cardinality.One), value, null)).equals("")

			value = "QHRlc3Q="
			o(decryptValue(createValueType(ValueType.CompressedString, false, Cardinality.One), value, null)).equals("test")
		})
	})

	o.spec("encryptValue", function () {
		o("encrypt string / number value", () => {
			var valueType = createValueType(ValueType.String, true, Cardinality.One)
			let sk = aes128RandomKey()
			let value = "this is a string value"
			let encryptedValue = encryptValue(valueType, value, sk)
			let expected = uint8ArrayToBase64(aes128Encrypt(sk, stringToUtf8Uint8Array(value), base64ToUint8Array(encryptedValue)
				.slice(ENABLE_MAC ? 1 : 0, ENABLE_MAC ? 17 : 16), true, ENABLE_MAC))
			o(encryptedValue).deepEquals(expected)
			o(decryptValue(valueType, encryptedValue, sk)).equals(value)
		})

		o("encrypt boolean value", () => {
			let valueType: ModelValue = createValueType(ValueType.Boolean, true, Cardinality.One)
			let sk = aes128RandomKey()

			let value = false
			let encryptedValue = encryptValue(valueType, value, sk)
			let expected = uint8ArrayToBase64(aes128Encrypt(sk, stringToUtf8Uint8Array(value ? "1" : "0"), base64ToUint8Array(encryptedValue)
				.slice(ENABLE_MAC ? 1 : 0, ENABLE_MAC ? 17 : 16), true, ENABLE_MAC))
			o(encryptedValue).equals(expected)
			o(decryptValue(valueType, encryptedValue, sk)).equals(false)


			value = true
			encryptedValue = encryptValue(valueType, value, sk)
			expected = uint8ArrayToBase64(aes128Encrypt(sk, stringToUtf8Uint8Array(value ? "1" : "0"), base64ToUint8Array(encryptedValue)
				.slice(ENABLE_MAC ? 1 : 0, ENABLE_MAC ? 17 : 16), true, ENABLE_MAC))
			o(encryptedValue).equals(expected)
			o(decryptValue(valueType, encryptedValue, sk)).equals(true)
		})

		o("encrypt date value", () => {
			let valueType: ModelValue = createValueType(ValueType.Date, true, Cardinality.One)
			let sk = aes128RandomKey()
			let value = new Date()

			let encryptedValue = encryptValue(valueType, value, sk)
			let expected = uint8ArrayToBase64(aes128Encrypt(sk, stringToUtf8Uint8Array(value.getTime()
			                                                                                .toString()), base64ToUint8Array(encryptedValue)
				.slice(ENABLE_MAC ? 1 : 0, ENABLE_MAC ? 17 : 16), true, ENABLE_MAC))
			o(decryptValue(valueType, encryptedValue, sk)).deepEquals(value)
		})

		o("encrypt bytes value", () => {
			let valueType: ModelValue = createValueType(ValueType.Bytes, true, Cardinality.One)
			let sk = aes128RandomKey()
			let value = random.generateRandomData(5)

			let encryptedValue = encryptValue(valueType, value, sk)
			let expected = uint8ArrayToBase64(aes128Encrypt(sk, value, base64ToUint8Array(encryptedValue)
				.slice(ENABLE_MAC ? 1 : 0, ENABLE_MAC ? 17 : 16), true, ENABLE_MAC))
			o(encryptedValue).equals(expected)
			o(Array.from(decryptValue(valueType, encryptedValue, sk))).deepEquals(Array.from(value))
		})

		o("do not encrypt null values", () => {
			let sk = aes128RandomKey()

			o(encryptValue(createValueType(ValueType.String, true, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o(encryptValue(createValueType(ValueType.Date, true, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o(encryptValue(createValueType(ValueType.Bytes, true, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o(encryptValue(createValueType(ValueType.Boolean, true, Cardinality.ZeroOrOne), null, sk)).equals(null)
			o(encryptValue(createValueType(ValueType.Number, true, Cardinality.ZeroOrOne), null, sk)).equals(null)
		})

		o("accept null _id and _permissions value during encryption", () => {
			let vt = {
				"name": "_id",
				"id": 426,
				"since": 6,
				"type": ValueType.GeneratedId,
				"cardinality": Cardinality.One,
				"final": true,
				"encrypted": false
			}
			o(encryptValue(vt, null, null)).equals(null)
			vt.name = '_permissions'
			o(encryptValue(vt, null, null)).equals(null)
		})

		o("throw error on ONE null values (enc String)", testErrorOnNull(ValueType.String))
		o("throw error on ONE null values (enc Date)", testErrorOnNull(ValueType.Date))
		o("throw error on ONE null values (enc Bytes)", testErrorOnNull(ValueType.Bytes))
		o("throw error on ONE null values (enc Boolean)", testErrorOnNull(ValueType.Boolean))
		o("throw error on ONE null values (enc Number)", testErrorOnNull(ValueType.Number))

		function testErrorOnNull(type) {
			return (done) => {
				let sk = aes128RandomKey()
				try {
					o(encryptValue(createValueType(type, true, Cardinality.One), null, sk)).equals(null)
				} catch (e) {
					o(e instanceof ProgrammingError).equals(true)
					o(e.message).equals('Value test with cardinality ONE can not be null')
					done()
				}
			}
		}

		o("convert unencrypted Date to DB type", function () {
			let value = new Date()
			o(encryptValue(createValueType(ValueType.Date, false, Cardinality.One), value, null)).deepEquals(value.getTime().toString())
		})

		o("convert unencrypted Bytes to DB type", function () {
			let valueBytes = random.generateRandomData(15)
			o(encryptValue(createValueType(ValueType.Bytes, false, Cardinality.One), valueBytes, null))
				.deepEquals(uint8ArrayToBase64(valueBytes))
		})

		o("convert unencrypted Boolean to DB type", function () {
			let value = false
			o(encryptValue(createValueType(ValueType.Boolean, false, Cardinality.One), value, null)).equals("0")

			value = true
			o(encryptValue(createValueType(ValueType.Boolean, false, Cardinality.One), value, null)).equals("1")
		})

		o("convert unencrypted Number to DB type", function () {
			let value = "0"
			o(encryptValue(createValueType(ValueType.Number, false, Cardinality.One), value, null)).equals("0")

			value = "1"
			o(encryptValue(createValueType(ValueType.Number, false, Cardinality.One), value, null)).equals("1")
		})
	})

	function createMailLiteral(gk, sk, subject, confidential, senderName, recipientName) {
		let mail = {
			_format: "0",
			_area: "0",
			_owner: "ownerId",
			_ownerGroup: "ownerGroupId",
			_ownerEncSessionKey: encryptKey(gk, sk),
			_id: "mailId",
			_permissions: "permissionListId",
			receivedDate: new Date(1470039025474).getTime().toString(),
			sentDate: new Date(1470039021474).getTime().toString(),
			state: "",
			trashed: false,
			unread: true,
			subject: uint8ArrayToBase64(aes128Encrypt(sk, stringToUtf8Uint8Array(subject), random.generateRandomData(IV_BYTE_LENGTH), true, ENABLE_MAC)),
			replyType: "",
			confidential: uint8ArrayToBase64(aes128Encrypt(sk, stringToUtf8Uint8Array(confidential ? "1" : "0"), random.generateRandomData(IV_BYTE_LENGTH), true, ENABLE_MAC)),
			sender: {
				_id: "senderId",
				address: "hello@tutao.de",
				name: uint8ArrayToBase64(aes128Encrypt(sk, stringToUtf8Uint8Array(senderName), random.generateRandomData(IV_BYTE_LENGTH), true, ENABLE_MAC))
			},
			bccRecipients: [],
			ccRecipients: [],
			toRecipients: [
				{
					_id: "recipientId",
					address: "support@yahoo.com",
					name: uint8ArrayToBase64(aes128Encrypt(sk, stringToUtf8Uint8Array(recipientName), random.generateRandomData(IV_BYTE_LENGTH), true, ENABLE_MAC))
				}
			],
			replyTos: []
		}
		return mail;
	}

	o("decrypt instance", function (done, timeout) {
		timeout(1000)
		let subject = "this is our subject"
		let confidential = true
		let senderName = "TutanotaTeam"
		let recipientName = "Yahoo"

		let gk = aes128RandomKey()
		let sk = aes128RandomKey()
		let mail = createMailLiteral(gk, sk, subject, confidential, senderName, recipientName)

		decryptAndMapToInstance(Mail._TypeModel, mail, sk).then(decrypted => {
			o(isSameTypeRef(decrypted._type, Mail.MailTypeRef)).equals(true)
			o(decrypted.receivedDate.getTime()).equals(1470039025474)
			o(decrypted.sentDate.getTime()).equals(1470039021474)
			o(decrypted.confidential).equals(confidential)
			o(decrypted.subject).equals(subject)
			o(decrypted.replyType).equals("0")

			// aggregates
			o(isSameTypeRef(decrypted.sender._type, MailAddressTypeRef)).equals(true)
			o(decrypted.sender.name).equals(senderName)
			o(decrypted.sender.address).equals("hello@tutao.de")

			o(decrypted.toRecipients[0].name).equals(recipientName)
			o(decrypted.toRecipients[0].address).equals("support@yahoo.com")
			done()
		})
	})

	o("encrypt instance", function (done) {
		let sk = aes128RandomKey()

		let address = createContactAddress()
		address.type = "0"
		address.address = "Entenhausen"
		address.customTypeName = "0"

		let contact = Contact.createContact()
		contact._area = "0"
		contact._owner = "123"
		contact.title = "Dr."
		contact.firstName = "Max"
		contact.lastName = "Meier"
		contact.comment = "what?"
		contact.company = "WIW"
		contact.autoTransmitPassword = "stop bugging me!"
		contact.addresses = [address]

		encryptAndMapToLiteral(Contact._TypeModel, contact, sk).then(result => {
			o(result._format).equals("0")
			o(result._ownerGroup).equals(null)
			o(result._ownerEncSessionKey).equals(null)
			o(utf8Uint8ArrayToString(aes128Decrypt(sk, base64ToUint8Array(result.addresses[0].type)))).equals(contact.addresses[0].type)
			o(utf8Uint8ArrayToString(aes128Decrypt(sk, base64ToUint8Array(result.addresses[0].address))))
				.equals(contact.addresses[0].address)
			o(utf8Uint8ArrayToString(aes128Decrypt(sk, base64ToUint8Array(result.addresses[0].customTypeName))))
				.equals(contact.addresses[0].customTypeName)
			o(utf8Uint8ArrayToString(aes128Decrypt(sk, base64ToUint8Array(result.title)))).equals(contact.title)
			o(utf8Uint8ArrayToString(aes128Decrypt(sk, base64ToUint8Array(result.firstName)))).equals(contact.firstName)
			o(utf8Uint8ArrayToString(aes128Decrypt(sk, base64ToUint8Array(result.lastName)))).equals(contact.lastName)
			o(utf8Uint8ArrayToString(aes128Decrypt(sk, base64ToUint8Array(result.comment)))).equals(contact.comment)
			o(utf8Uint8ArrayToString(aes128Decrypt(sk, base64ToUint8Array(result.company)))).equals(contact.company)
			o(utf8Uint8ArrayToString(aes128Decrypt(sk, base64ToUint8Array(result.autoTransmitPassword))))
				.equals(contact.autoTransmitPassword)
			done()
		})
	})

	o("map unencrypted to instance", function (done) {
		let userIdLiteral = {"_format": "0", "userId": "KOBqO7a----0"}
		decryptAndMapToInstance(UserIdReturn._TypeModel, userIdLiteral).then(userIdReturn => {
			o(userIdReturn._format).equals("0")
			o(userIdReturn.userId).equals("KOBqO7a----0")
			done()
		})
	})

	o("map unencrypted to DB literal", function (done) {
		let userIdReturn = createUserIdReturn()
		userIdReturn._format = "0"
		userIdReturn.userId = "KOBqO7a----0"

		let userIdLiteral = {"_format": "0", "userId": "KOBqO7a----0"}
		encryptAndMapToLiteral(UserIdReturn._TypeModel, userIdReturn, null).then(result => {
			o(result).deepEquals(userIdLiteral)
			done()
		})
	})

	o("resolve session key: unencrypted instance", function (done) {
		let userIdLiteral = {"_format": "0", "userId": "KOBqO7a----0"}
		resolveSessionKey(UserIdReturn._TypeModel, userIdLiteral, ({}: any)).then(sessionKey => {
			o(sessionKey).equals(null)
			done()
		})
	})


	o("resolve session key: _ownerEncSessionKey instance", function (done) {
		let subject = "this is our subject"
		let confidential = true
		let senderName = "TutanotaTeam"
		let recipientName = "Yahoo"

		let gk = aes128RandomKey()
		let sk = aes128RandomKey()
		locator.login.groupKeys = {ownerGroupId: gk}
		locator.login._user = createUser()
		locator.login._user.userGroup = ({group: 'ownerGroupId'}: any)

		let mail = createMailLiteral(gk, sk, subject, confidential, senderName, recipientName)

		resolveSessionKey(Mail._TypeModel, mail, null).then(sessionKey => {
			o(sessionKey).deepEquals(sk)
		}).then(done)
	})

	o("resolve session key: public key decryption of session key", function (done) {
		let subject = "this is our subject"
		let confidential = true
		let senderName = "TutanotaTeam"
		let recipientName = "Yahoo"

		let gk = aes128RandomKey()
		let sk = aes128RandomKey()
		let bk = aes128RandomKey()


		let privateKey = hexToPrivateKey(rsaPrivateHexKey)
		let publicKey = hexToPublicKey(rsaPublicHexKey)

		let keyPair = createKeyPair()
		keyPair._id = "keyPairId"
		keyPair.symEncPrivKey = encryptRsaKey(gk, privateKey)
		keyPair.pubKey = hexToUint8Array(rsaPublicHexKey)

		let userGroup = createGroup()
		userGroup._id = "userGroupId"
		userGroup.keys = [keyPair]

		let mail = createMailLiteral(gk, sk, subject, confidential, senderName, recipientName)
		mail._ownerEncSessionKey = null
		let bucket = createBucket()
		bucket.bucketPermissions = "bucketPermissionListId"
		let permission = createPermission()
		permission.bucketEncSessionKey = encryptKey(bk, sk)
		permission._id = ["permissionListId", "permissionId"]
		permission.bucket = bucket
		permission.type = PermissionType.Public
		permission._ownerGroup = userGroup._id

		rsaEncrypt(publicKey, bitArrayToUint8Array(bk)).then(pubEncBucketKey => {
			let bucketPermission = createBucketPermission()
			bucketPermission.pubEncBucketKey = pubEncBucketKey
			bucketPermission.type = BucketPermissionType.Public
			bucketPermission._id = ["bucketPermissionListId", "bucketPermissionId"]
			bucketPermission._ownerGroup = userGroup._id
			bucketPermission.group = userGroup._id

			let mem = createGroupMembership()
			mem.group = userGroup._id

			locator.login._user = createUser()
			locator.login._user.userGroup = mem
			locator.login.groupKeys['userGroupId'] = gk

			let loaders = {
				loadBucketPermissions: function (listId) {
					o(listId).equals(bucketPermission._id[0])
					return Promise.resolve([bucketPermission])
				},
				loadPermissions: function (listId) {
					o(listId).equals(permission._id[0])
					return Promise.resolve([permission])
				},
				loadGroup: function (groupId) {
					o(groupId).equals(userGroup._id)
					return Promise.resolve(userGroup)
				}
			}

			// mock the invocation of UpdatePermissionKeyService
			let updateMock = mockAttribute(restClient, restClient.request, () => Promise.resolve())

			resolveSessionKey(Mail._TypeModel, mail, loaders).then(sessionKey => {
				o(sessionKey).deepEquals(sk)
				o((restClient.request: any).callCount).equals(1)
				done()
			}).finally(() => unmockAttribute(updateMock))
		})


	})

	o("decryption errors should be written to _errors field", function (done) {
		let subject = "this is our subject"
		let confidential = true
		let senderName = "TutanotaTeam"
		let recipientName = "Yahoo"

		let gk = aes128RandomKey()
		let sk = aes128RandomKey()
		let bk = aes128RandomKey()
		let mail = createMailLiteral(gk, sk, subject, confidential, senderName, recipientName)

		mail.subject = 'asdf'

		decryptAndMapToInstance(Mail._TypeModel, mail, sk).then(instance => {
			o(typeof instance._errors["subject"]).equals("string")
			done()
		})
	})

	o.only("32bitHash", function () {
		// o(murmurhash3_32_gc("hello")).equals(613153351)
		o(murmurhash3_32_gc("External images")).equals(4063203704)
	})

})
