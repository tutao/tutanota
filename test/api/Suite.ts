import o from "ospec"

import "./common/LoggerTest.js"
import "./common/BirthdayUtilsTest"
import "./rest/EntityRestClientTest"
import "./crypto/CryptoFacadeTest.js"
import "./crypto/CompatibilityTest"
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
import "./worker/facades/MailFacadeTest"
import "./worker/facades/CalendarFacadeTest"
import "./worker/SuspensionHandlerTest"
import "./worker/ConfigurationDbTest"
import "./worker/CompressionTest"
import "../api/common/PlainTextSearchTest"
import "../api/common/EntityUtilsTest"
import {preTest, reportTest} from "./TestUtils"
import {random} from "@tutao/tutanota-crypto"

(async function () {

	const {WorkerImpl} = await import("../../src/api/worker/WorkerImpl")
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
	await random.addEntropy([{data: 36, entropy: 256, source: "key"}])
	preTest()

	// @ts-ignore
	o.run(reportTest)
})()