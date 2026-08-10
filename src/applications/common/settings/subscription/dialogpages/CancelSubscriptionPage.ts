import m, { Children, Component, Vnode } from "mithril"
import { TitleSection } from "../../../../../ui/TitleSection"
import { Icons } from "../../../../../ui/base/icons/Icons"
import { lang } from "../../../../../ui/utils/LanguageViewModel"
import { Card } from "../../../../../ui/base/Card"
import { PrimaryButton } from "../../../../../ui/base/buttons/VariantButtons"
import { assertNotNull, Thunk } from "@tutao/utils"
import { locator } from "../../../api/main/CommonLocator"
import { createRenewalPreferenceServicePostIn, RenewalPreferenceService } from "@tutao/entities/sys"
import { CancelSubscriptionDialogState } from "../SubscriptionCancellationDialog"
import { showProgressDialog } from "../../../../../ui/dialogs/ProgressDialog"
import { formatDate } from "../../../../../ui/utils/Formatter"

type CancelSubscriptionPageAttrs = {
	onSuccess: Thunk
	onError: Thunk
	data: CancelSubscriptionDialogState
}

export class CancelSubscriptionPage implements Component<CancelSubscriptionPageAttrs> {
	view(vnode: Vnode<CancelSubscriptionPageAttrs>): Children {
		return [
			m(
				".flex.col.gap-16.mt-16.mb-16",
				m(TitleSection, {
					icon: Icons.TrophyOutline,
					title: lang.getTranslationText("subscriptionStateCardCancel_action"),
					subTitle: "",
				}),
				m(
					".flex.col.gap-8",
					m(
						Card,
						m(
							".gap-8.subscription-explanation",
							m.trust(
								lang.getTranslation("subscriptionSettingCancelPageExplanation_msg", {
									"{date}": vnode.attrs.data.periodEndDate === null ? "undefined" : formatDate(vnode.attrs.data.periodEndDate),
								}).text,
							),
						),
					),
					m(
						".flex.row.justify-end",
						m(PrimaryButton, {
							label: "subscriptionStateCardCancel_action",
							width: "flex",
							style: { width: "fit-content" },
							onclick: async () => {
								await this.handleCancelClick(vnode.attrs)
							},
						}),
					),
				),
			),
		]
	}
	async handleCancelClick(attrs: CancelSubscriptionPageAttrs) {
		const customerId = assertNotNull(locator.logins.getUserController().user.customer)
		const inputData = {
			isEnabled: false,
			customerId: customerId,
		}
		try {
			const data = createRenewalPreferenceServicePostIn(inputData)
			await showProgressDialog("pleaseWait_msg", locator.serviceExecutor.post(RenewalPreferenceService, data, null))
			attrs.data.sourcePage = "cancelSubscriptionPage"
			attrs.onSuccess()
			m.redraw()
		} catch (e) {
			attrs.onError()
		}
	}
}
