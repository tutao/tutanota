import m from "mithril"
import { CompanySignatureTemplate } from "@tutao/entities/tutanota"
import { Dialog, DialogType } from "../../../ui/base/Dialog"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { TextField } from "../../../ui/base/TextField"
import { showProgressDialog } from "../../../ui/dialogs/ProgressDialog"
import { PayloadTooLargeError } from "../../../platform-kit/rest-client/error"
import { ofClass } from "../../../platform-kit/utils"
import { locator } from "../../common/api/main/CommonLocator"
import { createCompanySignatureHtml } from "../mail/signature/CompanySignature"

export function showEditCompanySignatureTemplateDialog(template: CompanySignatureTemplate) {
	let name = template.name ?? ""
	let email = template.email ?? ""
	let phoneNumber = template.phoneNumber ?? ""
	let role = template.role ?? ""
	let department = template.department ?? ""

	Dialog.showActionDialog({
		title: "companySignature_label",
		type: DialogType.Signature,
		child: {
			view: () => [
				m(".small.mt-8", lang.getTranslationText("companySignatureUserDetails_msg")),
				m(TextField, { label: "name_label", value: name, oninput: (value) => (name = value) }),
				m(TextField, { label: "email_label", value: email, oninput: (value) => (email = value) }),
				m(TextField, { label: "phone_label", value: phoneNumber, oninput: (value) => (phoneNumber = value) }),
				m(TextField, { label: "role_placeholder", value: role, oninput: (value) => (role = value) }),
				m(TextField, { label: "department_placeholder", value: department, oninput: (value) => (department = value) }),
				m(".small.mt-16.mb-8", lang.getTranslationText("preview_label")),
				m.trust(createCompanySignatureHtml(template.signatureTemplate, { name, email, phoneNumber, role, department }) ?? ""),
				m(".small.mt-16", lang.getTranslationText("companySignatureDisclaimer_msg")),
			],
		},
		okAction: async (dialog: Dialog) => {
			const old = { name: template.name, email: template.email, phoneNumber: template.phoneNumber, role: template.role }
			template.name = name.trim() || null
			template.email = email.trim() || null
			template.phoneNumber = phoneNumber.trim() || null
			template.role = role.trim() || null
			template.department = department.trim() || null
			try {
				await showProgressDialog("pleaseWait_msg", locator.entityClient.update(template))
				dialog.close()
			} catch (e) {
				Object.assign(template, old)
				await ofClass(PayloadTooLargeError, () => Dialog.message("requestTooLarge_msg"))(e)
			}
		},
	})
}
