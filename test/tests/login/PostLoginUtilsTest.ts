import o from "@tutao/otest"
import { UserController } from "../../../src/api/main/UserController.js"
import { shouldShowUpgradeReminder } from "../../../src/login/PostLoginUtils.js"
import { object, when } from "testdouble"
import { createCustomerInfo, createCustomerProperties, CustomerInfo, CustomerProperties } from "../../../src/api/entities/sys/TypeRefs.js"
import { Const } from "../../../src/api/common/TutanotaConstants.js"

o.spec("PostLoginUtils", () => {
	o.spec("shouldShowUpgradeReminder", () => {
		let userController: UserController
		let customerInfo: CustomerInfo
		let customerProperties: CustomerProperties
		const date = new Date("2023-09-05")

		o.beforeEach(() => {
			userController = object()

			customerInfo = createCustomerInfo({})
			customerProperties = createCustomerProperties({})

			when(userController.loadCustomerInfo()).thenResolve(customerInfo)
			when(userController.loadCustomerProperties()).thenResolve(customerProperties)
		})

		o("should show for free accounts for the first time if they are old enough", async () => {
			customerInfo.creationTime = new Date(date.getTime() - Const.INITIAL_UPGRADE_REMINDER_INTERVAL_MS - 10)
			when(userController.isFreeAccount()).thenReturn(true)
			customerProperties.lastUpgradeReminder = null
			o(await shouldShowUpgradeReminder(userController, date)).equals(true)
		})

		o("should not show for free accounts for the first time if they are not old enough", async () => {
			customerInfo.creationTime = new Date(date.getTime() - Const.INITIAL_UPGRADE_REMINDER_INTERVAL_MS + 10)
			when(userController.isFreeAccount()).thenReturn(true)
			customerProperties.lastUpgradeReminder = null
			o(await shouldShowUpgradeReminder(userController, date)).equals(false)
		})

		o("should show for legacy paid accounts if reminder was never shown but the account is old enough", async () => {
			when(userController.isFreeAccount()).thenReturn(false)
			when(userController.isPremiumAccount()).thenReturn(true)
			when(userController.isNewPaidPlan()).thenResolve(false)

			customerInfo.creationTime = new Date(date.getTime() - Const.INITIAL_UPGRADE_REMINDER_INTERVAL_MS - 10)
			customerProperties.lastUpgradeReminder = null

			o(await shouldShowUpgradeReminder(userController, date)).equals(true)
		})

		o("should show for legacy paid accounts if enough time has passed", async () => {
			when(userController.isFreeAccount()).thenReturn(false)
			when(userController.isPremiumAccount()).thenReturn(true)
			when(userController.isNewPaidPlan()).thenResolve(false)

			customerProperties.lastUpgradeReminder = new Date(date.getTime() - Const.REPEATED_UPGRADE_REMINDER_INTERVAL_MS - 10)

			o(await shouldShowUpgradeReminder(userController, date)).equals(true)
		})

		o("should not show for legacy paid accounts if not enough time has passed", async () => {
			when(userController.isFreeAccount()).thenReturn(false)
			when(userController.isPremiumAccount()).thenReturn(true)
			when(userController.isNewPaidPlan()).thenResolve(false)

			customerProperties.lastUpgradeReminder = new Date(date.getTime() - Const.REPEATED_UPGRADE_REMINDER_INTERVAL_MS + 10)

			o(await shouldShowUpgradeReminder(userController, date)).equals(false)
		})

		o("should not show for new paid accounts even if enough time has passed", async () => {
			when(userController.isFreeAccount()).thenReturn(false)
			when(userController.isPremiumAccount()).thenReturn(true)
			when(userController.isNewPaidPlan()).thenResolve(true)

			customerProperties.lastUpgradeReminder = new Date(date.getTime() - Const.REPEATED_UPGRADE_REMINDER_INTERVAL_MS - 10)

			o(await shouldShowUpgradeReminder(userController, date)).equals(false)
		})
	})
})
