import m, { Component, Vnode } from "mithril"
import { lang } from "../../../common/misc/LanguageViewModel"
import { TitleSection } from "../../../common/gui/TitleSection"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { theme } from "../../../common/gui/theme"
import { Card } from "../../../common/gui/base/Card"
import { LoginButton } from "../../../common/gui/base/buttons/LoginButton"
import { Icon, IconSize } from "../../../common/gui/base/Icon"
import { Dialog } from "../../../common/gui/base/Dialog"
import { ButtonType } from "../../../common/gui/base/Button"
import { Keys } from "../../../common/api/common/TutanotaConstants"

export function showOverwriteRemoteDraftDialog(updatedAt: number): Promise<"cancel" | "overwrite" | "discard"> {
	return new Promise((resolve) => {
		const dialog: Dialog = Dialog.editMediumDialog(
			{
				right: [
					{
						type: ButtonType.Secondary,
						click: () => {
							resolve("cancel")
							dialog.close()
						},
						label: "close_alt",
						title: "close_alt",
					},
				],
				middle: "draft_label",
			},
			OverwriteRemoteDraftDialog,
			{
				mailRemotelyUpdatedAt: updatedAt,
				overwriteChoice: (overwrite: "overwrite" | "discard") => {
					resolve(overwrite)
					dialog.close()
				},
			},
		)
			.addShortcut({
				key: Keys.ESC,
				exec: () => {
					resolve("cancel")
					dialog.close()
				},
				help: "close_alt",
			})
			.setCloseHandler(() => {
				resolve("cancel")
				dialog.close()
			})

		dialog.show()
	})
}

interface OverwriteRemoteDraftDialogAttrs {
	mailRemotelyUpdatedAt: number
	overwriteChoice: (overwrite: "overwrite" | "discard") => void
}

class OverwriteRemoteDraftDialog implements Component<OverwriteRemoteDraftDialogAttrs> {
	view(vnode: Vnode<OverwriteRemoteDraftDialogAttrs>) {
		return m(".pt-16.pb-16.flex.col.gap-16", [
			m(TitleSection, {
				title: lang.get("conflictDetected_label"),
				subTitle: [
					m(".normal-font-size", lang.get("remoteDraftVersion_msg")),
					m(".normal-font-size.b", lang.formats.dateTime.format(vnode.attrs.mailRemotelyUpdatedAt)),
				],
				icon: Icons.AlertCircleOutline,
				iconOptions: { color: theme.error },
			}),
			m(Card, m(".plr-12.flex.flex-column.gap-16.center", lang.get("confirmOverwriteServerDraft_msg"))),
			m(LoginButton, {
				class: "flex-center row center-vertically",
				label: "yes_label",
				onclick: () => {
					vnode.attrs.overwriteChoice("overwrite")
				},
				icon: m(Icon, {
					icon: Icons.XCheckmark,
					size: IconSize.PX20,
					class: "mr-8 flex-center",
					style: {
						fill: theme.on_primary,
					},
				}),
			}),
			m(LoginButton, {
				class: "flex-center row center-vertically",
				label: "no_label",
				onclick: () => {
					vnode.attrs.overwriteChoice("discard")
				},
				icon: m(Icon, {
					icon: Icons.XCross,
					size: IconSize.PX20,
					class: "mr-8 flex-center",
					style: {
						fill: theme.on_primary,
					},
				}),
			}),
		])
	}
}

export function showOverwriteDraftDialog(): Promise<"cancel" | "discard"> {
	return new Promise((resolve) => {
		const dialog: Dialog = Dialog.editMediumDialog(
			{
				middle: "draft_label",
			},
			OverwriteDraftDialog,
			{
				overwriteChoice: (overwrite: "discard" | "cancel") => {
					resolve(overwrite)
					dialog.close()
				},
			},
		)
			.addShortcut({
				key: Keys.ESC,
				exec: () => {
					resolve("cancel")
					dialog.close()
				},
				help: "close_alt",
			})
			.setCloseHandler(() => {
				resolve("cancel")
				dialog.close()
			})

		dialog.show()
	})
}

interface OverwriteDraftDialogAttrs {
	overwriteChoice: (overwrite: "discard" | "cancel") => void
}

class OverwriteDraftDialog implements Component<OverwriteDraftDialogAttrs> {
	view(vnode: Vnode<OverwriteDraftDialogAttrs>) {
		return m(".pt-16.pb-16.flex.col.gap-16", [
			m(TitleSection, {
				title: lang.get("confirmCreateNewDraftOverAutosavedDraft_msg"),
				subTitle: null,
				icon: Icons.AlertCircleOutline,
				iconOptions: { color: theme.error },
			}),
			m(LoginButton, {
				class: "flex-center row center-vertically",
				label: "discardDraft_action",
				onclick: () => {
					vnode.attrs.overwriteChoice("discard")
				},
			}),
			m(LoginButton, {
				class: "flex-center row center-vertically",
				label: "cancel_action",
				onclick: () => {
					vnode.attrs.overwriteChoice("cancel")
				},
			}),
		])
	}
}
