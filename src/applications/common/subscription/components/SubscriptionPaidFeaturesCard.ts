import m, { Component, Vnode } from "mithril"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { PlanType } from "../../../../entities/sys/Utils"
import { Card } from "../../../../ui/base/Card"
import { Icons } from "../../../../ui/base/icons/Icons"
import { InfoIcon } from "../../../../ui/base/InfoIcon"
import { IconButton } from "../../../../ui/base/IconButton"
import { MenuTitle } from "../../../../ui/titles/MenuTitle"
import { px } from "../../../../ui/size"

const paidFeatures = [
	{
		//Extra email addresses
		label: "subscriptionSettingAliasPaidFeature_label",
		message: "subscriptionSettingAliasPaidFeature_msg",
		route: "/settings/mail",
	},
	{
		//Inbox rules
		label: "subscriptionSettingInboxPaidFeature_label",
		message: "subscriptionSettingInboxPaidFeature_msg",
		route: "/settings/mail",
	},
	{
		//Calendar
		label: "subscriptionSettingCalendarsPaidFeature_label",
		message: "subscriptionSettingCalendarsPaidFeature_msg",
		route: "/calendar",
	},
	{
		//Label
		label: "subscriptionSettingLabelPaidFeature_label",
		message: "subscriptionSettingLabelPaidFeature_msg",
	},
	{
		//Custom Domains
		label: "subscriptionSettingDomainPaidFeature_label",
		message: "subscriptionSettingDomainPaidFeature_msg",
		route: "/settings/global",
	},
	{
		//Autoresponder
		label: "subscriptionSettingResponderFeature_label",
		message: "subscriptionSettingResponderFeature_msg",
		route: "/settings/mail",
	},
	{
		//White label
		label: "subscriptionSettingWhitelabelFeature_label",
		message: "subscriptionSettingWhitelabelFeature_msg",
		route: "/settings/whitelabel",
	},
	{
		//Additional users
		label: "subscriptionSettingUsersFeature_label",
		message: "subscriptionSettingUsersFeature_msg",
		route: "/settings/users",
	},
	{
		//Storage
		label: "subscriptionSettingStorageFeature_label",
		message: "subscriptionSettingStorageFeature_msg",
	},
] satisfies {
	label: TranslationKey
	message: TranslationKey
	route?: string
}[]

interface SubscriptionPaidFeaturesCardAttrs {
	plan?: PlanType
	title: TranslationKey
	subtitle: TranslationKey
}

/** Card to show all features that have to be disabled before downgrading to free
 * Right now it's static and shows all features regardless the subscription and what the user
 * actually uses, but hopefully it will be dynamic soon
 */
export class SubscriptionPaidFeaturesCard implements Component<SubscriptionPaidFeaturesCardAttrs> {
	view({ attrs }: Vnode<SubscriptionPaidFeaturesCardAttrs>) {
		const element = (label: TranslationKey, infoMessage: TranslationKey, route?: string) => {
			return m(".flex.items-center.justify-between", [
				m("", m("", lang.getTranslationText(label))),
				m(
					".flex.row",
					{
						style: {
							//Set min height if no route icon rendered (route icon has a height of 44px)
							minHeight: px(44),
						},
					},
					m(
						".flex.row.items-center.gap-16",
						{
							//Set min width if no route icon rendered (44(width route icon)+16(gap)+16(padding))
							style: { minWidth: px(76) },
						},
						m(InfoIcon, {
							text: lang.getTranslationText(infoMessage),
						}),
						route &&
							m(IconButton, {
								title: "goToSetting_label",
								icon: Icons.OpenOutline,
								click: () => m.route.set(route),
							}),
					),
				),
			])
		}

		return [
			m(
				".flex.col.gap-16.pt-16",
				m(MenuTitle, { content: lang.getTranslationText(attrs.title) }),
				m("", lang.getTranslationText(attrs.subtitle)),
				m(Card, [m(".flex.col.gap-8.plr-16", [paidFeatures.map(({ label, message, route }) => element(label, message, route))])]),
			),
		]
	}
}
