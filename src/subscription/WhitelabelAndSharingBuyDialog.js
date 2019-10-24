// @flow
import {Const, BookingItemFeatureType} from "../api/common/TutanotaConstants"
import {serviceRequestVoid} from "../api/main/Entity"
import {HttpMethod} from "../api/common/EntityFunctions"
import {Dialog} from "../gui/base/Dialog"
import {SysService} from "../api/entities/sys/Services"
import {PreconditionFailedError} from "../api/common/error/RestError"
import * as BuyDialog from "./BuyDialog"
import {createBookingServiceData} from "../api/entities/sys/BookingServiceData"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import type {BookingItemFeatureTypeEnum} from "../api/common/TutanotaConstants"
import type {TranslationKey} from "../misc/LanguageViewModel"

/**
  * @returns true if the execution was successfull. False if the action has been cancelled by user or the precondition has failed.
  */
export function buyWhitelabel(enable: boolean):Promise<boolean> {
	return buy(BookingItemFeatureType.Branding, "whitelabelDomainExisting_msg", enable)
}

/**
 * @returns true if the execution was successfull. False if the action has been cancelled by user or the precondition has failed.
 */
export function buySharing(enable: boolean):Promise<boolean> {
	return buy(BookingItemFeatureType.Sharing, "sharedCalendarExisting_msg", enable)
}

function buy(bookingItemFeatureType: BookingItemFeatureTypeEnum, errorMessageId: TranslationKey, enable: boolean):Promise<boolean> {
	const amount = enable ? 1 : 0
	const bookingData = createBookingServiceData()
	bookingData.amount = amount.toString()
	bookingData.featureType = bookingItemFeatureType
	bookingData.date = Const.CURRENT_DATE
	return serviceRequestVoid(SysService.BookingService, HttpMethod.POST, bookingData).then(() => {
		return true
	}).catch(PreconditionFailedError, error => {
		return Dialog.error(errorMessageId).return(false)
	})
}

/**
 * Shows the buy dialog to enable or disable the whitelabel package.
 * @param enable true if the whitelabel package should be enabled otherwise false.
 * @returns true if the execution was successfull. False if the action has been cancelled by user or the precondition has failed.
 */
export function showWhitelabelBuyDialog(enable: boolean): Promise<boolean> {
	return showBuyDialog(BookingItemFeatureType.Branding, "whitelabelDomainExisting_msg", enable)
}

/**
 * Shows the buy dialog to enable or disable the sharing package.
 * @param enable true if the whitelabel package should be enabled otherwise false.
 * @returns true if the execution was successfull. False if the action has been cancelled by user or the precondition has failed.
 */
export function showSharingBuyDialog(enable: boolean): Promise<boolean> {
	return showBuyDialog(BookingItemFeatureType.Sharing, "sharedCalendarExisting_msg", enable)
}

function showBuyDialog(bookingItemFeatureType: BookingItemFeatureTypeEnum, errorMessageId: TranslationKey, enable: boolean): Promise<boolean> {
	const amount = enable ? 1 : 0
	return showProgressDialog("pleaseWait_msg", BuyDialog.show(bookingItemFeatureType, amount, 0, false))
		.then(accepted => {
			if (accepted) {
				return buy(bookingItemFeatureType, errorMessageId, enable)
			} else {
				return false
			}
		})
}