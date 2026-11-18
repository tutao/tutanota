import m from "mithril"
import { Dialog, DialogType } from "../../../ui/base/Dialog"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { EnvProvider } from "../../../platform-kit/app-env"
import { HtmlEditor } from "../../../ui/editor/HtmlEditor"
import { newPromise } from "../../../platform-kit/utils"
import { insertInlineImageB64ClickHandler } from "../../common/mailFunctionality/SharedMailUtils.js"
import { CustomEmailSignature } from "@tutao/entities/tutanota"
import { getHtmlSanitizer } from "../../common/misc/HtmlSanitizer"
import { TextField } from "../../../ui/base/TextField"
import { PrimaryButton } from "../../../ui/base/buttons/VariantButtons"

EnvProvider.assertMainOrNode()
// signatures can become large, for example if they include a base64 embedded image. we ask for confirmation in such cases
const RECOMMENDED_SIGNATURE_SIZE_LIMIT = 15 * 1024

export function showCustomSignatureEditor(
	existing: CustomEmailSignature | null,
	otherNames: readonly string[],
): Promise<{ name: string; value: string } | null> {
	return newPromise((resolve) => {
		let name = existing?.name ?? ""
		const editor = new HtmlEditor(getHtmlSanitizer())
			.showBorders()
			.setMinHeight(200)
			.setValue(existing?.value ?? "")
			.enableToolbar()
			.setToolbarOptions({
				// Inline images require transporting over IPC boundary and we have not implemented a suitable way yet
				imageButtonClickHandler: EnvProvider.get().isApp() ? null : insertInlineImageB64ClickHandler,
				isNonElevatedBackground: true,
			})

		const onclick = async () => {
			const trimmed = name.trim()
			if (trimmed === "") {
				return Dialog.message("enterName_msg")
			}
			if (otherNames.includes(trimmed)) {
				return Dialog.message("signatureNameExists_msg")
			}
			const value = editor.getValue()
			if (value.length > RECOMMENDED_SIGNATURE_SIZE_LIMIT) {
				const signatureSizeKb = Math.floor(value.length / 1024)
				const confirmed = await Dialog.confirm(lang.getTranslation("largeSignature_msg", { "{1}": signatureSizeKb }))
				if (!confirmed) return
			}
			dialog.close()
			resolve({ name: trimmed, value })
		}

		const dialog = Dialog.showActionDialog({
			title: "userEmailSignature_label",
			type: DialogType.Popup_L,
			child: {
				view: () => [
					m(TextField, {
						label: "signatureName_label",
						value: name,
						oninput: (value) => (name = value),
					}),
					m(".mt-16", m(editor)),
					m(".flex-end.wrap.mt-24.gap-16", m(PrimaryButton, { width: "flex", label: "save_action", onclick })),
				],
			},
			cancelAction: () => resolve(null),
			okAction: null,
		})
	})
}
