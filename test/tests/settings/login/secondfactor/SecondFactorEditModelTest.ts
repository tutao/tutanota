import o from "@tutao/otest"
import { function as tdfn, matchers, object, verify, when } from "testdouble"
import {
	DEFAULT_TOTP_NAME,
	DEFAULT_U2F_NAME,
	NameValidationStatus,
	SecondFactorEditModel,
} from "../../../../../src/common/settings/login/secondfactor/SecondFactorEditModel.js"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient.js"
import { WebauthnClient } from "../../../../../src/common/misc/2fa/webauthn/WebauthnClient.js"
import { GroupInfoTypeRef, User } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { TotpSecret, TotpVerifier } from "@tutao/tutanota-crypto"
import { noOp } from "@tutao/tutanota-utils"
import { LanguageViewModel } from "../../../../../src/common/misc/LanguageViewModel.js"
import { LoginFacade } from "../../../../../src/common/api/worker/facades/LoginFacade.js"
import { SecondFactorType } from "../../../../../src/common/api/common/TutanotaConstants.js"
import { createTestEntity, domainConfigStub } from "../../../TestUtils.js"

function createTotpKeys(): TotpSecret {
	const key = new Uint8Array(16)
	const readableKey = TotpVerifier.readableKey(key)
	return { key, readableKey }
}

o.spec("SecondFactorEditModel", function () {
	let entityClientMock: EntityClient
	let userMock: User
	let webAuthnClientMock: WebauthnClient
	let loginFacadeMock: LoginFacade
	const totpKeys = createTotpKeys()
	const validName = "myU2Fkey"
	const langMock: LanguageViewModel = object()
	when(langMock.get(matchers.anything())).thenReturn("hello there")
	// this is too long if you convert it to bytes
	const invalidName = "🏳️‍🌈🏳️‍🌈🏳️‍🌈🏳️‍🌈🏴‍☠️🏴‍☠️🏴‍☠️🏴‍☠️🏴‍☠️"
	const hostname = "testhostname"

	async function createSecondFactorModel(params: any): Promise<SecondFactorEditModel> {
		const model = new SecondFactorEditModel(
			params.entityClient ?? entityClientMock,
			params.user ?? userMock,
			"testaddress@tutanota.de",
			params.webAuthnClient ?? webAuthnClientMock,
			totpKeys,
			params.webauthnSupported ?? true,
			langMock,
			loginFacadeMock,
			hostname,
			domainConfigStub,
			params.updateView ?? noOp,
		)
		await model.otpInfo.getAsync()
		return model
	}

	o.beforeEach(function () {
		entityClientMock = object()
		when(entityClientMock.load(GroupInfoTypeRef, matchers.anything())).thenResolve(
			createTestEntity(GroupInfoTypeRef, {
				mailAddress: "testaddress@tutanota.de",
			}),
		)
		userMock = object()
		webAuthnClientMock = object()
		loginFacadeMock = object()
	})

	o.spec("getFactorTypesOptions", function () {
		o("if webauthn is not supported, we get only one option", async function () {
			const model = await createSecondFactorModel({ webauthnSupported: false })
			const options = model.getFactorTypesOptions()
			o(options.length).equals(1)
			o(options.find((o) => o === SecondFactorType.webauthn)).equals(undefined)
		})

		o("if webauthn is supported, we get it as an option", async function () {
			const model = await createSecondFactorModel({})
			const options = model.getFactorTypesOptions()
			o(options.filter((o) => o === SecondFactorType.webauthn).length).equals(1)
		})
	})

	o.spec("onTypeChange", function () {
		o("when the type changes, we set the default name if necessary", async function () {
			const model = await createSecondFactorModel({})
			// empty name gets replaced if we change totp->u2f
			model.onTypeSelected(SecondFactorType.totp)
			model.onNameChange("")
			model.onTypeSelected(SecondFactorType.webauthn)
			o(model.nameValidationStatus).equals(NameValidationStatus.Valid)
			o(model.name).equals(DEFAULT_U2F_NAME)

			// empty name gets replaced if we change u2f->totp
			model.onNameChange("")
			model.onTypeSelected(SecondFactorType.totp)
			o(model.nameValidationStatus).equals(NameValidationStatus.Valid)
			o(model.name).equals(DEFAULT_TOTP_NAME)

			// default name gets replaced if we change type
			model.onTypeSelected(SecondFactorType.webauthn)
			o(model.nameValidationStatus).equals(NameValidationStatus.Valid)
			o(model.name).equals(DEFAULT_U2F_NAME)
		})

		o("when name too long changing the factor updates name validation status", async function () {
			const model = await createSecondFactorModel({})

			model.onTypeSelected(SecondFactorType.totp)
			model.onNameChange(invalidName)
			o(model.nameValidationStatus).equals(NameValidationStatus.Valid)

			// WEBAUTHN allows names up to 64 bytes
			model.onTypeSelected(SecondFactorType.webauthn)
			o(model.nameValidationStatus).equals(NameValidationStatus.Invalid)
			o(model.name).equals(invalidName)

			// when the name gets shorter, all is well
			model.onNameChange(validName)
			o(model.nameValidationStatus).equals(NameValidationStatus.Valid)

			// long Name is valid for TOTP
			model.onNameChange(invalidName)
			model.onTypeSelected(SecondFactorType.totp)
			o(model.nameValidationStatus).equals(NameValidationStatus.Valid)
		})
	})

	o.spec("saving a second factor", function () {
		o("saving a u2f key, happy path", async function () {
			const redrawMock = tdfn("redrawMock")
			when(entityClientMock.setup(matchers.anything(), matchers.anything())).thenResolve("randomID")
			when(webAuthnClientMock.register(matchers.anything(), matchers.anything())).thenResolve({})
			const model = await createSecondFactorModel({ updateView: redrawMock })

			model.onTypeSelected(SecondFactorType.webauthn)
			model.onNameChange(" \t ")
			const user = await model.save()
			o(user).deepEquals(userMock)

			verify(redrawMock(), { times: 2 })
			verify(entityClientMock.setup(matchers.anything(), matchers.anything()), { times: 1 })
		})

		o("saving a totp key, happy path", async function () {
			const redrawMock = tdfn("redrawMock")
			when(entityClientMock.setup(matchers.anything(), matchers.anything())).thenResolve("randomID")
			when(webAuthnClientMock.register(matchers.anything(), matchers.anything())).thenResolve({})
			when(loginFacadeMock.generateTotpCode(matchers.anything(), matchers.anything())).thenResolve(123456)
			const model = await createSecondFactorModel({ updateView: redrawMock })

			model.onTypeSelected(SecondFactorType.totp)
			model.onNameChange(" \t ")
			await model.onTotpValueChange("123456")
			const user = await model.save()
			o(user).deepEquals(userMock)

			verify(redrawMock(), { times: 3 })
			verify(entityClientMock.setup(matchers.anything(), matchers.anything()), { times: 1 })
		})
	})

	o.spec("TOTP value changed", function () {
		o("don't generate totp codes when the validation code has the wrong length", async function () {
			const model = await createSecondFactorModel({})
			await model.onTotpValueChange("1234567")
			verify(loginFacadeMock.generateTotpCode(matchers.anything(), matchers.anything()), { times: 0 })
		})
	})
})
