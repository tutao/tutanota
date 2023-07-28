import o from "@tutao/otest"
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

await bootstrapTests()
const result = await o.run()
o.printReport(result)
o.terminateProcess(result)
