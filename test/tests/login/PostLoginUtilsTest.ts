import o from "@tutao/otest"
import { UserController } from "../../../src/common/api/main/UserController.js"
import { reminderCutoffDate, shouldShowUpgradeReminder } from "../../../src/common/login/PostLoginUtils.js"
import { object, when } from "testdouble"
import {
	Customer,
	CustomerInfo,
	CustomerInfoTypeRef,
	CustomerProperties,
	CustomerPropertiesTypeRef,
	CustomerTypeRef,
} from "../../../src/common/api/entities/sys/TypeRefs.js"
import { Const } from "../../../src/common/api/common/TutanotaConstants.js"
import { createTestEntity } from "../TestUtils.js"

o.spec("PostLoginUtils", () => {
	o.spec("shouldShowUpgradeReminder", () => {
		let userController: UserController
		let customerInfo: CustomerInfo
		let customerProperties: CustomerProperties
		let customer: Customer
		const date = new Date("2023-09-05")

		o.beforeEach(() => {
			userController = object()

			customerInfo = createTestEntity(CustomerInfoTypeRef, {})
			customerProperties = createTestEntity(CustomerPropertiesTypeRef, {})
			customer = createTestEntity(CustomerTypeRef)

			when(userController.loadCustomerInfo()).thenResolve(customerInfo)
			when(userController.loadCustomerProperties()).thenResolve(customerProperties)
			when(userController.loadCustomer()).thenResolve(customer)
		})

		o("should show for free accounts for the first time if they are old enough", async () => {
			customerInfo.creationTime = new Date(date.getTime() - Const.INITIAL_UPGRADE_REMINDER_INTERVAL_MS - 10)
			when(userController.isFreeAccount()).thenReturn(true)
			when(userController.isGlobalAdmin()).thenReturn(true)
			customerProperties.lastUpgradeReminder = null
			o(await shouldShowUpgradeReminder(userController, date)).equals(true)
		})

		o("should not show for free accounts for the first time if they are not old enough", async () => {
			customerInfo.creationTime = new Date(date.getTime() - Const.INITIAL_UPGRADE_REMINDER_INTERVAL_MS + 10)
			when(userController.isFreeAccount()).thenReturn(true)
			when(userController.isGlobalAdmin()).thenReturn(true)
			customerProperties.lastUpgradeReminder = null
			o(await shouldShowUpgradeReminder(userController, date)).equals(false)
		})

		o("should show for legacy paid accounts if reminder was never shown but the account is old enough", async () => {
			when(userController.isFreeAccount()).thenReturn(false)
			when(userController.isGlobalAdmin()).thenReturn(true)
			when(userController.isPremiumAccount()).thenReturn(true)
			when(userController.isNewPaidPlan()).thenResolve(false)

			customerInfo.creationTime = new Date(date.getTime() - Const.INITIAL_UPGRADE_REMINDER_INTERVAL_MS - 10)
			customerProperties.lastUpgradeReminder = null

			o(await shouldShowUpgradeReminder(userController, date)).equals(true)
		})

		o("SHOULD show for PRIVATE legacy paid accounts if enough time has passed", async () => {
			when(userController.isFreeAccount()).thenReturn(false)
			when(userController.isGlobalAdmin()).thenReturn(true)
			when(userController.isPremiumAccount()).thenReturn(true)
			when(userController.isNewPaidPlan()).thenResolve(false)

			customerProperties.lastUpgradeReminder = new Date(date.getTime() - Const.REPEATED_UPGRADE_REMINDER_INTERVAL_MS - 10)

			o(await shouldShowUpgradeReminder(userController, date)).equals(true)
		})

		o("SHOULD NOT show for BUSINESS legacy paid accounts even if enough time has passed", async () => {
			when(userController.isFreeAccount()).thenReturn(false)
			when(userController.isGlobalAdmin()).thenReturn(true)
			when(userController.isPremiumAccount()).thenReturn(true)
			when(userController.isNewPaidPlan()).thenResolve(false)
			customer.businessUse = true

			customerProperties.lastUpgradeReminder = new Date(date.getTime() - Const.REPEATED_UPGRADE_REMINDER_INTERVAL_MS - 10)

			o(await shouldShowUpgradeReminder(userController, date)).equals(false)
		})

		o("should not show for legacy paid accounts if it has been reminded after the cutoff date", async () => {
			when(userController.isFreeAccount()).thenReturn(false)
			when(userController.isGlobalAdmin()).thenReturn(true)
			when(userController.isPremiumAccount()).thenReturn(true)
			when(userController.isNewPaidPlan()).thenResolve(false)

			customerProperties.lastUpgradeReminder = new Date(reminderCutoffDate.getTime() + 10)

			o(await shouldShowUpgradeReminder(userController, date)).equals(false)
		})

		o("should not show for new paid accounts even if enough time has passed", async () => {
			when(userController.isFreeAccount()).thenReturn(false)
			when(userController.isGlobalAdmin()).thenReturn(true)
			when(userController.isPremiumAccount()).thenReturn(true)
			when(userController.isNewPaidPlan()).thenResolve(true)

			customerProperties.lastUpgradeReminder = new Date(date.getTime() - Const.REPEATED_UPGRADE_REMINDER_INTERVAL_MS - 10)

			o(await shouldShowUpgradeReminder(userController, date)).equals(false)
		})

		o("should not show for non-admin users that would normally get shown because legacy", async () => {
			when(userController.isFreeAccount()).thenReturn(false)
			when(userController.isGlobalAdmin()).thenReturn(false)
			when(userController.isPremiumAccount()).thenReturn(true)
			when(userController.isNewPaidPlan()).thenResolve(false)

			customerProperties.lastUpgradeReminder = new Date(date.getTime() - Const.REPEATED_UPGRADE_REMINDER_INTERVAL_MS - 10)

			o(await shouldShowUpgradeReminder(userController, date)).equals(false)
		})
	})
})
