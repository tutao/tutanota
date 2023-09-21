import { isIOSApp } from "../api/common/Env.js"
import { Const } from "../api/common/TutanotaConstants.js"
import { UserController } from "../api/main/UserController.js"
import { assertNotNull } from "@tutao/tutanota-utils"
import { UserManagementFacade } from "../api/worker/facades/lazy/UserManagementFacade.js"
import { CustomerFacade } from "../api/worker/facades/lazy/CustomerFacade.js"

// the customer may have been reminded when they were a free account, so we can't use lastUpgradeReminder being null as a marker.
// we use a date that's shortly before we started issuing reminders for legacy accounts and after we started only allowing new plans as upgrades.
// anyone who is still legacy and was reminded before this date must have seen the last reminder when they were a free account.
// if we end up wanting to repeat this down the line, update this to some later date.
export const reminderCutoffDate = new Date("2023-09-20T13:00:00.000Z")

export async function shouldShowUpgradeReminder(userController: UserController, date: Date): Promise<boolean> {
	// * do not show to normal users, they can't upgrade their account
	// * do not show to new plans, they already switched
	// * do not show in ios app, they can't upgrade there.
	if (!userController.isGlobalAdmin() || (await userController.isNewPaidPlan()) || isIOSApp()) return false

	const customerInfo = await userController.loadCustomerInfo()
	const customerProperties = await userController.loadCustomerProperties()

	if (userController.isFreeAccount()) {
		// i'm any non-paying user - show repeatedly until upgraded, but only after INITIAL_UPGRADE_REMINDER_INTERVAL_MS
		const isOldEnoughForInitialReminder =
			customerProperties.lastUpgradeReminder == null && date.getTime() - customerInfo.creationTime.getTime() > Const.INITIAL_UPGRADE_REMINDER_INTERVAL_MS
		// If we've shown the reminder before show it again every REPEATED_UPGRADE_REMINDER_INTERVAL_MS.
		const wasRemindedLongAgo =
			customerProperties.lastUpgradeReminder != null &&
			date.getTime() - customerProperties.lastUpgradeReminder.getTime() > Const.REPEATED_UPGRADE_REMINDER_INTERVAL_MS
		return isOldEnoughForInitialReminder || wasRemindedLongAgo
	} else if (!(await userController.loadCustomer()).businessUse) {
		// i'm a private legacy paid account. show once.
		// we don't have to check account age - all legacy accounts are old enough by now.
		return customerProperties.lastUpgradeReminder == null || customerProperties.lastUpgradeReminder.getTime() < reminderCutoffDate.getTime()
	} else {
		// i'm a business legacy paid account, so we don't show the reminder.
		return false
	}
}

export async function shouldShowStorageWarning(
	userController: UserController,
	userManagementFacade: UserManagementFacade,
	customerFacade: CustomerFacade,
): Promise<boolean> {
	const customerInfo = await userController.loadCustomerInfo()
	// New plans have per-user storage limits.
	if ((await userController.isNewPaidPlan()) || userController.isFreeAccount()) {
		const usedStorage = await userManagementFacade.readUsedUserStorage(userController.user)
		return isOverStorageLimit(usedStorage, Number(customerInfo.perUserStorageCapacity) * Const.MEMORY_GB_FACTOR)
	} else {
		// Legacy plans have per-account storage limits.
		if (!userController.isGlobalAdmin()) {
			return false
		}
		const customerId = assertNotNull(userController.user.customer)
		const usedStorage = await customerFacade.readUsedCustomerStorage(customerId)
		if (Number(usedStorage) > Const.MEMORY_GB_FACTOR * Const.MEMORY_WARNING_FACTOR) {
			const availableStorage = await customerFacade.readAvailableCustomerStorage(customerId)
			return isOverStorageLimit(usedStorage, availableStorage)
		} else {
			return false
		}
	}
}

function isOverStorageLimit(usedStorageInBytes: number, availableStorageInBytes: number) {
	return usedStorageInBytes > availableStorageInBytes * Const.MEMORY_WARNING_FACTOR
}
