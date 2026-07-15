import m, { Children, Component, Vnode } from "mithril"
import { Thunk } from "@tutao/utils"
import { TitleSection } from "../../../../../ui/TitleSection"
import { Icons } from "../../../../../ui/base/icons/Icons"
import { lang } from "../../../../../ui/utils/LanguageViewModel"
import { PrimaryButton } from "../../../../../ui/base/buttons/VariantButtons"
import { Card } from "../../../../../ui/base/Card"
import { MenuTitle } from "../../../../../ui/titles/MenuTitle"

type CancelSubscriptionOptionPageAttrs = {
	goToRevokeSubscriptionPage: Thunk
	goToCancelSubscriptionPage: Thunk
}
export class CancelSubscriptionOptionPage implements Component<CancelSubscriptionOptionPageAttrs> {
	view(vnode: Vnode<CancelSubscriptionOptionPageAttrs>): Children {
		return m(
			".flex.col.gap-16.mt-16.mb-16",
			m(TitleSection, {
				icon: Icons.TrophyOutline,
				title: lang.getTranslationText("subscriptionStateCardCancel_action"),
				subTitle: lang.getTranslationText("subscriptionSettingOptionPage_subtitle"),
			}),
			m(
				".flex.col.gap-8",
				m(MenuTitle, { content: lang.getTranslationText("subscriptionStateCardCancel_action") }),
				m(
					Card,
					m(
						".flex.col.gap-8.p-16",
						m("", lang.getTranslationText("subscriptionSettingOptionPageCancel_label")),
						m(
							".flex.row.justify-end",
							m(PrimaryButton, {
								label: "subscriptionStateCardCancel_action",
								width: "flex",
								style: { width: "fit-content" },
								onclick: vnode.attrs.goToCancelSubscriptionPage,
							}),
						),
					),
				),
				m(MenuTitle, { content: lang.getTranslationText("subscriptionStateCardRevoke_action") }),
				m(
					Card,
					m(
						".flex.col.gap-8.p-16",
						m("", lang.getTranslationText("subscriptionSettingOptionPageRevoke_label")),
						m(
							".flex.row.justify-end",
							m(PrimaryButton, {
								label: "subscriptionSettingOptionPageRevoke_action",
								width: "flex",
								style: { width: "fit-content" },
								onclick: vnode.attrs.goToRevokeSubscriptionPage,
							}),
						),
					),
				),
			),
		)
	}
}
