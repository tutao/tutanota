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


/**
 * Shows the buy dialog to enable or disable the whitelabel package.
 * @param enable true if the whitelabel package should be enabled otherwise false.
 * @returns true if the execution was successfull. False if the action has been cancelled by user or the precondition has failed.
 */
export function show(enable: boolean): Promise<boolean> {
	const amount = enable ? 1 : 0
	return showProgressDialog("pleaseWait_msg", BuyDialog.show(BookingItemFeatureType.Branding, amount, 0, false)).then(accepted => {
		if (accepted) {
			const bookingData = createBookingServiceData()
			bookingData.amount = amount.toString()
			bookingData.featureType = BookingItemFeatureType.Branding
			bookingData.date = Const.CURRENT_DATE
			return serviceRequestVoid(SysService.BookingService, HttpMethod.POST, bookingData).then(() => {
				return true
			}).catch(PreconditionFailedError, error => {
				return Dialog.error("whitelabelDomainExisting_msg").return(false)
			})
		} else {
			return false
		}
	})
}