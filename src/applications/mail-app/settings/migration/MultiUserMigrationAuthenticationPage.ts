import m, { Children, Component, Vnode } from "mithril"
import { MultiUserMigrationData } from "./AddMultiUserMigrationWizard"
import { assertMainOrNode, ProgrammingError } from "@tutao/app-env"
import { WizardStepComponentAttrs } from "../../../../ui/base/wizard/WizardStep"
import { WizardStepContext } from "../../../../ui/base/wizard/WizardController"
import { TitleSection, TitleSectionAttrs } from "../../../../ui/TitleSection"
import { Icons } from "../../../../ui/base/icons/Icons"
import { theme } from "../../../../ui/theme"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { px, size } from "../../../../ui/size"
import { TextField } from "../../../../ui/base/TextField"
import { LegacyTextFieldType } from "../../../../ui/base/LegacyTextField"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { ToggleButton } from "../../../../ui/base/buttons/ToggleButton"
import { ButtonSize } from "../../../../ui/base/ButtonSize"
import { isMailAddress } from "@tutao/utils"
import { IMAP_SSL_PORT, IMAP_UNSAFE_PORT } from "../../../common/api/common/utils/imapImportUtils/ImapKnownConfigs"
import { Checkbox } from "../../../../ui/base/Checkbox"
import { Dialog } from "../../../../ui/base/Dialog"
import { showProgressDialog } from "../../../../ui/dialogs/ProgressDialog"
import { mailLocator } from "../../mailLocator"
import { OAuthHandler } from "../imapimport/oauth/OAuthHandler"
import { ImapErrorHandler } from "../imapimport/ImapErrorHandler"
import { ImapCredentials } from "../../../common/api/common/utils/imapImportUtils/ImapSyncContext"

assertMainOrNode()

export class MultiUserMigrationAuthenticationPage implements Component<WizardStepComponentAttrs<MultiUserMigrationData>> {
	shouldRevealPassword = false
	shouldDisplayUseSSLSwitch = false
	/** true while the OAuth window is open and/or the connection is being verified - disables the Continue button. */
	private isProcessing = false

	oninit(vnode: Vnode<WizardStepComponentAttrs<MultiUserMigrationData>>) {
		this.shouldDisplayUseSSLSwitch = vnode.attrs.ctx.viewModel.port !== parseInt(IMAP_SSL_PORT)
	}

	view({ attrs: { ctx } }: Vnode<WizardStepComponentAttrs<MultiUserMigrationData>>): Children {
		const data = ctx.viewModel
		return m(".mt-24", [
			m(TitleSection, {
				icon: Icons.MailFilled,
				iconOptions: { color: theme.on_surface_variant },
				subTitle: lang.getTranslationText("migrationImapCredentials_title"),
				title: "",
				style: {
					marginTop: px(size.spacing_16),
					borderRadius: px(size.radius_16),
				},
			} as TitleSectionAttrs),
			m(".mt-16"),
			m(TextField, {
				label: "migrationAccountUsername_label",
				value: data.adminUsername,
				oninput: (value) => (data.adminUsername = value),
				leadingIcon: { icon: Icons.MailFilled, color: theme.on_surface_variant },
			}),
			data.isImapServerSupportingOAuth ? null : this.renderManualFields(data),
			m(
				".flex-end.full-width.pt-32.mb-32",
				m(
					"",
					{ style: { width: "260px" } },
					m(PrimaryButton, {
						label: "continue_action",
						class: "wizard-next-button",
						disabled: !this.isContinueEnabled(data) || this.isProcessing,
						onclick: () => this.handleContinue(ctx),
					}),
				),
			),
		])
	}

	private async handleContinue(ctx: WizardStepContext<MultiUserMigrationData>): Promise<void> {
		this.isProcessing = true
		m.redraw()
		try {
			const success = await authenticateAndVerifyConnection(ctx.viewModel)
			if (success) {
				ctx.goNext()
			}
		} finally {
			this.isProcessing = false
			m.redraw()
		}
	}

	private renderManualFields(data: MultiUserMigrationData): Children {
		return [
			m(
				".flex.row.gap-16.mt-16",
				m(TextField, {
					label: "migrationImapAccountPassword_label",
					value: data.adminPassword,
					oninput: (value) => (data.adminPassword = value),
					type: this.shouldRevealPassword ? LegacyTextFieldType.Text : LegacyTextFieldType.Password,
					injectionsRight: () => this.renderRevealIcon(),
					leadingIcon: { icon: Icons.GenericLockFilled, color: theme.on_surface_variant },
				}),
			),
			m(".flex.row.gap-16.mt-16", [
				m(TextField, {
					label: "migrationImapAccountHost_label",
					value: data.host,
					oninput: (value) => (data.host = value),
					leadingIcon: { icon: Icons.ServerFilled, color: theme.on_surface_variant },
				}),
				m(TextField, {
					label: "migrationImapAccountPort_label",
					value: data.port.toString(),
					oninput: (value) => {
						const typedNumber = Number.parseInt(value)
						data.port = Number.isNaN(typedNumber) ? 0 : typedNumber
						if (value === IMAP_SSL_PORT) {
							data.useSSL = true
							this.shouldDisplayUseSSLSwitch = false
						} else if (value === IMAP_UNSAFE_PORT) {
							data.useSSL = false
							this.shouldDisplayUseSSLSwitch = true
						} else {
							data.useSSL = true
							this.shouldDisplayUseSSLSwitch = true
						}
					},
					leadingIcon: { icon: Icons.KeyFilled, color: theme.on_surface_variant },
				}),
			]),
			m(".mt-16", [
				this.shouldDisplayUseSSLSwitch
					? m(".tutaui-switch", [
							m(Checkbox, {
								label: () => lang.getTranslationText("migrationUseSSL_label"),
								checked: data.useSSL,
								onChecked: (value: boolean) => (data.useSSL = value),
							}),
						])
					: null,
			]),
		]
	}

	private isContinueEnabled(data: MultiUserMigrationData): boolean {
		if (!isMailAddress(data.adminUsername, true)) return false
		if (data.isImapServerSupportingOAuth) return true
		return data.host.length > 0 && !Number.isNaN(data.port) && data.port > 0
	}

	private renderRevealIcon(): Children {
		return m(ToggleButton, {
			title: this.shouldRevealPassword ? "concealPassword_action" : "revealPassword_action",
			toggled: this.shouldRevealPassword,
			onToggled: (_, e) => {
				this.shouldRevealPassword = !this.shouldRevealPassword
				e.stopPropagation()
			},
			icon: this.shouldRevealPassword ? Icons.EyeCrossedFilled : Icons.EyeFilled,
			size: ButtonSize.Compact,
		})
	}
}

function buildImapCredentials(data: MultiUserMigrationData): ImapCredentials {
	return {
		host: data.host,
		port: data.port,
		username: data.adminUsername,
		password: data.adminPassword || undefined,
		tokenEndpointResponse: data.imapAccountOAuthToken,
		customCertificateData: data.customCertificateData,
		ignoreCertificateErrors: data.ignoreCertificateErrors,
		useSSL: data.useSSL,
		provider: data.provider,
	}
}

/**
 * For OAuth providers, opens the OAuth window to obtain a token first (mirroring
 * `ImapImportIntroductionPage`'s single-mailbox-import behavior: the whole flow runs inline before
 * advancing, and the caller keeps the Continue button disabled for the duration instead of navigating
 * away immediately). Either way, once credentials/token are available, verifies the IMAP connection can
 * actually be established (reusing the same connection-verification/cert-error machinery as the
 * single-mailbox IMAP import wizard) before allowing the admin to continue.
 */
async function authenticateAndVerifyConnection(data: MultiUserMigrationData): Promise<boolean> {
	if (data.isImapServerSupportingOAuth) {
		const config = data.oauthConfig
		if (config === undefined) {
			throw new ProgrammingError("The provider is set to support OAuth without having a config, please review ImapKnownConfigs.ts")
		}
		const oauthHandler = new OAuthHandler(config, mailLocator.serviceExecutor)
		try {
			await oauthHandler.setupOauthLoginParams({ login_hint: data.adminUsername })
		} catch (e) {
			await Dialog.message(lang.getTranslation("migrationOAuthNetworkDiscoveryFailure_msg", { "{url}": config.server }))
			return false
		}
		const responseUrl = await mailLocator
			.getImapMailImportController()
			.openOauthAuthenticationWindow(oauthHandler.buildAuthorizationUrl(), config.redirectUri)
		if (!responseUrl) {
			await Dialog.message("migrationOAuthWindowClosedFailure_msg")
			return false
		}
		try {
			data.imapAccountOAuthToken = await oauthHandler.getAuthTokens(responseUrl)
		} catch (e) {
			await Dialog.message("migrationOAuthWindowClosedFailure_msg")
			return false
		}
	}

	return await verifyConnection(buildImapCredentials(data), data)
}

async function verifyConnection(imapCredentials: ImapCredentials, data: MultiUserMigrationData): Promise<boolean> {
	const verifyResult = await showProgressDialog("migrationVerifyingConnection_msg", mailLocator.imapImporter.verifyImapConnection(imapCredentials))
	if (verifyResult.result) {
		return true
	}

	if (verifyResult.error) {
		const imapErrorHandler = new ImapErrorHandler(mailLocator.entityClient, mailLocator.serviceExecutor)
		const handled = await imapErrorHandler.handleImapError(verifyResult.error, imapCredentials)
		if (handled.shouldRetry) {
			const updatedImapCredentials = handled.updatedImapCredentials ?? imapCredentials
			data.customCertificateData = updatedImapCredentials.customCertificateData
			data.ignoreCertificateErrors = updatedImapCredentials.ignoreCertificateErrors
			return await verifyConnection(updatedImapCredentials, data)
		}
		await Dialog.message(lang.makeTranslation("error_msg", handled.readableImapError.errorMessage))
		return false
	}

	await Dialog.message("migrationGenericError_msg")
	return false
}
