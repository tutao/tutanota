import o from "@tutao/otest"
import { base64ToUint8Array } from "@tutao/tutanota-utils"
import { aes256DecryptWithRecoveryKey, decryptKey, decryptRsaKey, encryptKey, encryptRsaKey } from "../lib/encryption/KeyEncryption.js"
import { hexToRsaPrivateKey } from "../lib/encryption/Rsa.js"
import { bitArrayToUint8Array, fixedIv, uint8ArrayToBitArray } from "../lib/misc/Utils.js"
import { _aes128RandomKey, aes256RandomKey } from "../lib/encryption/Aes.js"
import { aes256EncryptLegacy } from "./AesTest.js"

o.spec("key encryption", function () {
	const rsaPrivateHexKey =
		"02008e8bf43e2990a46042da8168aebec699d62e1e1fd068c5582fd1d5433cee8c8b918799e8ee1a22dd9d6e21dd959d7faed8034663225848c21b88c2733c73788875639425a87d54882285e598bf7e8c83861e8b77ab3cf62c53d35e143cee9bb8b3f36850aebd1548c1881dc7485bb51aa13c5a0391b88a8d7afce88ecd4a7e231ca7cfd063216d1d573ad769a6bb557c251ad34beb393a8fff4a886715315ba9eac0bc31541999b92fcb33d15efd2bd50bf77637d3fc5ba1c21082f67281957832ac832fbad6c383779341555993bd945659d7797b9c993396915e6decee9da2d5e060c27c3b5a9bc355ef4a38088af53e5f795ccc837f45d0583052547a736f02002a7622214a3c5dda96cf83f0ececc3381c06ccce69446c54a299fccef49d929c1893ae1326a9fe6cc9727f00048b4ff7833d26806d40a31bbf1bf3e063c779c61c41b765a854fd1338456e691bd1d48571343413479cf72fa920b34b9002fbbbff4ea86a3042fece17683686a055411357a824a01f8e3b277dd54c690d59fd4c8258009707d917ce43d4a337dc58bb55394c4f87b902e7f78fa0abe35e35444bda46bfbc38cf87c60fbe5c4beff49f8e6ddbf50d6caafeb92a6ccef75474879bdb82c9c9c5c35611207dbdb7601c87b254927f4d9fd25ba7694987b5ca70c8184058a91e86cb974a2b7694d6bb08a349b953e4c9a017d9eecada49eb2981dfe10100c7905e44c348447551bea10787da3aa869bbe45f10cff87688e2696474bd18405432f4846dcee886d2a967a61c1adb9a9bc08d75cee678053bf41262f0d9882c230bd5289518569714b961cec3072ed2900f52c9cdc802ee4e63781a3c4acaee4347bd9ab701399a0b96cdf22a75501f7f232069e7f00f5649be5ac3d73edd970100b6dbc3e909e1b69ab3f5dd6a55d7cc68d2b803d3da16941410ab7a5b963e5c50316a52380d4b571633d870ca746b4d6f36e0a9d90cf96a2ddb9c61d5bc9dbe74473f0be99f3642100c1b8ad9d592c6a28fa6570ccbb3f7bb86be8056f76473b978a55d458343dba3d0dcaf152d225f20ccd384706dda9dd2fb0f5f6976e603e901002fd80cc1af8fc3d9dc9f373bf6f5fada257f46610446d7ea9326b4ddc09f1511571e6040df929b6cb754a5e4cd18234e0dc93c20e2599eaca29301557728afdce50a1130898e2c344c63a56f4c928c472f027d76a43f2f74b2966654e3df8a8754d9fe3af964f1ca5cbceae3040adc0ab1105ad5092624872b66d79bdc1ed6410100295bc590e4ea4769f04030e747293b138e6d8e781140c01755b9e33fe9d88afa9c62a6dc04adc0b1c5e23388a71249fe589431f664c7d8eb2c5bcf890f53426b7c5dd72ced14d1965d96b12e19ef4bbc22ef858ae05c01314a05b673751b244d93eb1b1088e3053fa512f50abe1da314811f6a3a1faeadb9b58d419052132e59010032611a3359d91ce3567675726e48aca0601def22111f73a9fea5faeb9a95ec37754d2e52d7ae9444765c39c66264c02b38d096df1cebe6ea9951676663301e577fa5e3aec29a660e0fff36389671f47573d2259396874c33069ddb25dd5b03dcbf803272e68713c320ef7db05765f1088473c9788642e4b80a8eb40968fc0d7c"
	const rsaPublicHexKey =
		"02008e8bf43e2990a46042da8168aebec699d62e1e1fd068c5582fd1d5433cee8c8b918799e8ee1a22dd9d6e21dd959d7faed8034663225848c21b88c2733c73788875639425a87d54882285e598bf7e8c83861e8b77ab3cf62c53d35e143cee9bb8b3f36850aebd1548c1881dc7485bb51aa13c5a0391b88a8d7afce88ecd4a7e231ca7cfd063216d1d573ad769a6bb557c251ad34beb393a8fff4a886715315ba9eac0bc31541999b92fcb33d15efd2bd50bf77637d3fc5ba1c21082f67281957832ac832fbad6c383779341555993bd945659d7797b9c993396915e6decee9da2d5e060c27c3b5a9bc355ef4a38088af53e5f795ccc837f45d0583052547a736f"

	o("encrypt / decrypt aes128 key with aes128", function () {
		let gk = [3957386659, 354339016, 3786337319, 3366334248]
		let sk = [3229306880, 2716953871, 4072167920, 3901332676]
		let encryptedKey = encryptKey(gk, sk)
		o(Array.from(encryptedKey)).deepEquals(Array.from(base64ToUint8Array("O3cyw7uo5DMm655aQiw0Xw==")))
		o(decryptKey(gk, encryptedKey)).deepEquals(sk)
	})
	o("encrypt / decrypt private rsa key with aes128", function () {
		let gk = [3957386659, 354339016, 3786337319, 3366334248]
		let privateKey = hexToRsaPrivateKey(rsaPrivateHexKey)
		let iv = base64ToUint8Array("OhpFcbl6oPjsn3WwhYFnOg==")
		var encryptedPrivateKey = encryptRsaKey(gk, privateKey, iv)
		o(encryptedPrivateKey.length % 2).equals(1) // make sure a mac is present
		o(decryptRsaKey(gk, encryptedPrivateKey)).deepEquals(privateKey)
	})

	o("encrypt / decrypt private rsa key with aes256", function () {
		let gk = aes256RandomKey()
		let privateKey = hexToRsaPrivateKey(rsaPrivateHexKey)
		let iv = base64ToUint8Array("OhpFcbl6oPjsn3WwhYFnOg==")
		var encryptedPrivateKey = encryptRsaKey(gk, privateKey, iv)
		o(decryptRsaKey(gk, encryptedPrivateKey)).deepEquals(privateKey)
	})

	o("encrypt / decrypt aes256 key with aes256", function () {
		const key = aes256RandomKey()
		const encryptionKey = aes256RandomKey()

		const encryptedKey = encryptKey(encryptionKey, key)
		const decryptedKey = decryptKey(encryptionKey, encryptedKey)

		o(uint8ArrayToBitArray(encryptedKey)).notDeepEquals(key)("It isn't somehow a no-op at least")
		o(key).deepEquals(decryptedKey)("The round trip works")
	})

	o("encrypt / decrypt legacy recovery code with fixed iv aes256", function () {
		const key = _aes128RandomKey()
		const encryptionKey = aes256RandomKey()

		const encryptedKey = aes256EncryptLegacy(encryptionKey, bitArrayToUint8Array(key), fixedIv, false, false).slice(fixedIv.length)
		const decryptedKey = aes256DecryptWithRecoveryKey(encryptionKey, encryptedKey)

		o(key).deepEquals(decryptedKey)("decrypting sliced, fixed iv aes256 key")
	})

	o("encrypt / decrypt legacy recovery code without fixed iv aes256", function () {
		const key = _aes128RandomKey()
		const encryptionKey = aes256RandomKey()

		const encryptedKey = encryptKey(encryptionKey, key)
		const decryptedKey = aes256DecryptWithRecoveryKey(encryptionKey, encryptedKey)

		o(key).deepEquals(decryptedKey)("decrypting sliced, fixed iv aes256 key")
	})
})
