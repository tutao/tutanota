import m from "mithril"
import { Dialog } from "../gui/base/Dialog.js"
import { lang, TranslationKey } from "../misc/LanguageViewModel.js"
import { isMailAddress } from "../misc/FormatValidator.js"
import { BookingItemFeatureType } from "../api/common/TutanotaConstants.js"
import { contains, delay, ofClass, promiseMap } from "@tutao/tutanota-utils"
import { PreconditionFailedError } from "../api/common/error/RestError.js"
import { showBuyDialog } from "../subscription/BuyDialog.js"
import { locator } from "../api/main/CommonLocator.js"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog.js"
import { OperationId } from "../api/main/OperationProgressTracker.js"
import { toFeatureType } from "../subscription/SubscriptionUtils.js"

const delayTime = 900
type UserImportDetails = {
	username: string | null
	mailAddress: string
	password: string
}
export const CSV_USER_FORMAT = "username;user@domain.com;password"

export function checkAndImportUserData(userDetailsInputCsv: string, availableDomains: string[]): boolean {
	let userData = csvToUserDetails(userDetailsInputCsv)

	if (!userData) {
		Dialog.message(() =>
			lang.get("wrongUserCsvFormat_msg", {
				"{format}": CSV_USER_FORMAT,
			}),
		)
		return false
	} else {
		const errorMessage = checkAndGetErrorMessage(userData, availableDomains)

		if (!errorMessage) {
			if (userData.length > 0) {
				showBookingDialog(userData)
			}

			return true
		} else {
			Dialog.message(() => errorMessage)
			return false
		}
	}
}

/**
 * Returns the user data from the given csv string or null if the scv string is not valid
 */
function csvToUserDetails(csvString: string): UserImportDetails[] | null {
	let lines = csvString
		.replace("\r", "")
		.split("\n")
		.filter((l) => "" !== l.trim())
	let error = false
	let userData = lines.map((a) => {
		let parts = a.trim().split(";")

		if (parts.length !== 3) {
			error = true
			return null
		} else {
			return {
				username: parts[0],
				mailAddress: parts[1],
				password: parts[2],
			}
		}
	})

	if (error) {
		return null
	} else {
		return userData as any
	}
}

/**
 * Check the user data for validity. Returns an error message for the first user with invalid data, otherwise null.
 */
function checkAndGetErrorMessage(userData: UserImportDetails[], availableDomains: string[]): string | null {
	if (userData.length === 0) {
		return lang.get("noInputWasMade_msg")
	} else {
		let errorMessageArray: TranslationKey[] = []
		let errorMessage: string | null = null
		userData.find((u, index) => {
			let mailAddress = u.mailAddress
			let domain = u.mailAddress.split("@")[1].toLowerCase().trim()

			if (!isMailAddress(u.mailAddress, true)) {
				errorMessageArray.push("mailAddressInvalid_msg")
			}

			if (!contains(availableDomains, domain)) {
				errorMessageArray.push("customDomainErrorDomainNotAvailable_msg")
			}

			if (u.password.trim() === "") {
				errorMessageArray.push("enterMissingPassword_msg")
			}

			if (userData.some((otherUser) => otherUser.mailAddress === mailAddress && otherUser !== u)) {
				errorMessageArray.push("duplicatedMailAddressInUserList_msg")
			}

			// create error msg from all errors for this user
			if (errorMessageArray.length > 0) {
				errorMessage =
					errorMessageArray.map((e) => lang.get(e)).join("\n") +
					"\n" +
					lang.get("errorAtLine_msg", {
						"{index}": index + 1,
						"{error}": `"${u.username || ""};${u.mailAddress || ""};${u.password || ""}"`,
					})
				return true
			}
		})
		return errorMessage
	}
}

async function showBookingDialog(userDetailsArray: UserImportDetails[]) {
	// We send index to worker and then worker calculates the progress based on the index of the user
	const userController = locator.logins.getUserController()
	const planType = await userController.getPlanType()

	const accepted = await showBuyDialog({
		featureType: (await userController.isNewPaidPlan()) ? toFeatureType(planType) : BookingItemFeatureType.LegacyUsers,
		bookingText: "bookingItemUsersIncluding_label",
		count: userDetailsArray.length,
		freeAmount: 0,
		reactivate: false,
	})
	if (!accepted) {
		return
	}
	let nbrOfCreatedUsers = 0
	let notAvailableUsers: UserImportDetails[] = []
	const operation = locator.operationProgressTracker.startNewOperation()
	await showProgressDialog(
		() =>
			lang.get("createActionStatus_msg", {
				"{index}": nbrOfCreatedUsers,
				"{count}": userDetailsArray.length,
			}),
		promiseMap(userDetailsArray, (user, userIndex) => {
			return createUserIfMailAddressAvailable(user, userIndex, userDetailsArray.length, operation.id).then((created) => {
				if (created) {
					nbrOfCreatedUsers++
					m.redraw()
				} else {
					notAvailableUsers.push(user)
				}
			})
		}),
		operation.progress,
	)
		.catch(ofClass(PreconditionFailedError, () => Dialog.message("createUserFailed_msg")))
		.finally(() => operation.done)

	if (notAvailableUsers.length > 0) {
		await Dialog.message(() => lang.get("addressesAlreadyInUse_msg") + " " + notAvailableUsers.map((u) => u.mailAddress).join(", "))
	}

	await Dialog.message(() =>
		lang.get("createdUsersCount_msg", {
			"{1}": nbrOfCreatedUsers,
		}),
	)
}

/**
 * @returns True if the user was created, false if the email address is not available.
 */
function createUserIfMailAddressAvailable(user: UserImportDetails, index: number, overallNumberOfUsers: number, operationId: OperationId): Promise<boolean> {
	let cleanMailAddress = user.mailAddress.trim().toLowerCase()
	return locator.mailAddressFacade.isMailAddressAvailable(cleanMailAddress).then(async (available) => {
		if (available) {
			// we don't use it currently

			return locator.userManagementFacade
				.createUser(user.username ? user.username : "", cleanMailAddress, user.password, index, overallNumberOfUsers, operationId)
				.then(() => {
					// delay is needed so that there are not too many requests from isMailAddressAvailable service if users ar not available (are not created)
					return delay(delayTime).then(() => true)
				})
		} else {
			return delay(delayTime).then(() => false)
		}
	})
}
