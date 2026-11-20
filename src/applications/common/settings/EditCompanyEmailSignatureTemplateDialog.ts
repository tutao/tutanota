import m from "mithril"
import stream from "mithril/stream"
import { CompanyEmailSignature, CompanyEmailSignatureTemplate, CompanyEmailSignatureTypeRef } from "@tutao/entities/sys"
import { NewBusinessPlans } from "../../../entities/sys/Utils"
import { EnvProvider, UpgradePromptType } from "@tutao/app-env"
import { showNotAvailableForFreeDialog } from "../misc/SubscriptionDialogs.js"
import { Dialog, DialogType } from "../../../ui/base/Dialog.js"
import { HtmlEditor } from "../../../ui/editor/HtmlEditor.js"
import { Icons } from "../../../ui/base/icons/Icons.js"
import { PlaceholderChip, PlaceholderChips } from "./PlaceholderChips.js"
import { Card } from "../../../ui/base/Card.js"
import { Icon, IconSize } from "../../../ui/base/Icon.js"
import { theme } from "../../../ui/theme.js"
import { px, size } from "../../../ui/size.js"
import { PrimaryButton } from "../../../ui/base/buttons/VariantButtons.js"
import { TextSegmentControl } from "../../../ui/base/TextSegmentControl.js"
import { lang } from "../../../ui/utils/LanguageViewModel.js"
import { showProgressDialog } from "../../../ui/dialogs/ProgressDialog.js"
import { ofClass } from "@tutao/utils"
import { PayloadTooLargeError } from "@tutao/rest-client/error"
import { getHtmlSanitizer } from "../misc/HtmlSanitizer.js"
import { locator } from "../api/main/CommonLocator.js"
import { createSignatureImageClickHandler, promptAltTextForPastedImages } from "../mailFunctionality/SignatureImageHandlers.js"
import {
	CompanyEmailSignatureData,
	createCompanyEmailSignatureHtml,
	getDefaultCompanyEmailSignatureTemplate,
} from "../../mail-app/mail/signature/CompanyEmailSignature.js"
import { idToElementId } from "@tutao/meta"

export async function showBuyOrSetCompanyEmailSignatureTemplateDialog(): Promise<void> {
	if (!(await locator.logins.getUserController().isNewPaidBusinessPlan())) {
		await showNotAvailableForFreeDialog(UpgradePromptType.COMPANY_SIGNATURE, NewBusinessPlans)
	} else {
		await showCompanyEmailSignatureTemplateDialog(null)
	}
}

export async function showCompanyEmailSignatureTemplateDialog(existingTemplate: CompanyEmailSignatureTemplate | null) {
	const htmlSanitizer = getHtmlSanitizer()
	const editor = new HtmlEditor(htmlSanitizer)
		.setMinHeight(250)
		.showBorders()
		.setModeSwitcher("companySignature_label")
		.setValue(existingTemplate?.signatureTemplate ?? getDefaultCompanyEmailSignatureTemplate())
		.enableToolbar()
		.setToolbarOptions({
			imageButtonClickHandler: createSignatureImageClickHandler(!EnvProvider.get().isApp()),
			isNonElevatedBackground: true,
		})
	promptAltTextForPastedImages(editor.editor)

	const editSegment = {
		icon: Icons.PenOutline,
		label: "edit_action" as const,
		value: "edit",
	}
	const previewSegment = {
		icon: Icons.EyeOutline,
		label: "preview_label" as const,
		value: "preview",
	}
	const selectedTab = stream(editSegment.value)
	let savedHtml = editor.getValue()
	selectedTab.map((tab) => {
		if (tab === editSegment.value) {
			editor.setValue(savedHtml)
		} else {
			savedHtml = editor.getValue()
		}
	})

	const userController = locator.logins.getUserController()
	let companyEmailSignature: CompanyEmailSignature | null = null
	const companyEmailSignatureId = userController.user.companyEmailSignature
	if (companyEmailSignatureId !== null) {
		companyEmailSignature = await locator.entityClient.load(CompanyEmailSignatureTypeRef, idToElementId(companyEmailSignatureId))
	}

	const previewData: CompanyEmailSignatureData = {
		name: companyEmailSignature?.name ?? userController.userGroupInfo.name ?? lang.getTranslationText("name_label"),
		email: companyEmailSignature?.email ?? userController.userGroupInfo.mailAddress ?? lang.getTranslationText("mailAddress_label"),
		phoneNumber: companyEmailSignature?.phoneNumber ?? lang.getTranslationText("phone_label"),
		mobileNumber: companyEmailSignature?.mobileNumber ?? lang.getTranslationText("mobile_label"),
		role: companyEmailSignature?.role ?? lang.getTranslationText("role_placeholder"),
		department: companyEmailSignature?.department ?? lang.getTranslationText("department_placeholder"),
		address: companyEmailSignature?.address ?? lang.getTranslationText("address_label"),
		custom1: companyEmailSignature?.custom1 ?? lang.getTranslationText("customField1_label"),
		custom2: companyEmailSignature?.custom2 ?? lang.getTranslationText("customField2_label"),
	}

	const placeholderChips: PlaceholderChip[] = [
		{ placeholder: "{name}", label: "name_label" },
		{ placeholder: "{role}", label: "role_placeholder" },
		{ placeholder: "{department}", label: "department_placeholder" },
		{ placeholder: "{address}", label: "address_label" },
		{ placeholder: "{email}", label: "mailAddress_label" },
		{ placeholder: "{phoneNumber}", label: "phone_label" },
		{ placeholder: "{mobileNumber}", label: "mobile_label" },
		{ placeholder: "{custom1}", label: "customField1_label" },
		{ placeholder: "{custom2}", label: "customField2_label" },
	]

	const editTabContent = () => [
		m(Card, { classes: ["mt-16 center"], style: { padding: px(size.spacing_16) } }, [
			m(Icon, { icon: Icons.PenFilled, size: IconSize.PX32, style: { fill: theme.on_surface_variant } }),
			m(".smaller.mt-16", m.trust(lang.getTranslationText("companySignatureInfo_msg"))),
		]),
		m(
			".mt-16",
			m(PlaceholderChips, {
				chips: placeholderChips,
				contentWithPlaceholder: editor.getValue(),
				onInsert: (placeholder) => editor.insertAtCursor(placeholder),
				onRemove: (placeholder) => editor.removeText(placeholder),
			}),
		),
		m(".mt-16", m(editor)),
	]
	const previewTabContent = () => [
		m(".small.mt-16.mb-16", lang.getTranslationText("preview_label")),
		m.trust(createCompanyEmailSignatureHtml(savedHtml, previewData) ?? ""),
	]

	const save = async (dialog: Dialog) => {
		const newTemplate = htmlSanitizer.sanitizeHTML(selectedTab() === editSegment.value ? editor.getValue() : savedHtml, {
			blockExternalContent: false,
		}).html
		if (newTemplate.trim() === "") {
			return Dialog.message("emptyString_msg")
		}

		const oldTemplate = existingTemplate?.signatureTemplate
		const userManagementFacade = locator.userManagementFacade
		try {
			await showProgressDialog(
				"pleaseWait_msg",
				existingTemplate
					? userManagementFacade.updateCompanyEmailSignatureTemplate(existingTemplate, newTemplate)
					: userManagementFacade.createCompanyEmailSignatureTemplate(newTemplate),
			)
			dialog.close()
		} catch (e) {
			if (existingTemplate && oldTemplate != null) {
				existingTemplate.signatureTemplate = oldTemplate
			}
			await ofClass(PayloadTooLargeError, () => Dialog.message("requestTooLarge_msg"))(e)
		}
	}

	const dialog = Dialog.showActionDialog({
		type: DialogType.Popup_L,
		title: "companySignature_label",
		child: () => [
			m(TextSegmentControl, {
				items: [editSegment, previewSegment],
				selectedValue: selectedTab(),
				onValueSelected: selectedTab,
			}),
			selectedTab() === editSegment.value ? editTabContent() : previewTabContent(),
			m(
				".flex-end.wrap.mt-24.gap-16",
				m(PrimaryButton, {
					width: "flex",
					label: "save_action",
					onclick: () => save(dialog),
					disabled: (selectedTab() === editSegment.value ? editor.getValue() : savedHtml).trim() === "",
				}),
			),
		],
		okAction: null,
	})
}

export async function removeCompanyEmailSignatureTemplate(): Promise<void> {
	if (await Dialog.confirm("companySignatureRemove_msg", "remove_action")) {
		await showProgressDialog("pleaseWait_msg", locator.userManagementFacade.deleteCompanyEmailSignatureTemplate())
	}
}
