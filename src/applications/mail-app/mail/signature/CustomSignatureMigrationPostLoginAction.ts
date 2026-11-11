import { LoggedInEvent, PostLoginAction } from "../../../../app-kit/native-bridge/common/PostLoginAction"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import type { LoginController } from "../../../common/api/main/LoginController"
import { createCustomEmailSignature, CustomEmailSignatureTypeRef } from "@tutao/entities/tutanota"
import { EmailSignatureType } from "../../../../entities/tutanota/Utils"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { assertNotNull } from "../../../../platform-kit/utils/Utils"

/**
 * Carries over the legacy custom signature stored directly in TutanotaProperties to the list of CustomEmailSignatures.
 * The legacy value is left untouched. The migration is skipped if the list already contains signatures.
 */
export class CustomSignatureMigrationPostLoginAction implements PostLoginAction {
	constructor(
		private readonly logins: LoginController,
		private readonly entityClient: EntityClient,
	) {}

	async onPartialLoginSuccess(_: LoggedInEvent): Promise<void> {
		// do nothing
	}

	async onFullLoginSuccess(_: LoggedInEvent): Promise<void> {
		const props = this.logins.getUserController().props
		const listId = props.customEmailSignatures
		if (listId == null) {
			return
		}

		const legacySignature = props.customEmailSignatureLegacy
		if (legacySignature === "") {
			return
		}

		if (props.defaultSignatureNameForNewMessages !== null || props.defaultSignatureNameForRepliesAndForwards !== null) {
			return
		}

		const existingSignatures = await this.entityClient.loadAll(CustomEmailSignatureTypeRef, listId)
		if (existingSignatures.length > 0) {
			return
		}

		const name = lang.getTranslation("emailSignatureTypeCustom_msg").text
		if (props.emailSignatureTypeForNewMails === EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM) {
			// fixme the line below should be done on the server side with the batch job, maybe?
			props.emailSignatureTypeForRepliesAndForwards = EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM

			props.defaultSignatureNameForNewMessages = name
			props.defaultSignatureNameForRepliesAndForwards = name
			await this.entityClient.update(props)
		}

		const signature = createCustomEmailSignature({ name, value: legacySignature })
		signature._ownerGroup = assertNotNull(props._ownerGroup)
		await this.entityClient.setup(listId, signature)
	}
}
