import o from "@tutao/otest"
import { matchers, object, when } from "testdouble"
import { stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { WebauthnClient } from "../../../../src/common/misc/2fa/webauthn/WebauthnClient.js"
import { WebAuthnFacade } from "../../../../src/common/native/common/generatedipc/WebAuthnFacade.js"
import { U2fChallengeTypeRef, U2fKeyTypeRef } from "../../../../src/common/api/entities/sys/TypeRefs.js"
import { createTestEntity, domainConfigStub } from "../../TestUtils.js"
import { DomainConfigProvider } from "../../../../src/common/api/common/DomainConfigProvider.js"

o.spec("WebauthnClient", function () {
	let webauthn: WebAuthnFacade
	let client: WebauthnClient
	let domainConfigProvider: DomainConfigProvider
	const tutanotaWebauthnUrl = "https://mail.tutanota.com/webauthn"
	const tutanotaApiBaseUrl = "https://mail.tutanota.com"
	const tutanotaWebauthnMobileUrl = "https://mail.tutanota.com/webauthnmobile"
	let isApp: boolean

	async function testSelectedKey(givenKeys, expectedDomain): ReturnType<WebauthnClient["authenticate"]> {
		const keys = givenKeys.map((appId) =>
			createTestEntity(U2fKeyTypeRef, {
				appId,
				keyHandle: stringToUtf8Uint8Array(appId),
			}),
		)
		const challenge = createTestEntity(U2fChallengeTypeRef, {
			keys,
		})
		const expectedKeys = keys.map((key) => {
			return {
				id: key.keyHandle,
			} as const
		})
		when(
			webauthn.sign({
				challenge: matchers.anything(),
				keys: expectedKeys,
				domain: expectedDomain,
			}),
		).thenResolve({
			rawId: new Uint8Array(1),
			clientDataJSON: new Uint8Array(1),
			signature: new Uint8Array(1),
			authenticatorData: new Uint8Array(1),
		})

		return client.authenticate(challenge)
	}

	o.beforeEach(function () {
		webauthn = object()
		domainConfigProvider = object()
		when(domainConfigProvider.getDomainConfigForHostname("mail.tutanota.com", "https:", matchers.anything())).thenReturn({
			...domainConfigStub,
			legacyWebauthnUrl: tutanotaWebauthnUrl,
			webauthnUrl: tutanotaWebauthnUrl,
			apiUrl: tutanotaApiBaseUrl,
			webauthnMobileUrl: tutanotaWebauthnMobileUrl,
		})
		client = new WebauthnClient(webauthn, domainConfigProvider, isApp)
	})

	o.spec("not running as a mobile app", function () {
		o.before(function () {
			isApp = false
		})
		o.spec("auth", function () {
			o.spec("keys for different domains", function () {
				o("tutanota webauthn key", async function () {
					when(domainConfigProvider.getCurrentDomainConfig()).thenReturn({
						...domainConfigStub,
						legacyWebauthnUrl: tutanotaWebauthnUrl,
					})
					const result = await testSelectedKey(
						["tutanota.com", "another.domain.com", "https://tutanota.com/u2f-appid.json", "https://legacy.another.domain/u2f-appid.json"],
						tutanotaWebauthnUrl,
					)
					o(result.apiBaseUrl).equals(tutanotaApiBaseUrl)
				})

				o("another webauthn key", async function () {
					const domainConfig = {
						...domainConfigStub,
						webauthnUrl: "https://another.domain.com/webauthn",
						apiUrl: "https://another.domain.com",
					}
					when(domainConfigProvider.getCurrentDomainConfig()).thenReturn(domainConfig)
					when(domainConfigProvider.getDomainConfigForHostname("another.domain.com", "https:", matchers.anything())).thenReturn(domainConfig)
					when(domainConfigProvider.getDomainConfigForHostname("another.domain.com", "https:")).thenReturn(domainConfig)
					const result = await testSelectedKey(
						["another.domain.com", "https://tutanota.com/u2f-appid.json", "https://legacy.another.domain/u2f-appid.json"],
						"https://another.domain.com/webauthn",
					)
					o(result.apiBaseUrl).equals("https://another.domain.com")
				})

				o("tutanota legacy key", async function () {
					when(domainConfigProvider.getCurrentDomainConfig()).thenReturn({
						...domainConfigStub,
						legacyWebauthnUrl: tutanotaWebauthnUrl,
					})
					const result = await testSelectedKey(
						["https://tutanota.com/u2f-appid.json", "https://legacy.another.domain/u2f-appid.json"],
						tutanotaWebauthnUrl,
					)
					o(result.apiBaseUrl).equals(tutanotaApiBaseUrl)
				})

				o("whitelabel legacy key", async function () {
					const domainConfig = {
						...domainConfigStub,
						legacyWebauthnUrl: "https://legacy.another.domain/webauthn",
						webauthnUrl: "https://legacy.another.domain/webauthn",
						apiUrl: "https:///legacy.another.domain",
					}
					when(domainConfigProvider.getCurrentDomainConfig()).thenReturn(domainConfig)
					when(domainConfigProvider.getDomainConfigForHostname("legacy.another.domain", "https:", matchers.anything())).thenReturn(domainConfig)
					const result = await testSelectedKey(
						["https://legacy.another.domain/u2f-appid.json", "https://legacy.more.domain/u2f-appid.json"],
						"https://legacy.another.domain/webauthn", // just the first one
					)
					o(result.apiBaseUrl).equals("https:///legacy.another.domain")
				})

				o("tuta.com key, on tuta.com domain", async function () {
					const domainConfig = {
						...domainConfigStub,
						legacyWebauthnUrl: "https://mail.tutanota.com/webauthn",
						webauthnUrl: "https://app.tuta.com/webauthn",
						apiUrl: "https:///app.tuta.com",
					}
					when(domainConfigProvider.getCurrentDomainConfig()).thenReturn(domainConfig)
					when(domainConfigProvider.getDomainConfigForHostname("app.tuta.com", "https:", matchers.anything())).thenReturn(domainConfig)
					when(domainConfigProvider.getDomainConfigForHostname("app.tuta.com", "https:")).thenReturn(domainConfig)
					const result = await testSelectedKey(
						["app.tuta.com"],
						"https://app.tuta.com/webauthn", // just the first one
					)
					o(result.apiBaseUrl).equals("https:///app.tuta.com")
				})

				o("tuta.com key, on tutanota.com domain", async function () {
					const tutaDomainConfig = {
						...domainConfigStub,
						legacyWebauthnUrl: "https://mail.tutanota.com/webauthn",
						webauthnUrl: "https://app.tuta.com/webauthn",
						apiUrl: "https:///app.tuta.com",
					}
					when(domainConfigProvider.getCurrentDomainConfig()).thenReturn(tutaDomainConfig)
					when(domainConfigProvider.getDomainConfigForHostname("app.tuta.com", "https:", matchers.anything())).thenReturn(tutaDomainConfig)
					const result = await testSelectedKey(
						["tuta.com"],
						"https://app.tuta.com/webauthn", // just the first one
					)
					o(result.apiBaseUrl).equals("https:///app.tuta.com")
				})

				o("tutanota.com key, on tuta.com domain", async function () {
					const tutaDomainConfig = {
						...domainConfigStub,
						legacyWebauthnUrl: "https://mail.tutanota.com/webauthn",
						webauthnUrl: "https://app.tuta.com/webauthn",
						apiUrl: "https:///app.tuta.com",
					}
					when(domainConfigProvider.getCurrentDomainConfig()).thenReturn(tutaDomainConfig)
					when(domainConfigProvider.getDomainConfigForHostname("app.tuta.com")).thenReturn(tutaDomainConfig)
					const result = await testSelectedKey(
						["tutanota.com"],
						tutanotaWebauthnUrl, // just the first one
					)
					o(result.apiBaseUrl).equals("https://mail.tutanota.com")
				})
			})
		})
	})

	o.spec("when running as an app", function () {
		o.before(function () {
			isApp = true
		})
		o("tutanota webauthn key", async function () {
			when(domainConfigProvider.getCurrentDomainConfig()).thenReturn({
				...domainConfigStub,
				legacyWebauthnMobileUrl: tutanotaWebauthnMobileUrl,
			})
			const result = await testSelectedKey(
				["tutanota.com", "another.domain.com", "https://tutanota.com/u2f-appid.json", "https://legacy.another.domain/u2f-appid.json"],
				tutanotaWebauthnMobileUrl,
			)
			o(result.apiBaseUrl).equals(tutanotaApiBaseUrl)
		})

		o("tuta webauthn key", async function () {
			when(domainConfigProvider.getCurrentDomainConfig()).thenReturn({
				...domainConfigStub,
				webauthnMobileUrl: tutanotaWebauthnMobileUrl,
			})
			const result = await testSelectedKey(
				["tuta.com", "another.domain.com", "https://tutanota.com/u2f-appid.json", "https://legacy.another.domain/u2f-appid.json"],
				tutanotaWebauthnMobileUrl,
			)
			o(result.apiBaseUrl).equals(tutanotaApiBaseUrl)
		})
	})
})
