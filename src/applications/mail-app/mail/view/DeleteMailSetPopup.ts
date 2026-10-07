import m, { Component, Vnode } from "mithril"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { TitleSection } from "../../../../ui/TitleSection"
import { Icons } from "../../../../ui/base/icons/Icons"
import { theme } from "../../../../ui/theme"
import { PrimaryButton, SecondaryButton } from "../../../../ui/base/buttons/VariantButtons.js"
import { Keys } from "../../../../ui/utils/KeyboardKeys"
import { SectionButton } from "../../../../ui/base/buttons/SectionButton"
import { px, size } from "../../../../ui/size"
import { MultiPageDialog } from "../../../../ui/dialogs/MultiPageDialog"
import { ButtonType } from "../../../../ui/base/Button"
import { windowFacade } from "../../../common/misc/WindowFacade"
import { Card } from "../../../../ui/base/Card"

export function showDeleteFolderPopup(mailSetName: string, affectedInboxRuleNames: string[], messageType: "spam" | "trash" | "delete"): Promise<boolean> {
	return new Promise((resolve) => {
		const title = lang.getTranslationText(
			messageType === "spam" ? "confirmSpamAction_label" : messageType === "trash" ? "confirmTrashAction_label" : "confirmDeleteAction_label",
		)
		// 32 = 2*16px padding, and 16 to allow for an extra line of text
		const titleBarHeight = (messageType === "delete" ? 158 : 220) + 32 + 16
		// 64 = 48 (height) + 16 (gap)
		const inboxRuleSectionButtonHeight = affectedInboxRuleNames.length > 0 ? 64 : 0
		const cancelOrDeleteButtonsHeight = 64

		const dialog = new MultiPageDialog<"home" | "affectedInboxRules">(
			"home",
			(dialog, navigateToPage, goBack) => ({
				home: {
					title,
					content: m(DeleteMailSetDialog, {
						mailSetName,
						affectedInboxRuleCount: affectedInboxRuleNames.length,
						deletionChoice: (continueDeletion: boolean) => {
							resolve(continueDeletion)
							dialog.close()
						},
						messageType,
						inspectInboxRules: () => {
							navigateToPage("affectedInboxRules")
						},
					}),
				},
				affectedInboxRules: {
					title,
					content: m(InspectAffectedInboxRulesDialog, {
						mailSetName,
						affectedInboxRuleNames,
					}),
					leftAction: { type: ButtonType.Secondary, click: () => goBack(), label: "back_action", title: "back_action" },
				},
			}),
			windowFacade,
			// affectedInboxRules page height is assigned to value that was calculated for home page
			titleBarHeight + inboxRuleSectionButtonHeight + cancelOrDeleteButtonsHeight,
		)
			.getDialog()
			.addShortcut({
				key: Keys.ESC,
				exec: () => {
					resolve(false)
					dialog.close()
				},
				help: "close_alt",
			})
			.setCloseHandler(() => {
				resolve(false)
				dialog.close()
			})

		dialog.show()
	})
}

interface DeleteMailSetDialogAttrs {
	mailSetName: string
	affectedInboxRuleCount: number
	deletionChoice: (continueDeletion: boolean) => void
	messageType: "spam" | "trash" | "delete"
	inspectInboxRules: () => void
}

class DeleteMailSetDialog implements Component<DeleteMailSetDialogAttrs> {
	view({ attrs }: Vnode<DeleteMailSetDialogAttrs>) {
		return m(".pt-16.pb-16.flex.col.gap-16", { style: { backgroundColor: theme.surface_container } }, [
			m(TitleSection, {
				title: "",
				subTitle: lang.getTranslation(
					attrs.messageType === "spam"
						? "confirmSpamCustomFolder_msg"
						: attrs.messageType === "trash"
							? "confirmDeleteCustomFolder_msg"
							: "confirmDelete_msg",
					{ "{1}": attrs.mailSetName },
				).text,
				icon: Icons.ExclamationOutline,
				iconOptions: { color: theme.error },
			}),
			attrs.affectedInboxRuleCount > 0
				? m(SectionButton, {
						leftIcon: { icon: Icons.FunnelFilled, title: "inboxRulesSettings_action" },
						text: lang.getTranslation("affectedInboxRules_msg", { "{1}": attrs.affectedInboxRuleCount }),
						onclick: attrs.inspectInboxRules,
						style: {
							minHeight: px(size.core_48),
						},
						cardStyle: {
							padding: px(size.spacing_12),
						},
					})
				: null,
			m(".flex.row.gap-8", [
				m(SecondaryButton, {
					class: "flex-grow center-vertically",
					label: "cancel_action",
					onclick: () => {
						attrs.deletionChoice(false)
					},
				}),
				m(PrimaryButton, {
					class: "flex-grow center-vertically",
					label: "delete_action",
					onclick: () => {
						attrs.deletionChoice(true)
					},
				}),
			]),
		])
	}
}

interface InspectAffectedInboxRulesDialogAttrs {
	mailSetName: string
	affectedInboxRuleNames: string[]
}
class InspectAffectedInboxRulesDialog implements Component<InspectAffectedInboxRulesDialogAttrs> {
	view({ attrs }: Vnode<InspectAffectedInboxRulesDialogAttrs>) {
		return m(".pt-16.pb-16.flex.col.gap-16", { style: { backgroundColor: theme.surface_container } }, [
			m(TitleSection, {
				title: "",
				subTitle: lang.getTranslation("invalidateInboxRulesUsingDeletedMailSet_msg", { "{1}": attrs.mailSetName }).text,
				icon: Icons.ExclamationOutline,
				iconOptions: { color: theme.error },
			}),
			...attrs.affectedInboxRuleNames.map((name) => m(Card, name)),
		])
	}
}
