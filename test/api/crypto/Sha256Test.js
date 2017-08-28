import o from "ospec/ospec.js"
import sjcl from "../../../src/api/worker/crypto/lib/crypto-sjcl-1.0.7"
import {hash} from "../../../src/api/worker/crypto/Sha256"
import {hexToUint8Array, stringToUtf8Uint8Array} from "../../../src/api/common/utils/Encoding"

o.spec("Sha256", function () {

	o("hash", function () {
		o(Array.from(hash(new Uint8Array(0)))).deepEquals(Array.from(hexToUint8Array("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")))
		o(Array.from(hash(stringToUtf8Uint8Array("The quick brown fox jumps over the lazy dog.")))).deepEquals(Array.from(hexToUint8Array("ef537f25c895bfa782526529a9b63d97aa631564d5d789c2b765448c8635fb6c")))
	})

	o("multiple updates equals concatenation", function () {
		let sjclHash = new sjcl.hash.sha256()
		sjclHash.update(sjcl.codec.arrayBuffer.toBits(new Uint8Array([3, 5, 7]).buffer))
		sjclHash.update(sjcl.codec.arrayBuffer.toBits(new Uint8Array([33, 55, 77, 8]).buffer))
		o(Array.from(hash(new Uint8Array([3, 5, 7, 33, 55, 77, 8])))).deepEquals(Array.from(new Uint8Array(sjcl.codec.arrayBuffer.fromBits(sjclHash.finalize(), false))))
	})

})
