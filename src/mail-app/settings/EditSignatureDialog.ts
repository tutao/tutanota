import m from "mithril"
import { Dialog, DialogType } from "../../common/gui/base/Dialog"
import { lang } from "../../common/misc/LanguageViewModel"
import { EmailSignatureType, FeatureType } from "../../common/api/common/TutanotaConstants"
import { HtmlEditor } from "../../common/gui/editor/HtmlEditor"
import type { TutanotaProperties } from "../../common/api/entities/tutanota/TypeRefs.js"
import { PayloadTooLargeError } from "../../common/api/common/error/RestError"
import { showProgressDialog } from "../../common/gui/dialogs/ProgressDialog"
import { neverNull, ofClass } from "@tutao/tutanota-utils"
import { locator } from "../../common/api/main/CommonLocator"
import { assertMainOrNode } from "../../common/api/common/Env"
import { DropDownSelector } from "../../common/gui/base/DropDownSelector.js"
import { insertInlineImageB64ClickHandler } from "../../common/mailFunctionality/SharedMailUtils.js"

assertMainOrNode()
// signatures can become large, for example if they include a base64 embedded image. we ask for confirmation in such cases
const RECOMMENDED_SIGNATURE_SIZE_LIMIT = 15 * 1024

export function show(props: TutanotaProperties) {
	import("../mail/signature/Signature").then(({ getDefaultSignature }) => {
		const defaultSignature = getDefaultSignature()
		let currentCustomSignature = locator.logins.getUserController().props.customEmailSignature

		if (currentCustomSignature === "" && !locator.logins.isEnabled(FeatureType.DisableDefaultSignature)) {
			currentCustomSignature = defaultSignature
		}

		let selectedType = locator.logins.getUserController().props.emailSignatureType as EmailSignatureType
		const editor = new HtmlEditor("preview_label")
			.showBorders()
			.setMinHeight(200)
			.setValue(getSignature(selectedType, defaultSignature, currentCustomSignature))
			.enableToolbar()
			.setToolbarOptions({
				imageButtonClickHandler: insertInlineImageB64ClickHandler,
			})
			.setEnabled(selectedType === EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM)

		const signatureTypes = getSignatureTypes(props)

		const form = {
			view: () => {
				return [
					m(DropDownSelector, {
						label: "userEmailSignature_label",
						items: signatureTypes,
						selectedValue: selectedType,
						selectionChangedHandler: (type: EmailSignatureType) => {
							if (selectedType === EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM) {
								currentCustomSignature = editor.getValue()
							}

							selectedType = type
							editor.setValue(getSignature(type, defaultSignature, currentCustomSignature))
							editor.setEnabled(type === EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM)
						},
					}),
					m(editor),
				]
			},
		}

		let editSignatureOkAction = (dialog: Dialog) => {
			const props = locator.logins.getUserController().props
			const newType = selectedType
			const newCustomValue = editor.getValue()
			const oldType = props.emailSignatureType
			const oldCustomValue = props.customEmailSignature

			const updateSignature = () => {
				props.emailSignatureType = newType

				if (newType === EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM) {
					props.customEmailSignature = newCustomValue
				}

				const updatePromise = locator.entityClient.update(props)
				return showProgressDialog("pleaseWait_msg", updatePromise)
					.then(() => dialog.close())
					.catch(
						ofClass(PayloadTooLargeError, () => {
							props.emailSignatureType = oldType
							props.customEmailSignature = oldCustomValue
							return Dialog.message("requestTooLarge_msg")
						}),
					)
			}

			if (newType === oldType && (newType !== EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM || newCustomValue === oldCustomValue)) {
				return dialog.close()
			} else {
				if (newType === EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM && newCustomValue.length > RECOMMENDED_SIGNATURE_SIZE_LIMIT) {
					const signatureSizeKb = Math.floor(newCustomValue.length / 1024)
					const confirmLargeSignatureAttrs = {
						title: lang.get("userEmailSignature_label"),
						child: {
							view: () =>
								m(
									"p",
									lang.get("largeSignature_msg", {
										"{1}": signatureSizeKb,
									}),
								),
						},
						okAction: (dialog: Dialog) => {
							dialog.close()
							updateSignature()
						},
						allowOkWithReturn: true,
					}
					Dialog.showActionDialog(confirmLargeSignatureAttrs)
				} else {
					updateSignature()
				}
			}
		}

		Dialog.showActionDialog({
			title: lang.get("userEmailSignature_label"),
			child: form,
			type: DialogType.EditLarge,
			okAction: editSignatureOkAction,
		})
	})
}

export function getSignatureTypes(props: TutanotaProperties): {
	name: string
	value: string
}[] {
	let signatureTypes = [
		{
			name: lang.get("emailSignatureTypeCustom_msg"),
			value: EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM,
		},
		{
			name: lang.get("comboBoxSelectionNone_msg"),
			value: EmailSignatureType.EMAIL_SIGNATURE_TYPE_NONE,
		},
	]

	if (!locator.logins.isEnabled(FeatureType.DisableDefaultSignature) || props.emailSignatureType === EmailSignatureType.EMAIL_SIGNATURE_TYPE_DEFAULT) {
		signatureTypes.splice(0, 0, {
			name: lang.get("emailSignatureTypeDefault_msg"),
			value: EmailSignatureType.EMAIL_SIGNATURE_TYPE_DEFAULT,
		})
	}

	return signatureTypes
}

function getSignature(type: string, defaultSignature: string, currentCustomSignature: string): string {
	if (type === EmailSignatureType.EMAIL_SIGNATURE_TYPE_DEFAULT) {
		return defaultSignature
	} else if (type === EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM) {
		return currentCustomSignature
	} else {
		return ""
	}
}

export function getSignatureType(props: TutanotaProperties): {
	name: string
	value: string
} {
	return neverNull(getSignatureTypes(props).find((t) => t.value === props.emailSignatureType))
}
