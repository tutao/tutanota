import o from "ospec/ospec.js"
import {TotpVerifier} from "../../../src/api/worker/crypto/TotpVerifier"
import {stringToUtf8Uint8Array} from "../../../src/api/common/utils/Encoding"
import {bitArrayToUint8Array} from "../../../src/api/worker/crypto/CryptoUtils"
import sjcl from "../../../src/api/worker/crypto/lib/crypto-sjcl-1.0.7"

o.spec("TotpVerifier", function () {

	const totp = new TotpVerifier(8)
	const base32 = sjcl.codec.base32

	o("readableKey", function () {
		let secret = new Uint8Array([99, 98, 3, 5, 7, 89, 4, 7, 9, 5, 22, 55, 1, 4, 88, 127])
		let key = totp.readableKey(secret)
		o("mnra gbih leca ocif cy3q cbcy p4").equals(key)
		o(Array.from(secret)).deepEquals(Array.from(bitArrayToUint8Array(base32.toBits(key.replace(/ /g, "")))))
	})

	o("rfcTests", function () {
		let key = stringToUtf8Uint8Array("12345678901234567890")
		o(94287082).equals(totp.generateTotp(parseInt("0000000000000001", 16), key))
		o(7081804).equals(totp.generateTotp(parseInt("00000000023523EC", 16), key))
		o(14050471).equals(totp.generateTotp(parseInt("00000000023523ED", 16), key))
		o(89005924).equals(totp.generateTotp(parseInt("000000000273EF07", 16), key))
		o(69279037).equals(totp.generateTotp(parseInt("0000000003F940AA", 16), key))
		o(65353130).equals(totp.generateTotp(parseInt("0000000027BC86AA", 16), key))
	})
})
