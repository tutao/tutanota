import "./worker/search/IndexerTest"
import "./worker/search/IndexerCoreTest"
import "./worker/search/ContactIndexerTest"
import "./worker/search/GroupInfoIndexerTest"
import "./worker/search/MailIndexerTest"
import "./worker/search/IndexUtilsTest"
import o from "ospec/ospec.js"
import {random} from "../../src/api/worker/crypto/Randomizer"
import {EntropySrc} from "../../src/api/common/TutanotaConstants"
//import "./crypto/RsaTest.js"

// setup the Entropy for all testcases
random.addEntropy([{data: 36, entropy: 256, source: EntropySrc.key}])

o.run()



