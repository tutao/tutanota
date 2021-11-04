import o from "ospec"

import "./common/LoggerTest.js"
import "./crypto/RandomizerTest.js"
import "./common/BirthdayUtilsTest"
import "./common/EntityFunctionsTest"
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
import "./worker/search/SearchIndexEncodingTest"
import "./common/SwTest"
import "./worker/search/EventQueueTest"
import "./common/IndexerDebugLoggerTest"
import "./crypto/RsaTest.js"
import "./worker/facades/MailFacadeTest"
import "./worker/facades/CalendarFacadeTest"
import "./worker/SuspensionHandlerTest"
import "./worker/ConfigurationDbTest"
import "./worker/CompressionTest"
import "../api/common/PlainTextSearchTest"
import "../api/common/EntityUtilsTest"
import {random} from "../../src/api/worker/crypto/Randomizer"
import {EntropySrc} from "../../src/api/common/TutanotaConstants"
import {preTest, reportTest} from "./TestUtils"

(async function () {

	const {WorkerImpl} = await import("../../src/api/worker/WorkerImpl")
	// const workerImpl = new WorkerImpl(this, true, browserDataStub)
	globalThis.testWorker = WorkerImpl

	if (typeof process != "undefined") {
		if (process.argv.includes("-i")) {
			console.log("\nRunning with integration tests because was run with -i\n")
			await import("./common/WorkerTest")
			await import("./common/IntegrationTest")
		} else {
			console.log("\nRunning without integration tests because run without -i\n")
		}
	}

	// setup the Entropy for all testcases
	random.addEntropy([{data: 36, entropy: 256, source: EntropySrc.key}])
	preTest()

	await o.run(reportTest)
})()