import m from "mithril"
import stream from "mithril/stream"
import { Booking, CompanySignature } from "@tutao/entities/sys"
import { PlanType } from "../../../entities/sys/Utils"
import { UpgradePromptType } from "@tutao/app-env"
import { showNotAvailableForFreeDialog, showPlanUpgradeRequiredDialog } from "../misc/SubscriptionDialogs.js"
import { getAvailablePlansWithWhitelabel, isWhitelabelActive } from "../subscription/utils/SubscriptionUtils.js"
import { Dialog, DialogType } from "../../../ui/base/Dialog.js"
import { HtmlEditor } from "../../../ui/editor/HtmlEditor.js"
import { SegmentControl } from "../../../ui/base/SegmentControl.js"
import { lang } from "../../../ui/utils/LanguageViewModel.js"
import { showProgressDialog } from "../../../ui/dialogs/ProgressDialog.js"
import { ofClass } from "@tutao/utils"
import { PayloadTooLargeError } from "@tutao/rest-client/error"
import { getHtmlSanitizer } from "../misc/HtmlSanitizer.js"
import { locator } from "../api/main/CommonLocator.js"
import { insertInlineImageB64ClickHandler } from "../mailFunctionality/SharedMailUtils.js"
import { createCompanySignatureHtml, getDefaultCompanySignatureTemplate } from "../../mail-app/mail/signature/CompanySignature.js"
import { CompanySignatureTemplate, CompanySignatureTemplateTypeRef } from "@tutao/entities/tutanota"
import { idToElementId } from "@tutao/meta"

const PREVIEW_PHONE_NUMBER = "+1 234 5678"
const PREVIEW_ROLE = "Company Role"
const PREVIEW_DEPARTMENT = "Company Department"

export async function showBuyOrSetCompanySignatureDialog(lastBooking: Booking | null): Promise<void> {
	if (locator.logins.getUserController().isFreeAccount()) {
		showNotAvailableForFreeDialog(UpgradePromptType.COMPANY_SIGNATURE, [PlanType.Unlimited])
	} else {
		const planConfiguration = await locator.logins.getUserController().getPlanConfig()
		let whitelabel = isWhitelabelActive(lastBooking, planConfiguration)
		if (!whitelabel) {
			const plansWithWhitelabel = await getAvailablePlansWithWhitelabel()
			whitelabel = await showPlanUpgradeRequiredDialog(UpgradePromptType.COMPANY_SIGNATURE, plansWithWhitelabel)
		}
		if (whitelabel) {
			await showCompanySignatureDialog(null)
		}
	}
}

export async function showCompanySignatureDialog(existing: CompanySignature | null) {
	const htmlSanitizer = getHtmlSanitizer()
	const editor = new HtmlEditor(htmlSanitizer, "companySignature_label")
		.setMinHeight(250)
		.showBorders()
		.setModeSwitcher("companySignature_label")
		.setValue(existing?.companySignature ?? getDefaultCompanySignatureTemplate())
		.enableToolbar()
		.setToolbarOptions({
			imageButtonClickHandler: insertInlineImageB64ClickHandler,
			isNonelevatedBackground: true,
		})

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
	let companySignatureTemplate: CompanySignatureTemplate | null = null
	const companySignatureTemplateId = userController.props.companySignatureTemplate
	if (companySignatureTemplateId !== null) {
		companySignatureTemplate = await locator.entityClient.load(CompanySignatureTemplateTypeRef, idToElementId(companySignatureTemplateId))
	}
	const previewData = {
		name: companySignatureTemplate?.name ?? userController.userGroupInfo.name,
		email: companySignatureTemplate?.email ?? userController.userGroupInfo.mailAddress,
		phoneNumber: companySignatureTemplate?.phoneNumber ?? PREVIEW_PHONE_NUMBER,
		role: companySignatureTemplate?.role ?? PREVIEW_ROLE,
		department: companySignatureTemplate?.department ?? PREVIEW_DEPARTMENT,
	}

	const editTabContent = () => [m(".small.mb-8", lang.getTranslationText("companySignatureInfo_msg")), m(editor)]
	const previewTabContent = () => [
		m(".small.mt-16.mb-16", lang.getTranslationText("preview_label")),
		m.trust(createCompanySignatureHtml(savedHtml, previewData) ?? ""),
	]

	Dialog.showActionDialog({
		type: DialogType.Signature,
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
			const template = htmlSanitizer.sanitizeHTML(selectedTab() === editSegment.value ? editor.getValue() : savedHtml, {
				blockExternalContent: false,
			}).html
			if (template.trim() === "") {
				return Dialog.message("emptyString_msg")
			}

			const oldTemplate = existing?.companySignature
			const userManagementFacade = locator.userManagementFacade
			try {
				await showProgressDialog(
					"pleaseWait_msg",
					existing ? userManagementFacade.updateCompanySignature(existing, template) : userManagementFacade.createCompanySignature(template),
				)
				dialog.close()
			} catch (e) {
				if (existing && oldTemplate != null) {
					existing.companySignature = oldTemplate
				}
				await ofClass(PayloadTooLargeError, () => Dialog.message("requestTooLarge_msg"))(e)
			}
		},
	})
}

export async function removeCompanySignature(): Promise<void> {
	if (await Dialog.confirm("companySignatureRemove_msg", "remove_action")) {
		await showProgressDialog("pleaseWait_msg", locator.userManagementFacade.deleteCompanySignature())
	}
}
