import m, { Children, Component, Vnode } from "mithril"
import { TitledCard } from "../../../../../ui/TitledCard"
import { lang } from "../../../../../ui/utils/LanguageViewModel"
import { Icons } from "../../../../../ui/base/icons/Icons"
import { theme } from "../../../../../ui/theme"
import { CancelSubscriptionDialogState } from "../SubscriptionCancellationDialog"

type CancelSubscriptionPageSuccessAttrs = {
	data: CancelSubscriptionDialogState
}

export class CancelSubscriptionSuccessPage implements Component<CancelSubscriptionPageSuccessAttrs> {
	view(vnode: Vnode<CancelSubscriptionPageSuccessAttrs>): Children {
		return m(
			".flex.col.mt-16.mb-16",
			vnode.attrs.data.sourcePage === "cancelSubscriptionPage"
				? m(TitledCard, {
						title: lang.getTranslationText("subscriptionSettingsSuccessPageCancel_title"),
						subTitle: lang.getTranslationText("subscriptionSettingsSuccessPageCancel_subtitle"),
						icon: Icons.SuccessOutline,
						iconOptions: { color: theme.success },
					})
				: m(TitledCard, {
						title: lang.getTranslationText("subscriptionSettingsSuccessPageRevoke_title"),
						subTitle: lang.getTranslationText("subscriptionSettingsSuccessPageRevoke_subtitle"),
						icon: Icons.SuccessOutline,
						iconOptions: { color: theme.success },
					}),
		)
	}
}
