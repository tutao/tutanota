import o from "ospec/ospec.js"
import {hash} from "../../../src/api/worker/crypto/Sha256"
import {hexToUint8Array, stringToUtf8Uint8Array} from "../../../src/api/common/utils/Encoding"
import {sha1hash} from "../../../src/api/worker/crypto/Sha1"

o.spec("Sha1", function () {

	o("hash", function () {
		o(Array.from(sha1hash(new Uint8Array(0)))).deepEquals(Array.from(hexToUint8Array("da39a3ee5e6b4b0d3255bfef95601890afd80709")))
		o(Array.from(sha1hash(stringToUtf8Uint8Array("The quick brown fox jumps over the lazy dog")))).deepEquals(Array.from(hexToUint8Array("2fd4e1c67a2d28fced849ee1bb76e7391b93eb12")))
	})
})
