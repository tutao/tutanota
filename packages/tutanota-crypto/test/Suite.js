import o from "ospec"


import "./AesTest"
import "./BcryptTest"
import "./CryptoUtilsTest"
import "./KeyEncryptionTest"
import "./MurmurHashTest"
import "./RandomizerTest"
import "./RsaTest"
import "./Sha1Test"
import "./Sha256Test"
import "./TotpVerifierTest"
import {bootstrapTests} from "./bootstrap"


(async function () {

	await bootstrapTests()
	await o.run()
})()
