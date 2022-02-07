import o from "ospec"
import {matchers, object, when} from "testdouble"
import {stringToUtf8Uint8Array} from "@tutao/tutanota-utils"
import {WebauthnClient} from "../../../../src/misc/2fa/webauthn/WebauthnClient.js"
import {IWebauthn} from "../../../../src/misc/2fa/webauthn/IWebauthn.js"
import {createU2fChallenge} from "../../../../src/api/entities/sys/U2fChallenge.js"
import {createU2fKey} from "../../../../src/api/entities/sys/U2fKey.js"

o.spec("WebauthnClient", function () {
	let webauthn: IWebauthn
	let client: WebauthnClient
	let clientWebRoot = "https://test-web-root.tutanota.com"

	o.beforeEach(function () {
		webauthn = object()
		client = new WebauthnClient(webauthn, clientWebRoot)
	})

	o.spec("auth", function () {
		o.spec("keys for different domains", function () {
			async function testSelectedKey(givenKeys, expectedDomain) {
				const keys = givenKeys.map((appId) => createU2fKey({
					appId,
					keyHandle: stringToUtf8Uint8Array(appId)
				}))
				const challenge = createU2fChallenge({
					keys
				})
				const expectedKeys = keys.map((key) => {
					return {
						id: key.keyHandle,
						type: "public-key"
					} as const
				})
				when(webauthn.sign({
					challenge: matchers.anything(),
					keys: expectedKeys,
					domain: expectedDomain,
				})).thenResolve({
					rawId: new ArrayBuffer(1),
					clientDataJSON: new ArrayBuffer(1),
					signature: new ArrayBuffer(1),
					authenticatorData: new ArrayBuffer(1),
				})

				await client.authenticate(challenge)
			}

			o("tutanota webauthn key", async function () {
				await testSelectedKey(
					[
						"tutanota.com",
						"another.domain.com",
						"https://tutanota.com/u2f-appid.json",
						"https://legacy.another.domain/u2f-appid.json",
					],
					clientWebRoot,
				)
			})

			o("another webauthn key", async function () {
				await testSelectedKey(
					[
						"another.domain.com",
						"https://tutanota.com/u2f-appid.json",
						"https://legacy.another.domain/u2f-appid.json",
					],
					"https://another.domain.com",
				)
			})

			o("tutanota legacy key", async function () {
				await testSelectedKey(
					[
						"https://tutanota.com/u2f-appid.json",
						"https://legacy.another.domain/u2f-appid.json",
					],
					clientWebRoot,
				)
			})

			o("whitelabel legacy key", async function () {
				await testSelectedKey(
					[
						"https://legacy.another.domain/u2f-appid.json",
						"https://legacy.more.domain/u2f-appid.json",
					],
					"https://legacy.another.domain", // just the first one
				)
			})
		})
	})
})