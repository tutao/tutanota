// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {isMailAddress} from "../misc/FormatValidator"
import {worker} from "../api/main/WorkerClient"
import {showWorkerProgressDialog} from "../gui/base/ProgressDialog"
import {BookingItemFeatureType} from "../api/common/TutanotaConstants"
import {CSV_USER_FORMAT} from "./UserViewer"
import {contains} from "../api/common/utils/ArrayUtils"
import {show as showBuyDialog} from "../subscription/BuyDialog"
import {PreconditionFailedError} from "../api/common/error/RestError"

const delayTime = 900

type UserImportDetails = {
	username: ?string,
	mailAddress: string,
	password: string
}

export function checkAndImportUserData(userDetailsInputCsv: string, availableDomains: string[]): boolean {
	let userData = csvToUserDetails(userDetailsInputCsv)
	if (!userData) {
		Dialog.error(() => lang.get("wrongUserCsvFormat_msg", {
			"{format}": CSV_USER_FORMAT
		}))
		return false
	} else {
		let errorMessage = checkAndGetErrorMessage(userData, availableDomains)
		if (!errorMessage) {
			if (userData.length > 0) {
				showBookingDialog(userData)
			}
			return true
		} else {
			Dialog.error(() => errorMessage)
			return false
		}
	}
}

/**
 * Returns the user data from the given csv string or null if the scv string is not valid
 */
function csvToUserDetails(csvString: string): ?UserImportDetails[] {
	let lines = csvString.replace("\r", "").split('\n').filter(l => "" !== l.trim())

	let error = false
	let userData = lines.map(a => {
		let parts = a.trim().split(";");
		if (parts.length !== 3) {
			error = true
			return null
		} else {
			return {
				username: parts[0],
				mailAddress: parts[1],
				password: parts[2]
			}
		}
	})
	if (error) {
		return null
	} else {
		return (userData: any)
	}
}

/**
 * Check the user data for validity. Returns an error message for the first user with invalid data, otherwise null.
 */
function checkAndGetErrorMessage(userData: UserImportDetails[], availableDomains: string[]): ?string {
	if (userData.length === 0) {
		return lang.get("noInputWasMade_msg")
	} else {
		let errorMessageArray = []
		let errorMessage = null
		userData.find((u, index) => {
			let mailAddress = u.mailAddress
			let domain = u.mailAddress.split('@')[1].toLowerCase().trim()

			if (!isMailAddress(u.mailAddress, true)) {
				errorMessageArray.push("mailAddressInvalid_msg")
			}

			if (!contains(availableDomains, domain)) {
				errorMessageArray.push("customDomainErrorDomainNotAvailable_msg")
			}

			if (u.password.trim() === "") {
				errorMessageArray.push("enterMissingPassword_msg")
			}

			if (userData.find(otherUser => otherUser.mailAddress === mailAddress && otherUser !== u)) {
				errorMessageArray.push("duplicatedMailAddressInUserList_msg")
			}

			// create error msg from all errors for this user
			if (errorMessageArray.length > 0) {
				errorMessage = errorMessageArray.map(e => lang.get(e)).join("\n") + "\n" +
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

function showBookingDialog(userDetailsArray: UserImportDetails[]): void {
	let nbrOfCreatedUsers = 0
	let notAvailableUsers = []
	showBuyDialog(BookingItemFeatureType.Users, userDetailsArray.length, 0, false).then(accepted => {
		if (accepted) {
			return showWorkerProgressDialog(() => lang.get("createActionStatus_msg", {
				"{index}": nbrOfCreatedUsers,
				"{count}": userDetailsArray.length
			}), Promise.each(userDetailsArray, (user, index) => {
				return createUserIfMailAddressAvailable(user, index, userDetailsArray.length).then(created => {
					if (created) {
						nbrOfCreatedUsers++
						m.redraw()
					} else {
						notAvailableUsers.push(user)
					}
				})
			})).catch(PreconditionFailedError, e => Dialog.error("createUserFailed_msg"))
			   .then(() => {
				   let p = Promise.resolve()
				   if (notAvailableUsers.length > 0) {
					   p = Dialog.error(() => lang.get("addressesAlreadyInUse_msg") + " "
						   + notAvailableUsers.map(u => u.mailAddress).join(", "))
				   }
				   p.then(() => {
					   Dialog.error(() => lang.get("createdUsersCount_msg", {"{1}": nbrOfCreatedUsers}))
				   })
			   })
		}
	})
}

/**
 * @returns True if the user was created, false if the email address is not available.
 */
function createUserIfMailAddressAvailable(user: UserImportDetails, index: number, overallNumberOfUsers: number): Promise<boolean> {
	let cleanMailAddress = user.mailAddress.trim().toLowerCase()
	return worker.isMailAddressAvailable(cleanMailAddress).then(available => {
		if (available) {
			return worker.createUser(user.username ? user.username : "", cleanMailAddress, user.password, index, overallNumberOfUsers).then(() => {
				// Promise.delay is needed so that there are not too many requests from isMailAddressAvailable service if users ar not available (are not created)
				return Promise.delay(delayTime).return(true)
			})
		} else {
			return Promise.delay(delayTime).return(false)
		}
	})
}
