// @flow
import o from "ospec/ospec.js"
import {
	stringToUtf8Uint8Array,
	utf8Uint8ArrayToString,
	hexToUint8Array,
	uint8ArrayToHex,
	base64UrlToBase64,
	base64ToBase64Url,
	base64ToUint8Array,
	uint8ArrayToBase64,
	base64ToBase64Ext,
	hexToBase64,
	timestampToHexGeneratedId,
	uint8ArrayToArrayBuffer,
	base64ToHex,
	base64ExtToBase64,
	generatedIdToTimestamp,
	timestampToGeneratedId
} from "../../../src/api/common/utils/Encoding"
import {GENERATED_MIN_ID} from "../../../src/api/common/EntityFunctions"

o.spec("Encoding", function () {

	//TODO test missing encoder functions (only tested partially)

	o("StringToUint8ArrayAndBack", function () {
		o(utf8Uint8ArrayToString(stringToUtf8Uint8Array("halloTest € à 草"))).equals("halloTest € à 草")
		o(utf8Uint8ArrayToString(stringToUtf8Uint8Array(""))).equals("")
		o(utf8Uint8ArrayToString(stringToUtf8Uint8Array("1"))).equals("1")

		o(utf8Uint8ArrayToString(stringToUtf8Uint8Array("7=/=£±™⅛°™⅜£¤°±⅛™¤°°®↑°°ÆÐª±↑£°±↑Ω£®°±đ]łæ}đ2w034r70uf"))).equals("7=/=£±™⅛°™⅜£¤°±⅛™¤°°®↑°°ÆÐª±↑£°±↑Ω£®°±đ]łæ}đ2w034r70uf")

		o(Array.from(stringToUtf8Uint8Array("€"))).deepEquals([226, 130, 172])
	})


	/*
	 o("StringToUint8 performance comparison with sjcl", function () {
	 let s = ""
	 for (let i = 0; i < 5000; i++) {
	 s += i
	 new Uint8Array(sjcl.codec.arrayBuffer.fromBits(sjcl.codec.utf8String.toBits((s)), false))
	 //   stringToUtf8Uint8Array(s) // => faster by factor 4
	 }
	 o(true).equals(true)
	 })

	 oly("StringToUint8 performance comparison with sjcl", function () {
	 let a = new Uint8Array(5000)
	 for (let i = 0; i < 5000; i++) {
	 a[i] = i % 100
	 sjcl.codec.utf8String.fromBits(sjcl.codec.arrayBuffer.toBits(a.buffer))
	 //utf8Uint8ArrayToString(a) // => faster by factor 1/4
	 }
	 o(true).equals(true)
	 })
	 */

	o("HexToArrayBufferAndBack", function () {
		o(uint8ArrayToHex(hexToUint8Array("ba9012cb349de910924ed81239d18423"))).equals("ba9012cb349de910924ed81239d18423")
	})


	o("HexBase64Roundtrip ", function () {
		o(uint8ArrayToHex(hexToUint8Array("ba9012cb349de910924ed81239d18423"))).equals("ba9012cb349de910924ed81239d18423")
	})

	o("hexToBase64 roundtrip", function () {
		o(hexToBase64("54")).equals("VA==")
		o(base64ToHex("VA==")).equals("54")
	})

	o("Base64Base64UrlRoundtrip ", function () {
		let base64 = hexToBase64("ba9012cb349de910924ed81239d18423")
		o(base64UrlToBase64(base64ToBase64Url(base64))).equals(base64)
		base64 = hexToBase64("")
		o(base64UrlToBase64(base64ToBase64Url(base64))).equals(base64)
		base64 = hexToBase64("e4")
		o(base64UrlToBase64(base64ToBase64Url(base64))).equals(base64)
		base64 = hexToBase64("e445")
		o(base64UrlToBase64(base64ToBase64Url(base64))).equals(base64)
		base64 = hexToBase64("e43434")
		o(base64UrlToBase64(base64ToBase64Url(base64))).equals(base64)
		base64 = hexToBase64("e4323434")
		o(base64UrlToBase64(base64ToBase64Url(base64))).equals(base64)
	})

	o("uint8ArrayToBase64 ", function () {
		o(uint8ArrayToBase64(new Uint8Array(0))).equals("")
		o(Array.from(base64ToUint8Array(uint8ArrayToBase64(new Uint8Array([32]))))).deepEquals([32])
		o(Array.from(base64ToUint8Array(uint8ArrayToBase64(new Uint8Array([32, 65]))))).deepEquals([32, 65])
		o(Array.from(base64ToUint8Array(uint8ArrayToBase64(new Uint8Array([32, 65, 66]))))).deepEquals([32, 65, 66])
		o(Array.from(base64ToUint8Array(uint8ArrayToBase64(new Uint8Array([32, 65, 66, 67]))))).deepEquals([32, 65, 66, 67])
		o(Array.from(base64ToUint8Array(uint8ArrayToBase64(new Uint8Array([32, 65, 66, 67, 68]))))).deepEquals([32, 65, 66, 67, 68])
		o(Array.from(base64ToUint8Array(uint8ArrayToBase64(new Uint8Array([0, 255]))))).deepEquals([0, 255])


	})

	o("Base64ToBase64Ext ", function () {
		let hexPaddedGeneratedId = "4fc6fbb10000000000"
		o(base64ToBase64Ext(hexToBase64(hexPaddedGeneratedId))).equals("IwQvgF------")
		o(base64ExtToBase64("IwQvgF------")).equals(hexToBase64(hexPaddedGeneratedId))

		// roundtrips
		o(base64ExtToBase64(base64ToBase64Ext("AA=="))).equals("AA==")
		o(base64ExtToBase64(base64ToBase64Ext("qq8="))).equals("qq8=")
		o(base64ExtToBase64(base64ToBase64Ext("qqqv"))).equals("qqqv")
	})

	o("TimestampToHexGeneratedId ", function () {
		let timestamp = 1370563200000
		o(timestampToHexGeneratedId(timestamp)).equals("4fc6fbb10000000000")
	})

	o("generatedIdToTimestamp ", function () {
		let maxTimestamp = (Math.pow(2, 42) - 1)

		o(generatedIdToTimestamp(GENERATED_MIN_ID)).equals(0)
		o(generatedIdToTimestamp(timestampToGeneratedId(0))).equals(0)
		o(generatedIdToTimestamp("zzzzzzzzzzzz")).equals(maxTimestamp)
		o(generatedIdToTimestamp("IwQvgF------")).equals(1370563200000)
	})

	o("Uint8ArrayToBase64 ", function () {
		o(uint8ArrayToBase64(stringToUtf8Uint8Array("abc#"))).equals("YWJjIw==")
	})

	o("uint8Array to ArrayBuffer", function () {
		let array = new Uint8Array([1, 2, 3, 4, 5])
		o(Array.from(array.subarray(2))).deepEquals([3, 4, 5])
		o(Array.from(new Uint8Array(uint8ArrayToArrayBuffer(array.subarray(2))))).deepEquals([3, 4, 5])
	})


})
