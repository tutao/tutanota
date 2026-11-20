import m from "mithril"
import stream from "mithril/stream"
import { CompanyEmailSignature, CompanyEmailSignatureTemplate, CompanyEmailSignatureTypeRef } from "@tutao/entities/sys"
import { NewBusinessPlans } from "../../../entities/sys/Utils"
import { EnvProvider, UpgradePromptType } from "@tutao/app-env"
import { showNotAvailableForFreeDialog } from "../misc/SubscriptionDialogs.js"
import { Dialog, DialogType } from "../../../ui/base/Dialog.js"
import { HtmlEditor } from "../../../ui/editor/HtmlEditor.js"
import { SegmentControl } from "../../../ui/base/SegmentControl.js"
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
		name: lang.getTranslationText("edit_action"),
		value: "edit",
	}
	const previewSegment = {
		name: lang.getTranslationText("preview_label"),
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

	const editTabContent = () => [m(".small.mb-8.mt-8", m.trust(lang.getTranslationText("companySignatureInfo_msg"))), m(editor)]
	const previewTabContent = () => [
		m(".small.mt-16.mb-16", lang.getTranslationText("preview_label")),
		m.trust(createCompanyEmailSignatureHtml(savedHtml, previewData) ?? ""),
	]

	Dialog.showActionDialog({
		type: DialogType.Popup_L,
		title: "companySignature_label",
		child: () => [
			m(SegmentControl, {
				items: [editSegment, previewSegment],
				selectedValue: selectedTab(),
				onValueSelected: selectedTab,
			}),
			selectedTab() === editSegment.value ? editTabContent() : previewTabContent(),
		],
		okAction: async (dialog: Dialog) => {
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
		},
	})
}

export async function removeCompanyEmailSignatureTemplate(): Promise<void> {
	if (await Dialog.confirm("companySignatureRemove_msg", "remove_action")) {
		await showProgressDialog("pleaseWait_msg", locator.userManagementFacade.deleteCompanyEmailSignatureTemplate())
	}
}
