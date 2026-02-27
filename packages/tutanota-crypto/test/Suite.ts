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
import { bootstrapTests } from "./bootstrap.js"

await bootstrapTests()
const result = await o.run()
o.printReport(result)
o.terminateProcess(result)
