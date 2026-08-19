import m, { Children, Component, Vnode } from "mithril"
import { MultiUserMigrationData } from "./AddMultiUserMigrationWizard"
import { assertMainOrNode } from "@tutao/app-env"
import { WizardStepComponentAttrs } from "../../../../ui/base/wizard/WizardStep"
import { WizardStepContext } from "../../../../ui/base/wizard/WizardController"
import { TitleSection, TitleSectionAttrs } from "../../../../ui/TitleSection"
import { Icons } from "../../../../ui/base/icons/Icons"
import { theme } from "../../../../ui/theme"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { px, size } from "../../../../ui/size"
import { PrimaryButton, TertiaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { Dialog } from "../../../../ui/base/Dialog"
import { showFileChooser, FileChooserMultiMode } from "../../../common/file/FileController"
import { renderCsv, stringToUtf8Uint8Array, utf8Uint8ArrayToString } from "../../../../platform-kit/utils"
import { MailboxType, parseMigrationCsv } from "./MigrationCsvParser"
import { ParserError } from "../../../common/misc/parsing/ParserCombinator"
import { mailLocator } from "../../mailLocator"
import { showBuyDialog } from "../../../common/subscription/BuyDialog"
import { BookingItemFeatureType } from "../../../../entities/sys/Utils"
import { toFeatureType } from "../../../common/subscription/utils/SubscriptionUtils"
import { showProgressDialog } from "../../../../ui/dialogs/ProgressDialog"
import { createAdminOAuthTokenEndpointResponse, createCustomerMigrationAdminCredentials, createCustomerMigrationImapConfiguration } from "@tutao/entities/sys"
import { createDataFile } from "../../../common/api/worker/utils/DataFile"
import { MigrationCsvPreviewTable } from "./MigrationCsvPreviewTable"

const EXAMPLE_CSV_FILENAME = "migration-example.csv"
const EXAMPLE_CSV_MIMETYPE = "text/csv"

assertMainOrNode()

export class MultiUserMigrationConfigureUsersPage implements Component<WizardStepComponentAttrs<MultiUserMigrationData>> {
	private isParsing = false

	oncreate({ attrs }: Vnode<WizardStepComponentAttrs<MultiUserMigrationData>>) {
		// Once the admin has entered IMAP credentials and reached this step, going back would let them silently
		// change provider/credentials after already committing to them - lock steps 1 and 2 (provider, auth).
		attrs.ctx.lockAllPreviousSteps()
	}

	view({ attrs: { ctx } }: Vnode<WizardStepComponentAttrs<MultiUserMigrationData>>): Children {
		const data = ctx.viewModel
		return m(".mt-24", [
			m(TitleSection, {
				icon: Icons.CloudUploadFilled,
				iconOptions: { color: theme.on_surface_variant },
				subTitle: lang.getTranslationText("migrationUploadCsvInfo_msg"),
				title: "",
				style: {
					marginTop: px(size.spacing_16),
					borderRadius: px(size.radius_16),
				},
			} as TitleSectionAttrs),
			m(".mt-16", [
				m(PrimaryButton, {
					label: "migrationUploadCsvFile_action",
					onclick: () => this.uploadCsv(data),
					disabled: this.isParsing,
				}),
				m(
					".mt-8",
					m(TertiaryButton, {
						label: "migrationDownloadExampleCsv_action",
						onclick: () => downloadExampleCsv(),
					}),
				),
			]),
			data.rows.length > 0
				? m(MigrationCsvPreviewTable, {
						rows: data.rows,
						selectedSourceEmails: data.selectedSourceEmails,
						onToggleRow: (sourceEmail) => {
							if (data.selectedSourceEmails.has(sourceEmail)) {
								data.selectedSourceEmails.delete(sourceEmail)
							} else {
								data.selectedSourceEmails.add(sourceEmail)
							}
						},
						onToggleSelectAll: () => {
							if (data.rows.every((row) => data.selectedSourceEmails.has(row.sourceEmail))) {
								data.selectedSourceEmails.clear()
							} else {
								data.rows.forEach((row) => data.selectedSourceEmails.add(row.sourceEmail))
							}
						},
					})
				: null,
			m(
				".flex-end.full-width.pt-32.mb-32",
				m(
					"",
					{ style: { width: "260px" } },
					m(PrimaryButton, {
						label: "migrationStartBatch_action",
						class: "wizard-next-button",
						disabled: data.selectedSourceEmails.size === 0,
						onclick: () => ctx.goNext(),
					}),
				),
			),
		])
	}

	private async uploadCsv(data: MultiUserMigrationData) {
		this.isParsing = true
		m.redraw()
		try {
			const [file] = await showFileChooser(FileChooserMultiMode.Single, ["csv"])
			if (!file) return

			const csvText = utf8Uint8ArrayToString(file.data)
			data.rows = parseMigrationCsv(csvText, {})
			data.selectedSourceEmails = new Set(data.rows.map((row) => row.sourceEmail))
		} catch (e) {
			data.rows = []
			data.selectedSourceEmails = new Set()
			if (e instanceof ParserError) {
				await Dialog.message(lang.makeTranslation("error_msg", e.message))
			} else {
				await Dialog.message("migrationGenericError_msg")
			}
		} finally {
			this.isParsing = false
			m.redraw()
		}
	}
}

async function downloadExampleCsv(): Promise<void> {
	const csv = renderCsv(
		["sourceEmail", "username", "mailboxType", "aliases", "tutaEmail", "members"],
		[
			["old.user@sourcedomain.com", "jsmith", "user", "", "jsmith@example.tuta.com", ""],
			["shared.mailbox@sourcedomain.com", "sales", "shared", "sales-alias@example.tuta.com", "sales@example.tuta.com", "jsmith@example.tuta.com"],
		],
		",",
	)
	const dataFile = createDataFile(EXAMPLE_CSV_FILENAME, EXAMPLE_CSV_MIMETYPE, stringToUtf8Uint8Array(csv))
	await mailLocator.fileController.saveDataFile(dataFile)
}

/** Wizard step `onNext` hook: buys the required seats (for newly-created mailboxes only), creates the customer migration record and runs the batch. */
export async function migrationConfigureUsersOnNext(ctx: WizardStepContext<MultiUserMigrationData>): Promise<boolean> {
	const data = ctx.viewModel
	const rows = data.rows.filter((row) => data.selectedSourceEmails.has(row.sourceEmail))
	if (rows.length === 0) {
		await Dialog.message("noInputWasMade_msg")
		return false
	}

	const customer = await mailLocator.logins.getUserController().reloadCustomer()
	const classifications = await showProgressDialog(
		"migrationCheckingAddresses_msg",
		mailLocator.getCustomerMigrationController().classifyTutaEmails(rows, customer.userGroups, customer.teamGroups),
	)
	const unavailable = rows.filter((row) => classifications.get(row.tutaEmail)?.kind === "unavailable").map((row) => row.tutaEmail)
	if (unavailable.length > 0) {
		await Dialog.message(lang.getTranslation("migrationTutaAddressesUnavailable_msg", { "{addresses}": unavailable.join(", ") }))
		return false
	}

	// Only mailboxes that will actually be newly created need to be bought - rows reusing an existing user/shared mailbox don't.
	const newUserRowCount = rows.filter((row) => row.mailboxType === MailboxType.User && classifications.get(row.tutaEmail)?.kind === "new").length
	const newSharedRowCount = rows.filter((row) => row.mailboxType === MailboxType.Shared && classifications.get(row.tutaEmail)?.kind === "new").length

	const userController = mailLocator.logins.getUserController()
	const planType = await userController.getPlanType()
	const isNewPaidPlan = await userController.isNewPaidPlan()

	if (newUserRowCount > 0) {
		const accepted = await showBuyDialog({
			featureType: isNewPaidPlan ? toFeatureType(planType) : BookingItemFeatureType.LegacyUsers,
			bookingText: "bookingItemUsersIncluding_label",
			count: newUserRowCount,
			freeAmount: 0,
			reactivate: false,
		})
		if (!accepted) return false
	}

	if (newSharedRowCount > 0) {
		const accepted = await showBuyDialog({
			featureType: BookingItemFeatureType.SharedMailGroup,
			bookingText: "sharedMailbox_label",
			count: newSharedRowCount,
			freeAmount: 0,
			reactivate: false,
		})
		if (!accepted) return false
	}

	const imapConfiguration = createCustomerMigrationImapConfiguration({
		host: data.host,
		port: data.port.toString(),
		useSSL: data.useSSL,
		ignoreCertificateErrors: data.ignoreCertificateErrors,
		customCertificateData: data.customCertificateData,
		adminCredentials: createCustomerMigrationAdminCredentials({
			username: data.adminUsername,
			password: data.adminPassword || null,
			adminOAuthTokenEndpointResponse: data.imapAccountOAuthToken
				? createAdminOAuthTokenEndpointResponse({
						accessToken: data.imapAccountOAuthToken.access_token,
						refreshToken: data.imapAccountOAuthToken.refresh_token ?? null,
						expiresIn: data.imapAccountOAuthToken.expires_in !== undefined ? data.imapAccountOAuthToken.expires_in.toString() : null,
						tokenType: data.imapAccountOAuthToken.token_type,
					})
				: null,
		}),
	})

	const operation = mailLocator.operationProgressTracker.startNewOperation()
	try {
		const customerMigrationInformation = await mailLocator.customerMigrationFacade.createCustomerMigrationInformation(imapConfiguration)
		data.results = await showProgressDialog(
			"migrationRunningBatch_msg",
			mailLocator.getCustomerMigrationController().migrateUsersFromCsv(
				rows,
				classifications,
				{
					provider: data.provider,
					host: data.host,
					port: data.port.toString(),
					useSSL: data.useSSL,
					customCertificateData: data.customCertificateData,
					ignoreCertificateErrors: data.ignoreCertificateErrors,
					customerMigrationInformation,
				},
				operation.id,
			),
			operation.progress,
		)
		return true
	} catch (e) {
		await Dialog.message("migrationGenericError_msg")
		return false
	} finally {
		operation.done()
	}
}
