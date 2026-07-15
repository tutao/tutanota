import { Thunk } from "@tutao/utils"
import m, { Children, Component, Vnode } from "mithril"
import { TitleSection } from "../../../../../ui/TitleSection"
import { InfoLink, lang } from "../../../../../ui/utils/LanguageViewModel"
import { Icons } from "../../../../../ui/base/icons/Icons"
import { theme } from "../../../../../ui/theme"
import { CancelSubscriptionDialogState } from "../SubscriptionCancellationDialog"

type CancelSubscriptionPageErrorAttrs = {
	onClose: Thunk
	data: CancelSubscriptionDialogState
}

export class CancelSubscriptionErrorPage implements Component<CancelSubscriptionPageErrorAttrs> {
	view(vnode: Vnode<CancelSubscriptionPageErrorAttrs>): Children {
		return m(
			".flex.col.mt-16.mb-16",
			vnode.attrs.data.sourcePage === "cancelSubscriptionPage"
				? m(TitleSection, {
						title: lang.getTranslationText("subscriptionSettingsErrorPageCancel_title"),
						subTitle: this.handleErrorMessage(vnode.attrs),
						icon: Icons.FailureFilled,
						iconOptions: { color: theme.error },
					})
				: m(TitleSection, {
						title: lang.getTranslationText("subscriptionSettingsErrorPageRevoke_title"),
						subTitle: this.handleErrorMessage(vnode.attrs),
						icon: Icons.FailureFilled,
						iconOptions: { color: theme.error },
					}),
		)
	}

	handleErrorMessage(attrs: CancelSubscriptionPageErrorAttrs): string {
		switch (attrs.data.latestError) {
			case "alreadyRevoked":
				return lang.getTranslationText("revocationAlreadySubmitted_msg")
			case "noActiveSubscription":
				return lang.getTranslationText("terminationNoActiveSubscription_msg") // message is generic enough to work for both termination and revocation requests
			case "hasAppStoreSubscription":
				return lang.getTranslation("deleteAccountWithAppStoreSubscription_msg", { "{AppStorePayment}": InfoLink.AppStorePayment }).text
			case "olderThanTwoWeeks":
				return lang.getTranslationText("revocationPeriodEnded_msg")
			case "noPersonalPlan":
				return lang.getTranslationText("revocationOnlyPersonalPlans_msg")
			default:
				throw attrs.data.latestError
		}
	}
}
