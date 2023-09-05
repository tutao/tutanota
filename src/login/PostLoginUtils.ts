import { isIOSApp } from "../api/common/Env.js"
import { Const } from "../api/common/TutanotaConstants.js"
import { UserController } from "../api/main/UserController.js"
import { assertNotNull } from "@tutao/tutanota-utils"
import { UserManagementFacade } from "../api/worker/facades/lazy/UserManagementFacade.js"
import { CustomerFacade } from "../api/worker/facades/lazy/CustomerFacade.js"

export async function shouldShowUpgradeReminder(userController: UserController, date: Date): Promise<boolean> {
	if (
		// If it's a free plan we want to show the upgrade reminder. But not in iOS app! There is no upgrade in iOS app.
		(userController.isFreeAccount() && !isIOSApp()) ||
		// If it's a legacy paid plan we also want to show it.
		(userController.isPremiumAccount() && !(await userController.isNewPaidPlan()))
	) {
		const customerInfo = await userController.loadCustomerInfo()
		const customerProperties = await userController.loadCustomerProperties()
		// If it's a new signup show reminder after INITIAL_UPGRADE_REMINDER_INTERVAL_MS.
		return (
			(customerProperties.lastUpgradeReminder == null &&
				date.getTime() - customerInfo.creationTime.getTime() > Const.INITIAL_UPGRADE_REMINDER_INTERVAL_MS) ||
			// If we've shown the reminder before show it again every REPEATED_UPGRADE_REMINDER_INTERVAL_MS.
			(customerProperties.lastUpgradeReminder != null &&
				date.getTime() - customerProperties.lastUpgradeReminder.getTime() > Const.REPEATED_UPGRADE_REMINDER_INTERVAL_MS)
		)
	}
	{
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
