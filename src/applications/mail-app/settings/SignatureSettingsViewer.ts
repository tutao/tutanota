import m, { Children } from "mithril"
import { EnvProvider, UpgradePromptType } from "../../../platform-kit/app-env"
import { UpdatableSettingsViewer } from "../../common/settings/Interfaces"
import { EntityUpdateData } from "../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { EntityClient } from "../../../platform-kit/network/EntityClient"
import type { LoginController } from "../../common/api/main/LoginController"
import { CustomEmailSignature } from "@tutao/entities/tutanota"
import { isSameId } from "@tutao/meta"
import { EmailSignatureType } from "../../../entities/tutanota/Utils"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { Icons } from "../../../ui/base/icons/Icons"
import { theme } from "../../../ui/theme"
import { TitleSection } from "../../../ui/TitleSection"
import { MenuTitle } from "../../../ui/titles/MenuTitle"
import { DropDownSelectorNew } from "../../../ui/base/DropDownSelectorNew"
import { IconButton } from "../../../ui/base/IconButton"
import { ButtonSize } from "../../../ui/base/ButtonSize"
import { TextField } from "../../../ui/base/TextField"
import { component_size, px, size } from "../../../ui/size"
import { PrimaryButton } from "../../../ui/base/buttons/VariantButtons"
import { Dialog } from "../../../ui/base/Dialog"
import { showProgressDialog } from "../../../ui/dialogs/ProgressDialog"
import { PayloadTooLargeError, PreconditionFailedError } from "../../../platform-kit/rest-client/error"
import { ofClass } from "../../../platform-kit/utils"
import { EmailSignatureContext, EmailSignatureSetting, getSignaturePreviewHtml } from "../mail/signature/Signature"
import { getUsedCompanyEmailSignatureFields } from "../mail/signature/CompanyEmailSignature"
import { MessageBanner } from "../../../ui/base/MessageBanner"
import { Card } from "../../../ui/base/Card"
import { getHtmlSanitizer } from "../../common/misc/HtmlSanitizer"
import { showCustomSignatureEditor } from "./EditSignatureDialog"
import { showNotAvailableForFreeDialog } from "../../common/misc/SubscriptionDialogs"
import { SignatureSettingsViewerModel } from "./SignatureSettingsViewerModel"
import { showEditCompanyEmailSignatureDialog } from "./EditCompanyEmailSignatureDialog"

EnvProvider.assertMainOrNode()

const LIMIT_EXCEEDED_ERROR = "limitReached"

export class SignatureSettingsViewer implements UpdatableSettingsViewer {
	private readonly model: SignatureSettingsViewerModel

	constructor(entityClient: EntityClient, logins: LoginController) {
		this.model = new SignatureSettingsViewerModel(entityClient, logins)
		this.model.init().then(m.redraw)
	}

	view(): Children {
		return m(
			".fill-absolute.plr-24.pb-48.flex-v-start",
			{
				style: {
					backgroundColor: theme.surface_container,
				},
			},
			[
				// the content scrolls, the button to add a signature stays visible below it
				m(".overflow-hidden.overflow-y-scroll-settings-page.scrollbar-gutter-stable-or-fallback", [
					m(TitleSection, {
						icon: Icons.PenFilled,
						title: lang.getTranslationText("signaturesSettings_label"),
						subTitle: lang.getTranslationText("signatureSettings_text"),
					}),
					m(".mt-24", m(MenuTitle, { content: lang.getTranslationText("defaultSignatures_label") })),
					this.renderDefaultSelector(EmailSignatureContext.NewMail, "defaultSignatureNewMails_label"),
					this.renderDefaultSelector(EmailSignatureContext.ReplyOrForward, "defaultSignatureRepliesAndForwards_label"),
					m(".mt-24", m(MenuTitle, { content: lang.getTranslationText("customSignatures_label") })),
					this.renderCompanyEmailSignature(),
					this.model.supportsCustomEmailSignatures ? this.renderCustomSignatures(this.model.customEmailSignatures) : null,
				]),
				this.model.supportsCustomEmailSignatures ? this.renderAddCustomSignatureButton() : null,
			],
		)
	}

	async onEntityUpdatesReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		await this.model.onEntityEventsReceived(updates)
		m.redraw()
	}

	private renderDefaultSelector(
		context: EmailSignatureContext,
		label: "defaultSignatureNewMails_label" | "defaultSignatureRepliesAndForwards_label",
	): Children {
		const emailSignatureSetting = this.model.getSelection(context)
		const items = this.model.getDropdownItems()
		// the dropdown compares the values by reference, so it needs the object of the matching item
		const selectedItem = items.find(
			({ value }) =>
				value.type === emailSignatureSetting.type &&
				(value.id === emailSignatureSetting.id ||
					(value.id !== null && emailSignatureSetting.id !== null && isSameId(value.id, emailSignatureSetting.id))),
		)
		return [
			m(DropDownSelectorNew, {
				label,
				class: "mt-16",
				items,
				selectedValue: selectedItem?.value ?? null,
				selectionChangedHandler: (newEmailSignatureSetting: EmailSignatureSetting) => this.saveSelection(context, newEmailSignatureSetting),
			}),
			emailSignatureSetting.type === EmailSignatureType.NONE ? null : this.renderPreview(this.model.getSignatureHtml(emailSignatureSetting)),
		]
	}

	private renderPreview(signatureHtml: string): Children {
		const sanitized = getHtmlSanitizer().sanitizeHTML(signatureHtml, { blockExternalContent: false }).html
		return m(
			Card,
			{
				classes: ["mt-8", "scroll"],
				style: {
					minHeight: px(75),
					maxHeight: px(200),
				},
			},
			sanitized.trim() === "" ? m(".small", lang.getTranslationText("comboBoxSelectionNone_msg")) : m.trust(getSignaturePreviewHtml(sanitized)),
		)
	}

	private renderCompanyEmailSignature(): Children {
		const companyEmailSignature = this.model.companyEmailSignature
		// there is nothing to enter for the user if the template does not use any of the fields
		if (
			companyEmailSignature == null ||
			(companyEmailSignature && getUsedCompanyEmailSignatureFields(companyEmailSignature.signatureTemplate).size === 0)
		) {
			return null
		}

		const value = companyEmailSignature.name ?? lang.getTranslationText("companySignatureEnabled_label")
		return [
			m(TextField, {
				class: "mt-16",
				label: "companySignature_label",
				value,
				isReadOnly: true,
				injectionsRight: () => [
					m(IconButton, {
						label: "edit_action",
						icon: Icons.PenFilled,
						size: ButtonSize.Compact,
						click: () => showEditCompanyEmailSignatureDialog(companyEmailSignature),
					}),
				],
			}),
			m(".small.mt-8", lang.getTranslationText("companySignatureDisclaimer_msg")),
		]
	}

	private renderCustomSignatures(customSignatures: CustomEmailSignature[]): Children {
		return [
			customSignatures.length === 0
				? m(".mt-16", m(MessageBanner, { translation: lang.getTranslation("noEntries_msg"), type: "base" }))
				: customSignatures.map((signature, index) => this.renderSignatureRow(signature, index === 0)),
		]
	}

	private renderAddCustomSignatureButton() {
		return m(
			".mt-16.flex-wrap.flex-end.gap-8",
			m(PrimaryButton, {
				label: "addSignature_action",
				width: "flex",
				onclick: () => this.editSignature(null),
			}),
		)
	}

	private renderSignatureRow(signature: CustomEmailSignature, isFirst: boolean): Children {
		return m(
			`.pt-4.pb-4${isFirst ? ".mt-16" : ""}`,
			m(
				Card,
				{ style: { padding: "0", overflow: "hidden" } },
				m(
					".flex.items-center",
					{
						style: {
							minHeight: px(component_size.button_height_lg),
							paddingLeft: px(size.spacing_16),
							paddingRight: px(size.spacing_16),
						},
					},
					[
						m(".flex-grow.min-width-0.text-ellipsis", { title: signature.name }, signature.name),
						m(".flex.items-center.flex", [
							m(IconButton, {
								label: "edit_action",
								icon: Icons.PenFilled,
								size: ButtonSize.Compact,
								click: () => this.editSignature(signature),
							}),
							m(IconButton, {
								label: "delete_action",
								icon: Icons.TrashFilled,
								size: ButtonSize.Compact,
								click: async () => {
									if (await Dialog.confirm("signatureDeleteConfirm_msg")) {
										await this.deleteSignature(signature)
									}
								},
							}),
						]),
					],
				),
			),
		)
	}

	private async saveSelection(context: EmailSignatureContext, newEmailSignatureSetting: EmailSignatureSetting): Promise<void> {
		await showProgressDialog("pleaseWait_msg", this.model.saveSelection(context, newEmailSignatureSetting))
		m.redraw()
	}

	private async editSignature(existing: CustomEmailSignature | null): Promise<void> {
		if (existing == null && this.model.isCustomEmailSignatureLimitReached()) {
			await showNotAvailableForFreeDialog(UpgradePromptType.MORE_SIGNATURES_NEEDED)
			return
		}
		const result = await showCustomSignatureEditor(existing, this.model.getOtherNames(existing))
		if (result == null) {
			return
		}
		try {
			await showProgressDialog("pleaseWait_msg", this.model.saveCustomEmailSignature(existing, result.name, result.value))
		} catch (e) {
			if (e instanceof PreconditionFailedError) {
				if (e.data === LIMIT_EXCEEDED_ERROR) {
					await showNotAvailableForFreeDialog(UpgradePromptType.MORE_SIGNATURES_NEEDED)
				} else {
					await Dialog.message("unknownError_msg")
				}
			} else {
				await ofClass(PayloadTooLargeError, () => Dialog.message("requestTooLarge_msg"))(e)
			}
		}
	}

	private async deleteSignature(signature: CustomEmailSignature): Promise<void> {
		await showProgressDialog("pleaseWait_msg", this.model.deleteCustomEmailSignature(signature))
	}
}
