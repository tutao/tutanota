import o from "@tutao/otest"
import { DesktopNativeCredentialsFacade, resolveChecked } from "../../../../src/desktop/credentials/DesktopNativeCredentialsFacade.js"
import { DesktopNativeCryptoFacade } from "../../../../src/desktop/DesktopNativeCryptoFacade.js"
import { CredentialEncryptionMode } from "../../../../src/misc/credentials/CredentialEncryptionMode.js"
import { makeKeyStoreFacade } from "../../TestUtils.js"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { function as fn, matchers, object, verify, when } from "testdouble"
import { LanguageViewModel } from "../../../../src/misc/LanguageViewModel.js"
import { DesktopConfig } from "../../../../src/desktop/config/DesktopConfig.js"
import { defer, delay, stringToBase64 } from "@tutao/tutanota-utils"
import { DesktopConfigKey } from "../../../../src/desktop/config/ConfigKeys.js"
import { CommonNativeFacade } from "../../../../src/native/common/generatedipc/CommonNativeFacade.js"
import { CancelledError } from "../../../../src/api/common/error/CancelledError.js"
import { KeyPermanentlyInvalidatedError } from "../../../../src/api/common/error/KeyPermanentlyInvalidatedError.js"
import { loadArgon2WASM } from "../../api/worker/WASMTestUtils.js"

o.spec("DesktopNativeCredentialsFacade", () => {
	const key = new Uint8Array([1, 2, 3])
	const keyStoreFacade = makeKeyStoreFacade(key)

	const getSubject = async () => {
		const crypto: DesktopNativeCryptoFacade = object()
		// too hard to mock
		const argon2 = await loadArgon2WASM()
		const lang: LanguageViewModel = object()
		const conf: DesktopConfig = object()
		const commonNativeFacade: CommonNativeFacade = object()

		return {
			subject: new DesktopNativeCredentialsFacade(keyStoreFacade, crypto, Promise.resolve(argon2), lang, conf, () => Promise.resolve(commonNativeFacade)),
			mocks: {
				crypto,
				lang,
				conf,
				commonNativeFacade,
			},
		}
	}

	o("throws when using wrong encryption mode", async function () {
		const { subject, mocks } = await getSubject()
		// @ts-ignore
		await assertThrows(Error, () => subject.decryptUsingKeychain("base64", CredentialEncryptionMode.BIOMETRICS))
		// @ts-ignore
		await assertThrows(Error, () => subject.decryptUsingKeychain("base64", CredentialEncryptionMode.SYSTEM_PASSWORD))
		// @ts-ignore
		await assertThrows(Error, () => subject.encryptUsingKeychain("base64", CredentialEncryptionMode.BIOMETRICS))
		// @ts-ignore
		await assertThrows(Error, () => subject.encryptUsingKeychain("base64", CredentialEncryptionMode.SYSTEM_PASSWORD))
	})

	o("does not throw when using right encryption mode, app pw", async function () {
		const { subject, mocks } = await getSubject()
		when(mocks.conf.getVar(DesktopConfigKey.appPassSalt)).thenResolve(stringToBase64("saltsalt"))
		when(mocks.commonNativeFacade.promptForPassword(matchers.anything())).thenResolve("password!")

		// @ts-ignore
		await subject.decryptUsingKeychain("base64", CredentialEncryptionMode.APP_PASSWORD)
	})

	o("throws a CancelledError for all pending requests if the salt changes", async function () {
		const { subject, mocks } = await getSubject()
		when(mocks.conf.getVar(DesktopConfigKey.appPassSalt)).thenResolve(stringToBase64("saltsalt"))
		const pwPromise = defer<string>()
		when(mocks.commonNativeFacade.promptForPassword(matchers.anything())).thenReturn(pwPromise.promise)

		// matchers.captor() did not give me the values array :(
		const cbs: Array<any> = []
		mocks.conf.once = (key, cb) => {
			o(key).equals(DesktopConfigKey.appPassSalt)
			cb("saltsalt2")
			return mocks.conf
		}
		const promise1 = subject.decryptUsingKeychain(Uint8Array.from([1, 2, 3, 4]), CredentialEncryptionMode.APP_PASSWORD)
		const promise2 = subject.decryptUsingKeychain(Uint8Array.from([1, 2, 3, 4]), CredentialEncryptionMode.APP_PASSWORD)

		verify(mocks.commonNativeFacade.showAlertDialog(matchers.anything()), { times: 0 })

		await assertThrows(CancelledError, () => promise1)
		await assertThrows(CancelledError, () => promise2)

		pwPromise.resolve("make it call the alternative")
		await delay(0)
		verify(mocks.commonNativeFacade.showAlertDialog(matchers.anything()), { times: 2 })
	})

	o("throws a KeyPermanentlyInvalidatedError if there is no salt", async function () {
		const { subject, mocks } = await getSubject()
		when(mocks.conf.getVar(DesktopConfigKey.appPassSalt)).thenResolve(null)
		const pwPromise = defer<string>()
		when(mocks.commonNativeFacade.promptForPassword(matchers.anything())).thenReturn(pwPromise.promise)

		await assertThrows(KeyPermanentlyInvalidatedError, () =>
			subject.decryptUsingKeychain(Uint8Array.from([1, 2, 3, 4]), CredentialEncryptionMode.APP_PASSWORD),
		)
	})

	o("does not throw when using right encryption mode, device lock", async function () {
		const { subject, mocks } = await getSubject()
		// @ts-ignore
		await subject.decryptUsingKeychain("base64", CredentialEncryptionMode.DEVICE_LOCK)
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
		const { promise, resolve, reject } = defer()
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
