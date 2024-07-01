import o from "@tutao/otest"
import { AppPassHandler, resolveChecked } from "../../../../src/common/desktop/credentials/AppPassHandler.js"
import { DesktopNativeCryptoFacade } from "../../../../src/common/desktop/DesktopNativeCryptoFacade.js"
import { LanguageViewModel } from "../../../../src/common/misc/LanguageViewModel.js"
import { DesktopConfig } from "../../../../src/common/desktop/config/DesktopConfig.js"
import { function as fn, matchers, object, verify, when } from "testdouble"
import { CommonNativeFacade } from "../../../../src/common/native/common/generatedipc/CommonNativeFacade.js"
import { DesktopConfigKey } from "../../../../src/common/desktop/config/ConfigKeys.js"
import { defer, delay, stringToBase64 } from "@tutao/tutanota-utils"
import { CredentialEncryptionMode } from "../../../../src/common/misc/credentials/CredentialEncryptionMode.js"
import { CancelledError } from "../../../../src/common/api/common/error/CancelledError.js"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { KeyPermanentlyInvalidatedError } from "../../../../src/common/api/common/error/KeyPermanentlyInvalidatedError.js"
import { loadArgon2WASM } from "../../api/worker/WASMTestUtils.js"

o.spec("AppPassHandler", () => {
	let crypto: DesktopNativeCryptoFacade
	let lang: LanguageViewModel
	let conf: DesktopConfig
	let commonNativeFacade: CommonNativeFacade
	let appPassHandler: AppPassHandler

	o.beforeEach(async () => {
		crypto = object()
		lang = object()
		conf = object()
		commonNativeFacade = object()
		// too hard to mock
		const argon2 = loadArgon2WASM()
		appPassHandler = new AppPassHandler(crypto, conf, argon2, lang, () => Promise.resolve(commonNativeFacade))
	})

	o("does not throw when using right encryption mode, app pw", async function () {
		when(conf.getVar(DesktopConfigKey.appPassSalt)).thenResolve(stringToBase64("saltsalt"))
		when(commonNativeFacade.promptForPassword(matchers.anything())).thenResolve("password!")

		// @ts-ignore
		await appPassHandler.removeAppPassWrapper("base64", CredentialEncryptionMode.APP_PASSWORD)
	})

	o("throws a CancelledError for all pending requests if the salt changes", async function () {
		when(conf.getVar(DesktopConfigKey.appPassSalt)).thenResolve(stringToBase64("saltsalt"))
		const pwPromise = defer<string>()
		when(commonNativeFacade.promptForPassword(matchers.anything())).thenReturn(pwPromise.promise)

		// matchers.captor() did not give me the values array :(
		const cbs: Array<any> = []
		conf.once = (key, cb) => {
			o(key).equals(DesktopConfigKey.appPassSalt)
			cb("saltsalt2")
			return conf
		}
		const promise1 = appPassHandler.removeAppPassWrapper(Uint8Array.from([1, 2, 3, 4]), CredentialEncryptionMode.APP_PASSWORD)
		const promise2 = appPassHandler.removeAppPassWrapper(Uint8Array.from([1, 2, 3, 4]), CredentialEncryptionMode.APP_PASSWORD)

		verify(commonNativeFacade.showAlertDialog(matchers.anything()), { times: 0 })

		await assertThrows(CancelledError, () => promise1)
		await assertThrows(CancelledError, () => promise2)

		pwPromise.resolve("make it call the alternative")
		await delay(0)
		verify(commonNativeFacade.showAlertDialog(matchers.anything()), { times: 2 })
	})

	o("throws a KeyPermanentlyInvalidatedError if there is no salt", async function () {
		when(conf.getVar(DesktopConfigKey.appPassSalt)).thenResolve(null)
		const pwPromise = defer<string>()
		when(commonNativeFacade.promptForPassword(matchers.anything())).thenReturn(pwPromise.promise)

		await assertThrows(KeyPermanentlyInvalidatedError, () =>
			appPassHandler.removeAppPassWrapper(Uint8Array.from([1, 2, 3, 4]), CredentialEncryptionMode.APP_PASSWORD),
		)
	})
})

o.spec("resolveChecked", function () {
	o("rejects if whileNot rejects, also calls otherwise", async function () {
		const otherWise = fn<any>()
		const { promise, resolve } = defer()
		const rejector = defer<never>()
		const subject = assertThrows(Error, () => resolveChecked(promise, rejector.promise, otherWise))
		rejector.reject(new Error("aw"))
		resolve(0)
		await subject
		verify(otherWise(), { times: 1 })
	})

	o("rejects if promise rejects", async function () {
		const otherWise = fn<any>()
		const { promise, reject } = defer()
		const rejector = defer<never>()
		const subject = assertThrows(Error, () => resolveChecked(promise, rejector.promise, otherWise))
		reject(new Error("aw"))
		await subject
		verify(otherWise(), { times: 0 })
	})

	o("resolves if promise resolves", async function () {
		const otherWise = fn<any>()
		const { promise, resolve } = defer()
		const rejector = defer<never>()
		const subject = resolveChecked(promise, rejector.promise, otherWise)
		resolve("hello")
		const value = await subject
		verify(otherWise(), { times: 0 })
		o(value).equals("hello")
	})
})
