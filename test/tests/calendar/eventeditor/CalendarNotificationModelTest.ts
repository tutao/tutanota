import o from "@tutao/otest"
import { FeatureType } from "@tutao/appEnv"
import { hasPlanWithInvites } from "../../../../src/calendar-app/calendar/gui/eventeditor-model/CalendarNotificationModel.js"
import { LoginController } from "../../../../src/common/api/main/LoginController.js"
import { object, replace, when } from "testdouble"
import { UserController } from "../../../../src/common/api/main/UserController.js"
import { createTestEntity } from "../../TestUtils.js"
import { sysTypeRefs } from "@tutao/typeRefs"
import { AccountType } from "@tutao/appEnv"

o.spec("CalendarNotificationModel", function () {
	let userController: UserController
	let customer: sysTypeRefs.Customer
	let logins: LoginController

	o.beforeEach(function () {
		userController = object()
		customer = object()
		logins = object()
		when(userController.reloadCustomer()).thenResolve(customer)
		when(logins.getUserController()).thenReturn(userController)
	})

	o.spec("hasPlanWithInvites", function () {
		o("available for users with new paid plan that contains invites", async function () {
			when(userController.isNewPaidPlan()).thenResolve(true)
			when(userController.getPlanConfig()).thenResolve(createTestEntity(sysTypeRefs.PlanConfigurationTypeRef, { eventInvites: true }))
			replace(userController, "user", { accountType: AccountType.PAID })
			replace(customer, "customizations", [])
			o(await hasPlanWithInvites(logins)).equals(true)
		})

		o("not available for users with new paid plan that does not contain invites", async function () {
			when(userController.isNewPaidPlan()).thenResolve(true)
			when(userController.getPlanConfig()).thenResolve(createTestEntity(sysTypeRefs.PlanConfigurationTypeRef, { eventInvites: false }))
			replace(userController, "user", { accountType: AccountType.PAID })
			o(await hasPlanWithInvites(logins)).equals(false)
		})

		o("not available for free users will is true for free accounts", async function () {
			when(userController.isNewPaidPlan()).thenResolve(false)
			replace(userController, "user", { accountType: AccountType.FREE })
			replace(customer, "customizations", [])
			o(await hasPlanWithInvites(logins)).equals(false)
		})

		o("available for premium users with business subscription", async function () {
			when(userController.isNewPaidPlan()).thenResolve(false)
			replace(userController, "user", { accountType: AccountType.PAID })
			when(userController.getPlanConfig()).thenResolve({ eventInvites: true })
			replace(customer, "customizations", [{ feature: FeatureType.BusinessFeatureEnabled }])
			o(await hasPlanWithInvites(logins)).equals(true)
		})

		o("not available for external users", async function () {
			when(userController.isNewPaidPlan()).thenResolve(false)
			replace(userController, "user", { accountType: AccountType.EXTERNAL })
			o(await hasPlanWithInvites(logins)).equals(false)
		})
	})
})
