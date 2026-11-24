import { EntityClient } from "../../../platform-kit/network/EntityClient"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import type { LoginController } from "../../common/api/main/LoginController"
import {
	CompanyEmailSignatureValues,
	createCustomEmailSignature,
	CustomEmailSignature,
	CustomEmailSignatureTypeRef,
	TutanotaProperties,
} from "@tutao/entities/tutanota"
import { CompanyEmailSignatureTemplate, CompanyEmailSignatureTemplateTypeRef, CustomerGroupRootTypeRef } from "@tutao/entities/sys"
import { isSameId, OperationType } from "@tutao/meta"
import { FeatureType, MAX_CUSTOM_EMAIL_SIGNATURES_PER_FREE_USER } from "../../../platform-kit/app-env"
import { EmailSignatureType } from "../../../entities/tutanota/Utils"
import { assertNotNull } from "../../../platform-kit/utils"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { EmailSignatureContext, EmailSignatureSetting, getDefaultEmailSignature, getSignatureSetting, setSignatureSetting } from "../mail/signature/Signature"
import { createCompanyEmailSignatureHtml, loadCompanyEmailSignatureTemplate } from "../mail/signature/CompanyEmailSignature"

export class SignatureSettingsViewerModel {
	private _customEmailSignatures: CustomEmailSignature[] = []
	private _companyEmailSignatureTemplate: CompanyEmailSignatureTemplate | null = null

	constructor(
		private readonly entityClient: EntityClient,
		private readonly logins: LoginController,
	) {}

	get customEmailSignatures(): CustomEmailSignature[] {
		return this._customEmailSignatures
	}

	get companyEmailSignature(): CompanyEmailSignatureValues | null {
		return this.props.companyEmailSignatureValues
	}

	get companyEmailSignatureTemplate(): CompanyEmailSignatureTemplate | null {
		return this._companyEmailSignatureTemplate
	}

	get supportsCustomEmailSignatures(): boolean {
		return this.listId != null
	}

	get props(): TutanotaProperties {
		return this.logins.getUserController().props
	}

	private get listId(): Id | null {
		return this.props.customEmailSignatures
	}

	async init(): Promise<void> {
		const [customEmailSignatures, companyEmailSignatureTemplate] = await Promise.all([
			this.listId != null ? this.entityClient.loadAll(CustomEmailSignatureTypeRef, this.listId) : Promise.resolve<CustomEmailSignature[]>([]),
			loadCompanyEmailSignatureTemplate(this.entityClient, this.logins.getUserController().getCustomerGroupRoot()),
		])
		this._customEmailSignatures = customEmailSignatures.sort((a, b) => a.name.localeCompare(b.name))
		this._companyEmailSignatureTemplate = companyEmailSignatureTemplate
	}

	async onEntityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(CustomEmailSignatureTypeRef, update)) {
				const customEmailSignatureId = [update.instanceListId, update.instanceId] as IdTuple
				if (update.operation === OperationType.CREATE) {
					const customEmailSignature = await this.entityClient.load(CustomEmailSignatureTypeRef, customEmailSignatureId)
					this._customEmailSignatures.push(customEmailSignature)
					this._customEmailSignatures.sort((a, b) => a.name.localeCompare(b.name))
				} else if (update.operation === OperationType.UPDATE) {
					const customEmailSignature = await this.entityClient.load(CustomEmailSignatureTypeRef, customEmailSignatureId)
					const index = this._customEmailSignatures.findIndex((signature) => isSameId(signature._id, customEmailSignatureId))
					if (index !== -1) {
						this._customEmailSignatures[index] = customEmailSignature
						this._customEmailSignatures.sort((a, b) => a.name.localeCompare(b.name))
					}
				} else if (update.operation === OperationType.DELETE) {
					const index = this._customEmailSignatures.findIndex((signature) => isSameId(signature._id, customEmailSignatureId))
					if (index !== -1) {
						this._customEmailSignatures.splice(index, 1)
					}
				}
			} else if (isUpdateForTypeRef(CompanyEmailSignatureTemplateTypeRef, update)) {
				this._companyEmailSignatureTemplate = await loadCompanyEmailSignatureTemplate(
					this.entityClient,
					this.logins.getUserController().getCustomerGroupRoot(),
				)
			}
		}
	}

	getSelection(context: EmailSignatureContext): EmailSignatureSetting {
		const emailSignatureSetting = getSignatureSetting(this.props, context)
		if (emailSignatureSetting.type === EmailSignatureType.CUSTOM) {
			if (this._customEmailSignatures.some((signature) => emailSignatureSetting.id && isSameId(emailSignatureSetting.id, signature._id))) {
				return emailSignatureSetting
			}
			// the signature does not exist (anymore)
			return this.getFallbackSelection()
		}
		if (emailSignatureSetting.type === EmailSignatureType.COMPANY) {
			// there is nothing to select if the company signature has been removed
			return this._companyEmailSignatureTemplate != null ? emailSignatureSetting : this.getFallbackSelection()
		}
		return emailSignatureSetting
	}

	getFallbackSelection(): EmailSignatureSetting {
		return this.logins.isEnabled(FeatureType.DisableDefaultSignature)
			? { id: null, type: EmailSignatureType.NONE }
			: { id: null, type: EmailSignatureType.DEFAULT }
	}

	getDropdownItems(): { name: string; value: EmailSignatureSetting }[] {
		const items: { name: string; value: EmailSignatureSetting }[] = []
		if (this._companyEmailSignatureTemplate !== null) {
			items.push({
				name: lang.getTranslationText("companySignature_label"),
				value: { id: null, type: EmailSignatureType.COMPANY },
			})
		}
		if (!this.logins.isEnabled(FeatureType.DisableDefaultSignature)) {
			items.push({
				name: lang.getTranslationText("emailSignatureTypeDefault_msg"),
				value: { id: null, type: EmailSignatureType.DEFAULT },
			})
		}
		return items
			.concat(
				this._customEmailSignatures.map((signature) => ({
					name: signature.name,
					value: { id: signature._id, type: EmailSignatureType.CUSTOM },
				})),
			)
			.concat({
				name: lang.getTranslationText("comboBoxSelectionNone_msg"),
				value: { id: null, type: EmailSignatureType.NONE },
			})
	}

	getSignatureHtml(emailSignatureSetting: EmailSignatureSetting): string {
		if (emailSignatureSetting.type === EmailSignatureType.CUSTOM) {
			return this._customEmailSignatures.find((signature) => emailSignatureSetting.id && isSameId(signature._id, emailSignatureSetting.id))?.value ?? ""
		}

		if (emailSignatureSetting.type === EmailSignatureType.COMPANY) {
			return this._companyEmailSignatureTemplate != null
				? (createCompanyEmailSignatureHtml(this._companyEmailSignatureTemplate.signatureTemplate, this.companyEmailSignature) ?? "")
				: ""
		}

		return emailSignatureSetting.type === EmailSignatureType.DEFAULT ? getDefaultEmailSignature().value : ""
	}

	async saveSelection(context: EmailSignatureContext, newEmailSignatureSetting: EmailSignatureSetting): Promise<void> {
		setSignatureSetting(this.props, context, newEmailSignatureSetting)
		await this.entityClient.update(this.props)
	}

	isCustomEmailSignatureLimitReached(): boolean {
		return this.logins.getUserController().isFreeAccount() && this._customEmailSignatures.length >= MAX_CUSTOM_EMAIL_SIGNATURES_PER_FREE_USER
	}

	getOtherNames(existing: CustomEmailSignature | null): string[] {
		return this._customEmailSignatures.filter((signature) => signature !== existing).map((signature) => signature.name)
	}

	async saveCustomEmailSignature(existing: CustomEmailSignature | null, name: string, value: string): Promise<void> {
		if (existing == null) {
			const customEmailSignature = createCustomEmailSignature({ name, value })
			customEmailSignature._ownerGroup = assertNotNull(this.props._ownerGroup)
			await this.entityClient.setup(assertNotNull(this.listId), customEmailSignature)
		} else {
			existing.name = name
			existing.value = value
			await this.entityClient.update(existing)
		}
	}

	async deleteCustomEmailSignature(signature: CustomEmailSignature): Promise<void> {
		for (const context of [EmailSignatureContext.NewMail, EmailSignatureContext.ReplyOrForward]) {
			const selection = this.getSelection(context)
			if (selection.id && isSameId(selection.id, signature._id)) {
				setSignatureSetting(this.props, context, this.getFallbackSelection())
			}
		}
		await this.entityClient.erase(signature)
		await this.entityClient.update(this.props)
	}
}
