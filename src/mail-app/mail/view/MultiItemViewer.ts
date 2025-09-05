import m, { Component, Vnode } from "mithril"
import { assertMainOrNode } from "../../../common/api/common/Env"
import ColumnEmptyMessageBox from "../../../common/gui/base/ColumnEmptyMessageBox"
import { lang, Translation, MaybeTranslation } from "../../../common/misc/LanguageViewModel"
import { BootIcons } from "../../../common/gui/base/icons/BootIcons"
import { theme } from "../../../common/gui/theme"
import type { Mail } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { Button, ButtonType } from "../../../common/gui/base/Button.js"
import { progressIcon } from "../../../common/gui/base/Icon.js"

assertMainOrNode()

export type MultiItemViewerAttrs<T> = {
	selectedEntities: readonly T[]
	selectNone: () => unknown
	loadingAll: "can_load" | "loading" | "loaded"
	loadAll: () => unknown
	stopLoadAll: () => unknown
	getSelectionMessage: (entities: ReadonlyArray<T>) => MaybeTranslation
}

export class MultiItemViewer<T> implements Component<MultiItemViewerAttrs<T>> {
	view({ attrs }: Vnode<MultiItemViewerAttrs<T>>) {
		const { selectedEntities } = attrs
		return [
			m(
				".flex.col.fill-absolute",
				m(
					".flex-grow.rel.overflow-hidden",
					m(ColumnEmptyMessageBox, {
						message: attrs.getSelectionMessage(selectedEntities),
						icon: BootIcons.Mail,
						color: theme.on_surface_variant,
						backgroundColor: theme.surface_container,
						bottomContent: this.renderEmptyMessageButtons(attrs),
					}),
				),
			),
		]
	}

	private renderEmptyMessageButtons({ loadingAll, stopLoadAll, selectedEntities, selectNone, loadAll }: MultiItemViewerAttrs<T>) {
		return loadingAll === "loading"
			? m(".flex.items-center", [
					m(Button, {
						label: "cancel_action",
						type: ButtonType.Secondary,
						click: () => {
							stopLoadAll()
						},
					}),
					m(".flex.items-center.plr-8", progressIcon()),
				])
			: selectedEntities.length === 0
				? null
				: m(".flex", [
						m(Button, {
							label: "cancel_action",
							type: ButtonType.Secondary,
							click: () => {
								selectNone()
							},
						}),
						loadingAll === "can_load"
							? m(Button, {
									label: "loadAll_action",
									type: ButtonType.Secondary,
									click: () => {
										loadAll()
									},
								})
							: null,
					])
	}
}

export function getMailSelectionMessage(selectedEntities: ReadonlyArray<Mail>): Translation {
	let nbrOfSelectedMails = selectedEntities.length

	if (nbrOfSelectedMails === 0) {
		return lang.getTranslation("noMail_msg")
	} else if (nbrOfSelectedMails === 1) {
		return lang.getTranslation("oneMailSelected_msg")
	} else {
		return lang.getTranslation("nbrOfMailsSelected_msg", {
			"{1}": nbrOfSelectedMails,
		})
	}
}
