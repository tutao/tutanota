import m, { Children, Component, Vnode } from "mithril"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { Card } from "../../../../ui/base/Card"
import { MenuTitle } from "../../../../ui/titles/MenuTitle"
import { SubscriptionStateCell, SubscriptionStateCellAttrs } from "./SubscriptionStateCell"

export type SubscriptionStatus = "active" | "expired" | "revoked" | "planned" | "cancelled" | "unknown"

export interface SubscriptionStateCardAttrs {
	title: TranslationKey
	cells: Array<SubscriptionStateCellAttrs | null>
}
/*
 * Shows the current state of a subscription
 * @param title - Title on top of the state card.
 * @param cells - Cells that should be shown in the card. Must be type of SubscriptionStateCellAttrs.
 */
export class SubscriptionStateCard implements Component<SubscriptionStateCardAttrs> {
	view({ attrs }: Vnode<SubscriptionStateCardAttrs>) {
		return m(
			".flex.col.gap-16",
			m(MenuTitle, {
				content: lang.getTranslationText(attrs.title),
			}),
			m(
				Card,
				m(
					".grid.gap-8.subscription-settings-card",
					attrs.cells.map((a) => a && m(SubscriptionStateCell, a)),
				),
			),
		)
	}
}
