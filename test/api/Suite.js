import "./crypto/RandomizerTest.js"
import "./common/EncodingTest"
import "./common/ArrayUtilsTest"
import "./common/MapUtilsTest"
import "./common/UtilsTest"
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
import "./worker/EventBusClientTest"
import "./worker/search/TokenizerTest"
import "./worker/search/IndexerTest"
import "./worker/search/IndexerCoreTest"
import "./worker/search/ContactIndexerTest"
import "./worker/search/GroupInfoIndexerTest"
import "./worker/search/MailIndexerTest"
import "./worker/search/IndexUtilsTest"
import "./worker/search/SearchFacadeTest"
import "./worker/search/SuggestionFacadeTest"
import "./common/SwTest"
import "./worker/search/EventQueueTest"
import "./common/PromiseUtilTest"
import o from "ospec/ospec.js"
import {random} from "../../src/api/worker/crypto/Randomizer"
import {EntropySrc} from "../../src/api/common/TutanotaConstants"
import "./crypto/RsaTest.js"

const disabledTests = ["./common/IntegrationTest", "./common/WorkerTest"]
console.log("!!! Some tests are disabled because they need a server instance, see Suite.js", disabledTests)

// setup the Entropy for all testcases
random.addEntropy([{data: 36, entropy: 256, source: EntropySrc.key}])

o.run()
