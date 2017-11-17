import "./crypto/RandomizerTest.js"
import "./common/EncodingTest"
import "./common/ArrayUtilsTest"
import "./common/UtilsTest"
import "./common/WorkerTest"
import "./crypto/AesTest"
import "./crypto/BcryptTest"
import "./crypto/CryptoFacadeTest.js"
import "./crypto/CompatibilityTest"
import "./crypto/Sha256Test"
import "./crypto/Sha1Test"
import "./crypto/TotpVerifierTest"
import "./crypto/CryptoUtilsTest"
import "./error/RestErrorTest"
import "./error/TutanotaErrorTest"
import "./rest/RestClientTest"
import "./rest/EntityRestCacheTest"
import "./common/IntegrationTest"
import "./worker/EventBusClientTest"
import "./worker/TokenizerTest"
import "./worker/SearchFacadeTest"
import o from "ospec/ospec.js"
import {random} from "../../src/api/worker/crypto/Randomizer"
import {EntropySrc} from "../../src/api/common/TutanotaConstants"
import "./crypto/RsaTest.js"

// setup the Entropy for all testcases
random.addEntropy([{data: 36, entropy: 256, source: EntropySrc.key}])

o.run()


