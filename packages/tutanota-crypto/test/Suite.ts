import o from "ospec"
import "./AesTest.js"
import "./BcryptTest.js"
import "./CryptoUtilsTest.js"
import "./KeyEncryptionTest.js"
import "./MurmurHashTest.js"
import "./RandomizerTest.js"
import "./RsaTest.js"
import "./Sha1Test.js"
import "./Sha256Test.js"
import "./TotpVerifierTest.js"
import { bootstrapTests } from "./bootstrap.js"
;(async function () {
	await bootstrapTests()
	await o.run()
})()
