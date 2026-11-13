import m from "mithril"
import { Dialog, DialogType } from "../../../ui/base/Dialog"
import { lang, TranslationKey } from "../../../ui/utils/LanguageViewModel"
import { EnvProvider, FeatureType } from "../../../platform-kit/app-env"
import { HtmlEditor } from "../../../ui/editor/HtmlEditor"
import { PayloadTooLargeError } from "../../../platform-kit/rest-client/error"
import { showProgressDialog } from "../../../ui/dialogs/ProgressDialog"
import { newPromise, ofClass } from "../../../platform-kit/utils"
import { locator } from "../../common/api/main/CommonLocator"
import { DropDownSelectorNew } from "../../../ui/base/DropDownSelectorNew"
import { insertInlineImageB64ClickHandler } from "../../common/mailFunctionality/SharedMailUtils.js"
import {
	CompanySignatureTemplate,
	CompanySignatureTemplateTypeRef,
	createCustomEmailSignature,
	CustomEmailSignature,
	CustomEmailSignatureTypeRef,
	TutanotaProperties,
} from "@tutao/entities/tutanota"
import { idToElementId } from "@tutao/meta"
import { showEditCompanySignatureTemplateDialog } from "./EditCompanySignatureTemplateDialog"
import { EmailSignatureType } from "../../../entities/tutanota/Utils"
import { getHtmlSanitizer } from "../../common/misc/HtmlSanitizer"
import { TableNew, TableNewRowAttrs } from "../../../ui/base/TableNew"
import { Icons } from "../../../ui/base/icons/Icons"
import { ButtonSize } from "../../../ui/base/ButtonSize"
import { TextField } from "../../../ui/base/TextField"
import { assertNotNull } from "../../../platform-kit/utils/Utils"
import { getDefaultSignature, SignatureContext, SignatureSetting } from "../mail/signature/Signature"
import { IconButton } from "../../../ui/base/IconButton"

EnvProvider.assertMainOrNode()
// signatures can become large, for example if they include a base64 embedded image. we ask for confirmation in such cases
const RECOMMENDED_SIGNATURE_SIZE_LIMIT = 15 * 1024

const DEFAULT_SELECTION = EmailSignatureType.EMAIL_SIGNATURE_TYPE_DEFAULT
const NONE_SELECTION = EmailSignatureType.EMAIL_SIGNATURE_TYPE_NONE
const CUSTOM_PREFIX = "custom:"

export function getSignatureSetting(props: TutanotaProperties, context: SignatureContext): SignatureSetting {
	return context === SignatureContext.NewMail
		? { type: props.emailSignatureTypeForNewMails as EmailSignatureType, name: props.defaultSignatureNameForNewMessages }
		: {
				type: (props.emailSignatureTypeForRepliesAndForwards ?? props.emailSignatureTypeForNewMails) as EmailSignatureType,
				name: props.defaultSignatureNameForRepliesAndForwards,
			}
}

function setSignatureSetting(props: TutanotaProperties, context: SignatureContext, setting: SignatureSetting) {
	if (context === SignatureContext.NewMail) {
		props.emailSignatureTypeForNewMails = setting.type
		props.defaultSignatureNameForNewMessages = setting.name
	} else {
		props.emailSignatureTypeForRepliesAndForwards = setting.type
		props.defaultSignatureNameForRepliesAndForwards = setting.name
	}
}

function selectionFromProps(props: TutanotaProperties, context: SignatureContext, customSignatures: CustomEmailSignature[]): string {
	const { type, name } = getSignatureSetting(props, context)
	if (type === EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM) {
		if (name != null && customSignatures.some((signature) => signature.name === name)) {
			return CUSTOM_PREFIX + name
		}
		// not migrated yet or the signature does not exist anymore
		return fallbackSelection()
	}
	return type
}

function getSelectedSignature(customSignatures: CustomEmailSignature[], selection: string): string {
	if (selection.startsWith(CUSTOM_PREFIX)) {
		const name = selection.substring(CUSTOM_PREFIX.length)
		return customSignatures.find((signature) => signature.name === name)?.value ?? ""
	}

	if (selection === DEFAULT_SELECTION) {
		return getDefaultSignature()
	}

	return ""
}

function fallbackSelection(): string {
	return locator.logins.isEnabled(FeatureType.DisableDefaultSignature) ? NONE_SELECTION : DEFAULT_SELECTION
}

function selectionToSetting(selection: string): SignatureSetting {
	return selection.startsWith(CUSTOM_PREFIX)
		? { type: EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM, name: selection.substring(CUSTOM_PREFIX.length) }
		: { type: selection as EmailSignatureType, name: null }
}

async function saveProps(props: TutanotaProperties, selectedForNewMails: string, selectedForRepliesAndForwards: string): Promise<void> {
	const oldForNewMails = getSignatureSetting(props, SignatureContext.NewMail)
	const oldForRepliesAndForwards = getSignatureSetting(props, SignatureContext.ReplyOrForward)
	setSignatureSetting(props, SignatureContext.NewMail, selectionToSetting(selectedForNewMails))
	setSignatureSetting(props, SignatureContext.ReplyOrForward, selectionToSetting(selectedForRepliesAndForwards))
	try {
		await showProgressDialog("pleaseWait_msg", locator.entityClient.update(props))
	} catch (e) {
		setSignatureSetting(props, SignatureContext.NewMail, oldForNewMails)
		setSignatureSetting(props, SignatureContext.ReplyOrForward, oldForRepliesAndForwards)
		throw e
	}
}

function isSignatureUsedInProps(props: TutanotaProperties, name: string): boolean {
	return [SignatureContext.NewMail, SignatureContext.ReplyOrForward].some((context) => {
		const setting = getSignatureSetting(props, context)
		return setting.type === EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM && setting.name === name
	})
}

function createPreview(label: TranslationKey): HtmlEditor {
	return new HtmlEditor(getHtmlSanitizer(), label)
		.showBorders()
		.setMinHeight(200)
		.enableToolbar()
		.setToolbarOptions({
			//Inline images require transporting over IPC boundary and we have not implemented a suitable way yet
			imageButtonClickHandler: EnvProvider.get().isApp() ? null : insertInlineImageB64ClickHandler,
		})
		.setEnabled(false)
}

export async function showEditSignatureDialog(props: TutanotaProperties) {
	const listId = props.customEmailSignatures
	let customSignatures: CustomEmailSignature[] = listId != null ? await locator.entityClient.loadAll(CustomEmailSignatureTypeRef, listId) : []
	let selectedForNewMails = selectionFromProps(props, SignatureContext.NewMail, customSignatures)
	let selectedForRepliesAndForwards = selectionFromProps(props, SignatureContext.ReplyOrForward, customSignatures)

	const companySignatureTemplate: CompanySignatureTemplate | null =
		props.companySignatureTemplate != null
			? await locator.entityClient.load(CompanySignatureTemplateTypeRef, idToElementId(props.companySignatureTemplate)).catch(() => null)
			: null

	const previewForNewMails = createPreview("previewForSignatureForNewMails_label")
	const previewForRepliesAndForwards = createPreview("previewForSignatureForRepliesAndForwards_label")
	const updatePreviews = () => {
		previewForNewMails.setValue(getSelectedSignature(customSignatures, selectedForNewMails))
		previewForRepliesAndForwards.setValue(getSelectedSignature(customSignatures, selectedForRepliesAndForwards))
	}
	updatePreviews()

	const reloadSignatures = async () => {
		if (listId == null) return
		customSignatures = await locator.entityClient.loadAll(CustomEmailSignatureTypeRef, listId)
		updatePreviews()
		m.redraw()
	}

	const showSignatureEditor = async (existing: CustomEmailSignature | null) => {
		const result = await showCustomSignatureEditor(
			existing,
			customSignatures.filter((signature) => signature !== existing).map((signature) => signature.name),
		)
		if (result == null || listId == null) {
			return
		}
		try {
			if (existing == null) {
				const created = createCustomEmailSignature({ name: result.name, value: result.value })
				created._ownerGroup = assertNotNull(props._ownerGroup)
				await showProgressDialog("pleaseWait_msg", locator.entityClient.setup(listId, created))
			} else {
				const oldName = existing.name
				const wasUsedInProps = isSignatureUsedInProps(props, oldName)
				existing.name = result.name
				existing.value = result.value
				await showProgressDialog("pleaseWait_msg", locator.entityClient.update(existing))
				if (selectedForNewMails === CUSTOM_PREFIX + oldName) {
					selectedForNewMails = CUSTOM_PREFIX + result.name
				}
				if (selectedForRepliesAndForwards === CUSTOM_PREFIX + oldName) {
					selectedForRepliesAndForwards = CUSTOM_PREFIX + result.name
				}
				if (wasUsedInProps) {
					await saveProps(props, selectedForNewMails, selectedForRepliesAndForwards)
				}
			}
		} catch (e) {
			await reloadSignatures()
			await ofClass(PayloadTooLargeError, () => Dialog.message("requestTooLarge_msg"))(e)
			return
		}
		await reloadSignatures()
	}

	const deleteSignature = async (signature: CustomEmailSignature) => {
		await showProgressDialog("pleaseWait_msg", locator.entityClient.erase(signature))
		if (selectedForNewMails === CUSTOM_PREFIX + signature.name) {
			selectedForNewMails = fallbackSelection()
		}
		if (selectedForRepliesAndForwards === CUSTOM_PREFIX + signature.name) {
			selectedForRepliesAndForwards = fallbackSelection()
		}
		// do not leave the properties pointing to a signature that does not exist anymore
		if (isSignatureUsedInProps(props, signature.name)) {
			await saveProps(props, selectedForNewMails, selectedForRepliesAndForwards)
		}
		await reloadSignatures()
	}

	const getDefaultDropdownItems = () => {
		let items: { name: string; value: string }[] = []

		if (!locator.logins.isEnabled(FeatureType.DisableDefaultSignature)) {
			items.push({
				name: lang.getTranslationText("emailSignatureTypeDefault_msg"),
				value: DEFAULT_SELECTION,
			})
		}

		items.push({
			name: lang.getTranslationText("comboBoxSelectionNone_msg"),
			value: NONE_SELECTION,
		})

		const customSignatureItems = customSignatures.map((signature) => ({ name: signature.name, value: CUSTOM_PREFIX + signature.name }))
		items = items.concat(customSignatureItems)
		return items
	}

	const renderCompanySignature = (template: CompanySignatureTemplate) => [
		m(TextField, {
			class: "mt-24",
			label: "companySignature_label",
			value: [template.name, template.role].filter((value) => value != null && value !== "").join(", "),
			isReadOnly: true,
			injectionsRight: () => [
				m(IconButton, {
					label: "edit_action",
					icon: Icons.PenFilled,
					size: ButtonSize.Compact,
					click: () => showEditCompanySignatureTemplateDialog(template),
				}),
			],
		}),
		m(".small.mt-8", lang.get("companySignatureDisclaimer_msg")),
	]

	const form = {
		view: () => [
			m(DropDownSelectorNew, {
				label: "defaultSignatureNewMails_label",
				items: getDefaultDropdownItems(),
				selectedValue: selectedForNewMails,
				selectionChangedHandler: (selection: string) => {
					selectedForNewMails = selection
					updatePreviews()
				},
				class: "mt-16",
			}),
			m(previewForNewMails),
			m(DropDownSelectorNew, {
				label: "defaultSignatureRepliesAndForwards_label",
				items: getDefaultDropdownItems(),
				selectedValue: selectedForRepliesAndForwards,
				selectionChangedHandler: (selection: string) => {
					selectedForRepliesAndForwards = selection
					updatePreviews()
				},
				class: "mt-16",
			}),
			m(previewForRepliesAndForwards),
			companySignatureTemplate != null ? renderCompanySignature(companySignatureTemplate) : null,
			listId != null
				? m(TableNew, {
						class: "mt-24",
						heading: "customSignatures_label",
						addButtonAttrs: {
							label: "add_action",
							icon: Icons.Plus,
							size: ButtonSize.Compact,
							click: () => showSignatureEditor(null),
						},
						rows: customSignatures
							.sort((a, b) => a.name.localeCompare(b.name))
							.map(
								(signature): TableNewRowAttrs => ({
									text: signature.name,
									actionButtons: [
										{ label: "edit_action", icon: Icons.PenFilled, size: ButtonSize.Compact, click: () => showSignatureEditor(signature) },
										{
											label: "delete_action",
											icon: Icons.TrashFilled,
											size: ButtonSize.Compact,
											click: () =>
												Dialog.confirm("signatureDeleteConfirm_msg").then((confirmed) => {
													if (confirmed) {
														showProgressDialog("pleaseWait_msg", deleteSignature(signature))
													}
												}),
										},
									],
								}),
							),
					})
				: null,
		],
	}

	Dialog.showActionDialog({
		title: "userEmailSignature_label",
		child: form,
		type: DialogType.Signature,
		okAction: async (dialog: Dialog) => {
			const hasChanged =
				selectionFromProps(props, SignatureContext.NewMail, customSignatures) !== selectedForNewMails ||
				selectionFromProps(props, SignatureContext.ReplyOrForward, customSignatures) !== selectedForRepliesAndForwards
			if (hasChanged) {
				try {
					await saveProps(props, selectedForNewMails, selectedForRepliesAndForwards)
				} catch (e) {
					return ofClass(PayloadTooLargeError, () => Dialog.message("requestTooLarge_msg"))(e)
				}
			}
			dialog.close()
		},
	})
}

function showCustomSignatureEditor(existing: CustomEmailSignature | null, otherNames: readonly string[]): Promise<{ name: string; value: string } | null> {
	return newPromise((resolve) => {
		let name = existing?.name ?? ""
		const editor = new HtmlEditor(getHtmlSanitizer(), "preview_label")
			.showBorders()
			.setMinHeight(200)
			.setValue(existing?.value ?? "")
			.enableToolbar()
			.setToolbarOptions({
				//Inline images require transporting over IPC boundary and we have not implemented a suitable way yet
				imageButtonClickHandler: EnvProvider.get().isApp() ? null : insertInlineImageB64ClickHandler,
				isNonelevatedBackground: true,
			})

		Dialog.showActionDialog({
			title: "userEmailSignature_label",
			type: DialogType.Signature,
			child: {
				view: () => [
					m(TextField, {
						label: "signatureName_label",
						value: name,
						oninput: (value) => (name = value),
					}),
					m(editor),
				],
			},
			validator: async () => {
				const trimmed = name.trim()
				if (trimmed === "") {
					return "emptyString_msg"
				}
				return otherNames.includes(trimmed) ? "signatureNameExists_msg" : null
			},
			cancelAction: (dialog) => {
				dialog.close()
				resolve(null)
			},
			okAction: async (dialog: Dialog) => {
				const value = editor.getValue()
				if (value.length > RECOMMENDED_SIGNATURE_SIZE_LIMIT) {
					const signatureSizeKb = Math.floor(value.length / 1024)
					const confirmed = await Dialog.confirm(lang.getTranslation("largeSignature_msg", { "{1}": signatureSizeKb }))
					if (!confirmed) return
				}
				dialog.close()
				resolve({ name: name.trim(), value })
			},
		})
	})
}

export function getSignatureTypeName(props: TutanotaProperties): string {
	const describe = (context: SignatureContext) => {
		const { type, name } = getSignatureSetting(props, context)
		switch (type) {
			case EmailSignatureType.EMAIL_SIGNATURE_TYPE_DEFAULT:
				return lang.get("emailSignatureTypeDefault_msg")
			case EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM:
				return name ?? lang.get("emailSignatureTypeCustom_msg")
			default:
				return lang.get("comboBoxSelectionNone_msg")
		}
	}
	const forNewMails = describe(SignatureContext.NewMail)
	const forReplies = describe(SignatureContext.ReplyOrForward)
	return forNewMails === forReplies ? forNewMails : `${forNewMails} / ${forReplies}`
}
