import m, { Component, Vnode } from "mithril"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { TitleSection } from "../../../../ui/TitleSection"
import { Icons } from "../../../../ui/base/icons/Icons"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons.js"
import { Dialog } from "../../../../ui/base/Dialog"
import { ButtonType } from "../../../../ui/base/Button"
import { Keys } from "../../../../ui/utils/KeyboardKeys"
import { Checkbox } from "../../../../ui/base/Checkbox"
import { theme } from "../../../../ui/theme"

export interface DuplicateFilesDialogDecision {
	choice: "cancel" | "keepBoth" | "replace" | "skip"
	applyToAll: boolean
}

export function showDriveDuplicateFileDialog(fileName: string, fileCount: number): Promise<DuplicateFilesDialogDecision> {
	return new Promise((resolve) => {
		const dialog: Dialog = Dialog.editMediumDialog(
			{
				left: [
					{
						type: ButtonType.Secondary,
						click: () => {
							resolve({ choice: "cancel", applyToAll: false })
							dialog.close()
						},
						label: "cancel_action",
						title: "cancel_action",
					},
				],
				middle: lang.makeTranslation("", "Duplicate file names"),
			},
			DriveDuplicateFileDialog,
			{
				fileName,
				fileCount,
				onDecision: (decision: DuplicateFilesDialogDecision) => {
					resolve({ choice: decision.choice, applyToAll: decision.applyToAll })
					dialog.close()
				},
			},
			{ backgroundColor: theme.surface_container },
		)
			.addShortcut({
				key: Keys.ESC,
				exec: () => {
					resolve({ choice: "cancel", applyToAll: false })
					dialog.close()
				},
				help: "close_alt",
			})
			.setCloseHandler(() => {
				resolve({ choice: "cancel", applyToAll: false })
				dialog.close()
			})

		dialog.show()
	})
}

interface DriveDuplicateFileDialogAttrs {
	fileName: string
	fileCount: number
	onDecision: (choice: DuplicateFilesDialogDecision) => void
}

class DriveDuplicateFileDialog implements Component<DriveDuplicateFileDialogAttrs> {
	private applyToAll: boolean = false
	view(vnode: Vnode<DriveDuplicateFileDialogAttrs>) {
		return m(".pt-16.pb-16.flex.col.gap-16", { style: { backgroundColor: theme.surface_container } }, [
			m(TitleSection, {
				title: lang.getTranslationText("conflictDetected_label"),
				subTitle: [m(".normal-font-size", lang.getTranslation("duplicateFileName_msg", { "{fileName}": vnode.attrs.fileName }).text)],
				icon: Icons.DocumentOutline,
			}),
			vnode.attrs.fileCount > 1
				? m(Checkbox, {
						label: () => lang.getTranslationText("applyToAllFiles_label"),
						checked: this.applyToAll,
						onChecked: (value) => {
							this.applyToAll = value
						},
					})
				: null,
			m(PrimaryButton, {
				class: "flex-center row center-vertically",
				label: "skipThisFile_action",
				onclick: () => {
					vnode.attrs.onDecision({ choice: "skip", applyToAll: this.applyToAll })
				},
			}),
			m(PrimaryButton, {
				class: "flex-center row center-vertically",
				label: "replaceFile_action",
				onclick: () => {
					vnode.attrs.onDecision({ choice: "replace", applyToAll: this.applyToAll })
				},
			}),
			m(PrimaryButton, {
				class: "flex-center row center-vertically",
				label: "keepBothFiles_action",
				onclick: () => {
					vnode.attrs.onDecision({ choice: "keepBoth", applyToAll: this.applyToAll })
				},
			}),
		])
	}
}
