import o from "@tutao/otest"
import "./AesTest.js"
import "./BcryptTest.js"
import "./Argon2idTest.js"
import "./SymmetricCipherUtilsTest.js"
import "./SymmetricKeyDeriverTest.js"
import "./SymmetricCipherFacadeTest.js"
import "./AesCbcFacadeTest.js"
import "./Ed25519Test.js"
import "./KeyEncryptionTest.js"
import "./MurmurHashTest.js"
import "./RandomizerTest.js"
import "./RsaTest.js"
import "./Sha1Test.js"
import "./Sha256Test.js"
import "./HkdfTest.js"
import "./TotpVerifierTest.js"
import "./X25519Test.js"
import "./KyberTest.js"
import "./HmacTest.js"
import "./Blake3Test.js"
import "./AeadFacadeTest.js"
import { bootstrapTests } from "./bootstrap.js"
import * as testDouble from "testdouble"

await bootstrapTests()

// testdouble complains about certain mocking related code smells, and also prints a warning whenever you replace a property on an object.
// it's very, very noisy, so we turn it off
testDouble.config({
	ignoreWarnings: true,
})

const result = await o.run()
o.printReport(result)
o.terminateProcess(result)
