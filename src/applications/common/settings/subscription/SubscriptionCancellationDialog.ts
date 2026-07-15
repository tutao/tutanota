import { RevocationRequestError } from "../../revocation/RevocationViewModel"

import { MultiPageDialog } from "../../../../ui/dialogs/MultiPageDialog"
import { windowFacade } from "../../misc/WindowFacade"
import { ButtonType } from "../../../../ui/base/Button"
import { CancelSubscriptionOptionPage } from "./dialogpages/CancelSubscriptionOptionPage"
import { CancelSubscriptionPage } from "./dialogpages/CancelSubscriptionPage"
import { RevokeSubscriptionPage } from "./dialogpages/RevokeSubscriptionPage"
import { CancelSubscriptionErrorPage } from "./dialogpages/CancelSubscriptionErrorPage"
import { CancelSubscriptionSuccessPage } from "./dialogpages/CancelSubscriptionSuccessPage"
import m from "mithril"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { Booking } from "@tutao/entities/sys"

export type CancelSubscriptionPages =
	| "cancelSubscriptionOptionPage"
	| "cancelSubscriptionPage"
	| "revokeSubscriptionPage"
	| "cancelSubscriptionSuccessPage"
	| "cancelSubscriptionErrorPage"

export interface CancelSubscriptionDialogState {
	sourcePage: CancelSubscriptionPages
	periodEndDate: Date | null
	latestError?: RevocationRequestError
}
/*
 * Dialog for showing the cancellation of the current subscription
 * Has five pages that can be shown:
 * cancelSubscriptionOptionPage: Page to choose between cancel contract or revoke contract. Revocation is only possible
 * within the first 14 days of the initial booking. Can navigate to cancelSubscriptionPage and revokeSubscriptionPage
 * cancelSubscriptionOptionPage: Page to cancel subscription. Calls the RenewalPreferenceService and sets the renewal
 * of the subscription to false. Can navigate to cancelSubscriptionSuccessPage and cancelSubscriptionErrorPage
 * revokeSubscriptionPage: Page to revoke subscription. Calls the SubscriptionRevocationService.
 * Can navigate to cancelSubscriptionSuccessPage and cancelSubscriptionErrorPage
 * cancelSubscriptionSuccessPage: If everything goes well. Only possible to close the dialog from here
 * cancelSubscriptionErrorPage: If there is an error it will be shown here. Only possible to close the dialog from here
 */
export async function showSubscriptionCancellationDialog(booking: Booking): Promise<void> {
	const data: CancelSubscriptionDialogState = {
		sourcePage: "cancelSubscriptionPage",
		periodEndDate: booking.endDate,
	}

	const maxRevokeDate = new Date(booking.createDate)
	maxRevokeDate.setDate(maxRevokeDate.getDate() + 14)
	const isInRefundPeriod = new Date() < maxRevokeDate

	const dialog = new MultiPageDialog<CancelSubscriptionPages>(
		//Starting page depends on current revocation eligibility
		isInRefundPeriod ? "cancelSubscriptionOptionPage" : "cancelSubscriptionPage",

		(dialog, navigateToPage, goBack) => ({
			//--choose option page--\\
			cancelSubscriptionOptionPage: {
				content: m(CancelSubscriptionOptionPage, {
					goToCancelSubscriptionPage: () => navigateToPage("cancelSubscriptionPage"),
					goToRevokeSubscriptionPage: () => navigateToPage("revokeSubscriptionPage"),
				}),
				title: lang.getTranslationText("subscriptionStateCardCancel_action"),
				leftAction: {
					type: ButtonType.Secondary,
					click: () => dialog.close(),
					label: "close_alt",
					title: "close_alt",
				},
			},

			//--Cancel subscription page--\\
			cancelSubscriptionPage: {
				content: m(CancelSubscriptionPage, {
					data,
					onSuccess: () => {
						navigateToPage("cancelSubscriptionSuccessPage")
					},
					onError: () => {
						navigateToPage("cancelSubscriptionErrorPage")
					},
				}),
				title: lang.getTranslationText("subscriptionStateCardCancel_action"),
				//Render close button left if not legible for revocation
				//Do not render it while in period
				leftAction: isInRefundPeriod
					? {
							type: ButtonType.Secondary,
							click: () => goBack("cancelSubscriptionOptionPage"),
							label: "back_action",
							title: "back_action",
						}
					: {
							type: ButtonType.Secondary,
							click: () => dialog.close(),
							label: "close_alt",
							title: "close_alt",
						},
			},

			//--Revoke subscription page--\\
			revokeSubscriptionPage: {
				content: m(RevokeSubscriptionPage, {
					data,
					onSuccess: () => {
						navigateToPage("cancelSubscriptionSuccessPage")
					},
					onError: () => {
						navigateToPage("cancelSubscriptionErrorPage")
					},
				}),
				title: lang.getTranslationText("subscriptionStateCardCancel_action"),
				leftAction: {
					type: ButtonType.Secondary,
					click: () => goBack("cancelSubscriptionOptionPage"),
					label: "back_action",
					title: "back_action",
				},
			},

			//--Error page--\\
			cancelSubscriptionErrorPage: {
				content: m(CancelSubscriptionErrorPage, {
					data,
					onClose: () => dialog.close(),
				}),
				title: lang.getTranslationText("subscriptionStateCardCancel_action"),
				leftAction: {
					type: ButtonType.Secondary,
					click: () => dialog.close(),
					label: "close_alt",
					title: "close_alt",
				},
			},

			//--Success page--\\
			cancelSubscriptionSuccessPage: {
				content: m(CancelSubscriptionSuccessPage, {
					data,
					onClose: () => dialog.close(),
				}),
				title: lang.getTranslationText("subscriptionStateCardCancel_action"),
				leftAction: {
					type: ButtonType.Secondary,
					click: () => dialog.close(),
					label: "close_alt",
					title: "close_alt",
				},
			},
		}),
		windowFacade,
	).getDialog()
	dialog.show()
}
