/**
 * Environment setup launcher for platform-kit integration examples.
 * Run: npx tsx test/runExamples.ts
 * Requires a local server at http://localhost:9000.
 */

import { existsSync } from "node:fs"
// @ts-ignore
import xhr2 from "xhr2"

// Detect Podman container and use the host bridge address; fall back to localhost for direct runs.
const inContainer = process.env.container === "podman" || existsSync("/run/.containerenv")
const devServerHost = inContainer ? "host.containers.internal" : "localhost"
const devServerUrl = `http://${devServerHost}:9000`

;(globalThis as any).env = {
	staticUrl: devServerUrl,
	versionNumber: "348.0.0",
	dist: false,
	mode: "Test",
	networkDebugging: false,
	domainConfigs: {
		[devServerHost]: {
			firstPartyDomain: true,
			partneredDomainTransitionUrl: devServerUrl,
			apiUrl: devServerUrl,
			paymentUrl: `${devServerUrl}/braintree.html`,
			webauthnUrl: `${devServerUrl}/webauthn`,
			legacyWebauthnUrl: `${devServerUrl}/webauthn`,
			webauthnMobileUrl: `${devServerUrl}/webauthnmobile`,
			legacyWebauthnMobileUrl: `${devServerUrl}/webauthnmobile`,
			webauthnRpId: devServerHost,
			u2fAppId: `${devServerUrl}/u2f-appid.json`,
			giftCardBaseUrl: `${devServerUrl}/giftcard`,
			referralBaseUrl: `${devServerUrl}/signup`,
			websiteBaseUrl: "https://tuta.com",
		},
		"{hostname}": {
			firstPartyDomain: false,
			partneredDomainTransitionUrl: "{protocol}//{hostname}",
			apiUrl: "{protocol}//{hostname}",
			paymentUrl: "https://pay.tutanota.com/braintree.html",
			webauthnUrl: "{protocol}//{hostname}/webauthn",
			legacyWebauthnUrl: "{protocol}//{hostname}/webauthn",
			webauthnMobileUrl: "{protocol}//{hostname}/webauthnmobile",
			legacyWebauthnMobileUrl: "{protocol}//{hostname}/webauthnmobile",
			webauthnRpId: "{hostname}",
			u2fAppId: "{protocol}//{hostname}/u2f-appid.json",
			giftCardBaseUrl: "https://app.tuta.com/giftcard",
			referralBaseUrl: "https://app.tuta.com/signup",
			websiteBaseUrl: "https://tuta.com",
		},
	},
}
;(globalThis as any).isBrowser = false
;(globalThis as any).self = globalThis
;(globalThis as any).XMLHttpRequest = xhr2
;(await import("./examples/PlatformKitExample.js")).runPlatformKitExample()
