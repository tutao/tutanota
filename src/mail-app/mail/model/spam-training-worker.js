import { locator } from "../../workerUtils/worker/WorkerLocator"
console.log("Locator loaded", locator)
const spamClassifier = locator.spamClassifier
console.log("Spam classifier instance", spamClassifier)
console.log("Worker loaded")
console.log("🚀 spam-training-worker started")
self.onmessage = async (e) => {
	console.log("Worker received message", e.data)
	console.log("📩 Worker received:", e.data)
	self.postMessage({ reply: "pong" })
}
