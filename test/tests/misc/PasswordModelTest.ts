import o from "@tutao/otest"
import { PasswordModel } from "../../../src/common/settings/PasswordForm.js"
import { matchers, object, when } from "testdouble"
import { LoginController } from "../../../src/common/api/main/LoginController.js"
import { UsageTestController } from "@tutao/tutanota-usagetests"

o.spec("PasswordModelTest", function () {
	let passwordModel: PasswordModel | null = null
	let reservedStrings: string[] = []

	o.beforeEach(function () {
		reservedStrings = []
		let logins: LoginController = object()
		let usageTestController: UsageTestController = object()
		when(usageTestController.getTest(matchers.anything())).thenReturn({})
		passwordModel = new PasswordModel(usageTestController, logins, {
			checkOldPassword: false,
			enforceStrength: true,
			reservedStrings: () => reservedStrings,
		})
	})

	o.spec("calculatePasswordStrength -> reserved strings are considered", function () {
		o("generate random number in range", async function () {
			passwordModel!.setNewPassword("7jeGABvliT")
			o(passwordModel!.getPasswordStrength()).equals(80)

			reservedStrings = ["7jeGABvliT"]
			passwordModel?.recalculatePasswordStrength()
			o(passwordModel!.getPasswordStrength()).equals(54)
		})
	})
})
