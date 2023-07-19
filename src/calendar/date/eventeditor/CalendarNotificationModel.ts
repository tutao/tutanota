import { SendMailModel } from "../../../mail/editor/SendMailModel.js"
import { CalendarNotificationSender } from "../CalendarNotificationSender.js"
import { LoginController } from "../../../api/main/LoginController.js"
import { CalendarEvent } from "../../../api/entities/tutanota/TypeRefs.js"
import { ProgrammingError } from "../../../api/common/error/ProgrammingError.js"
import { AccountType, CalendarAttendeeStatus, FeatureType } from "../../../api/common/TutanotaConstants.js"
import { clone } from "@tutao/tutanota-utils"
import { TooManyRequestsError } from "../../../api/common/error/RestError.js"
import { UserError } from "../../../api/main/UserError.js"
import { isCustomizationEnabledForCustomer } from "../../../api/common/utils/Utils.js"
import { getNonOrganizerAttendees } from "./CalendarEventModel.js"
import { UpgradeRequiredError } from "../../../api/main/UpgradeRequiredError.js"

/** all the people that may be interested in changes to an event get stored in these models.
 * if one of them is null, it's because there is no one that needs that kind of update.
 * */
export type CalendarNotificationSendModels = {
	inviteModel: SendMailModel | null
	updateModel: SendMailModel | null
	cancelModel: SendMailModel | null
	responseModel: SendMailModel | null
}

/** contains the logic to distribute the necessary updates to whom it may concern
 *  and checks the preconditions
 * */
export class CalendarNotificationModel {
	constructor(private readonly notificationSender: CalendarNotificationSender, private readonly loginController: LoginController) {}

	/**
	 * send all notifications required for the new event, determined by the contents of the sendModels parameter.
	 *
	 * will modify the attendee list of newEvent if invites/cancellations are sent.
	 */
	async send(event: CalendarEvent, sendModels: CalendarNotificationSendModels): Promise<void> {
		if (sendModels.updateModel == null && sendModels.cancelModel == null && sendModels.inviteModel == null && sendModels.responseModel == null) {
			return
		}
		if (!(await hasPlanWithInvites(this.loginController))) {
			const { getAvailablePlansWithCalendarInvites } = await import("../../../subscription/SubscriptionUtils.js")
			throw new UpgradeRequiredError("upgradeRequired_msg", await getAvailablePlansWithCalendarInvites())
		}
		const invitePromise = sendModels.inviteModel != null ? this.sendInvites(event, sendModels.inviteModel) : Promise.resolve()
		const cancelPromise = sendModels.cancelModel != null ? this.sendCancellation(event, sendModels.cancelModel) : Promise.resolve()
		const updatePromise = sendModels.updateModel != null ? this.sendUpdates(event, sendModels.updateModel) : Promise.resolve()
		const responsePromise = sendModels.responseModel != null ? this.respondToOrganizer(event, sendModels.responseModel) : Promise.resolve()
		return await Promise.all([invitePromise, cancelPromise, updatePromise, responsePromise]).then()
	}

	/**
	 * invite all new attendees for an event and set their status from "ADDED" to "NEEDS_ACTION"
	 * @param event will be modified if invites are sent.
	 * @param inviteModel
	 * @private
	 */
	private async sendInvites(event: CalendarEvent, inviteModel: SendMailModel): Promise<void> {
		if (event.organizer == null || inviteModel?.allRecipients().length === 0) {
			throw new ProgrammingError("event has no organizer or no invitable attendees, can't send invites.")
		}
		const newAttendees = getNonOrganizerAttendees(event).filter((a) => a.status === CalendarAttendeeStatus.ADDED)
		await inviteModel.waitForResolvedRecipients()
		await this.notificationSender.sendInvite(event, inviteModel)
		for (const attendee of newAttendees) {
			if (attendee.status === CalendarAttendeeStatus.ADDED) {
				attendee.status = CalendarAttendeeStatus.NEEDS_ACTION
			}
		}
	}

	private async sendCancellation(event: CalendarEvent, cancelModel: SendMailModel): Promise<any> {
		const updatedEvent = clone(event)

		try {
			await this.notificationSender.sendCancellation(updatedEvent, cancelModel)
		} catch (e) {
			if (e instanceof TooManyRequestsError) {
				throw new UserError("mailAddressDelay_msg") // This will be caught and open error dialog
			} else {
				throw e
			}
		}
	}

	private async sendUpdates(event: CalendarEvent, updateModel: SendMailModel): Promise<void> {
		await updateModel.waitForResolvedRecipients()
		await this.notificationSender.sendUpdate(event, updateModel)
	}

	/**
	 * send a response mail to the organizer as stated on the original event. calling this for an event that is not an invite or
	 * does not contain address as an attendee or that has no organizer is an error.
	 * @param newEvent the event to send the update for, this should be identical to existingEvent except for the own status.
	 * @param responseModel
	 * @private
	 */
	private async respondToOrganizer(newEvent: CalendarEvent, responseModel: SendMailModel): Promise<void> {
		await responseModel.waitForResolvedRecipients()
		await this.notificationSender.sendResponse(newEvent, responseModel)
		responseModel.dispose()
	}
}

/** determine if we should show the "sending invites is not available for your plan, please upgrade" dialog
 * to the currently logged in user.
 */
export async function hasPlanWithInvites(loginController: LoginController): Promise<boolean> {
	const userController = loginController.getUserController()
	const { user } = userController
	if (user.accountType === AccountType.FREE || user.accountType === AccountType.EXTERNAL) {
		return false
	}

	const customer = await loginController.getUserController().loadCustomer()

	return isCustomizationEnabledForCustomer(customer, FeatureType.PremiumLegacy) || (await userController.getPlanConfig()).eventInvites
}
