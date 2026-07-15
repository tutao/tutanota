import m, { Children, Component, Vnode } from "mithril"
import { TitleSection } from "../../../../../ui/TitleSection"
import { Icons } from "../../../../../ui/base/icons/Icons"
import { lang } from "../../../../../ui/utils/LanguageViewModel"
import { Card } from "../../../../../ui/base/Card"
import { PrimaryButton } from "../../../../../ui/base/buttons/VariantButtons"
import { Thunk } from "@tutao/utils"
import { createSubscriptionRevocationServicePostIn, SubscriptionRevocationService } from "@tutao/entities/sys"
import { PreconditionFailedError } from "@tutao/rest-client/error"
import { locator } from "../../../api/main/CommonLocator"
import { RevocationRequestError } from "../../../revocation/RevocationViewModel"
import { CancelSubscriptionDialogState } from "../SubscriptionCancellationDialog"
import { showProgressDialog } from "../../../../../ui/dialogs/ProgressDialog"

type RevokeSubscriptionPageAttrs = {
	onSuccess: Thunk
	onError: Thunk
	data: CancelSubscriptionDialogState
}
export class RevokeSubscriptionPage implements Component<RevokeSubscriptionPageAttrs> {
	view(vnode: Vnode<RevokeSubscriptionPageAttrs>): Children {
		return m(
			".flex.col.gap-16.mt-16.mb-16",
			m(TitleSection, {
				icon: Icons.TrophyOutline,
				title: lang.getTranslationText("subscriptionStateCardRevoke_action"),
				subTitle: "",
			}),
			m(
				".flex.col.gap-8.subscription-explanation",
				m(Card, m("", m.trust(lang.getTranslationText("subscriptionSettingRevokePageExplanation_msg")))),
				m(
					".flex.row.justify-end",
					m(PrimaryButton, {
						label: "subscriptionStateCardRevoke_action",
						width: "flex",
						style: { width: "fit-content" },
						onclick: async () => {
							await this.handleRevocationClick(vnode.attrs)
						},
					}),
				),
			),
		)
	}

	async handleRevocationClick(attrs: RevokeSubscriptionPageAttrs) {
		try {
			const inputData = createSubscriptionRevocationServicePostIn({ surveyData: null })
			await showProgressDialog("pleaseWait_msg", locator.serviceExecutor.post(SubscriptionRevocationService, inputData, null))
			attrs.data.sourcePage = "revokeSubscriptionPage"
			attrs.onSuccess()
		} catch (e) {
			if (e instanceof PreconditionFailedError) {
				attrs.data.latestError = e.data as RevocationRequestError
				attrs.onError()
			} else {
				throw e
			}
		}
	}
}
