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
import { getAvailableDomains } from "../../../common/settings/mailaddress/MailAddressesUtils"
import { mailLocator } from "../../mailLocator"
import { ColumnWidth, Table, TableAttrs } from "../../../../ui/base/Table"
import { showBuyDialog } from "../../../common/subscription/BuyDialog"
import { BookingItemFeatureType } from "../../../../entities/sys/Utils"
import { toFeatureType } from "../../../common/subscription/utils/SubscriptionUtils"
import { showProgressDialog } from "../../../../ui/dialogs/ProgressDialog"
import { createAdminOAuthTokenEndpointResponse, createCustomerMigrationAdminCredentials, createCustomerMigrationImapConfiguration } from "@tutao/entities/sys"
import { createDataFile } from "../../../common/api/worker/utils/DataFile"

const EXAMPLE_CSV_FILENAME = "migration-example.csv"
const EXAMPLE_CSV_MIMETYPE = "text/csv"

assertMainOrNode()

export class MultiUserMigrationConfigureUsersPage implements Component<WizardStepComponentAttrs<MultiUserMigrationData>> {
	private isParsing = false

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
			m(".mt-16.flex.row.gap-16", [
				m(PrimaryButton, {
					label: "migrationUploadCsvFile_action",
					onclick: () => this.uploadCsv(data),
					disabled: this.isParsing,
				}),
				m(TertiaryButton, {
					label: "migrationDownloadExampleCsv_action",
					onclick: () => downloadExampleCsv(),
				}),
			]),
			data.rows.length > 0 ? this.renderPreview(data) : null,
			m(
				".flex-end.full-width.pt-32.mb-32",
				m(
					"",
					{ style: { width: "260px" } },
					m(PrimaryButton, {
						label: "migrationStartBatch_action",
						class: "wizard-next-button",
						disabled: data.rows.length === 0,
						onclick: () => ctx.goNext(),
					}),
				),
			),
		])
	}

	private renderPreview(data: MultiUserMigrationData): Children {
		const tableAttrs: TableAttrs = {
			columnHeading: [
				"migrationCsvColumnSource_label",
				"migrationCsvColumnTuta_label",
				"migrationCsvColumnType_label",
				"migrationCsvColumnAliases_label",
			],
			columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest, ColumnWidth.Small, ColumnWidth.Largest],
			showActionButtonColumn: false,
			lines: data.rows.map((row) => ({
				cells: [
					row.sourceEmail,
					row.tutaEmail,
					row.mailboxType === MailboxType.User
						? lang.getTranslationText("migrationMailboxTypeUser_label")
						: lang.getTranslationText("migrationMailboxTypeShared_label"),
					row.aliases.join(", "),
				],
			})),
		}
		return m(".mt-16", [m(".small.mb-8", lang.getTranslation("migrationCsvRowsFound_msg", { "{count}": data.rows.length }).text), m(Table, tableAttrs)])
	}

	private async uploadCsv(data: MultiUserMigrationData) {
		this.isParsing = true
		m.redraw()
		try {
			const [file] = await showFileChooser(FileChooserMultiMode.Single, ["csv"])
			if (!file) return

			const csvText = utf8Uint8ArrayToString(file.data)
			const availableDomains = await getAvailableDomains(mailLocator.logins)
			data.rows = parseMigrationCsv(csvText, {})
		} catch (e) {
			data.rows = []
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

/** Wizard step `onNext` hook: buys the required seats, creates the customer migration record and runs the batch. */
export async function migrationConfigureUsersOnNext(ctx: WizardStepContext<MultiUserMigrationData>): Promise<boolean> {
	const data = ctx.viewModel
	if (data.rows.length === 0) {
		await Dialog.message("noInputWasMade_msg")
		return false
	}

	const unavailable = await showProgressDialog(
		"migrationCheckingAddresses_msg",
		mailLocator.getCustomerMigrationController().findUnavailableTutaEmails(data.rows),
	)
	if (unavailable.length > 0) {
		await Dialog.message(lang.getTranslation("migrationTutaAddressesUnavailable_msg", { "{addresses}": unavailable.join(", ") }))
		return false
	}

	const userRowCount = data.rows.filter((row) => row.mailboxType === MailboxType.User).length
	const sharedRowCount = data.rows.length - userRowCount

	const userController = mailLocator.logins.getUserController()
	const planType = await userController.getPlanType()
	const isNewPaidPlan = await userController.isNewPaidPlan()

	if (userRowCount > 0) {
		const accepted = await showBuyDialog({
			featureType: isNewPaidPlan ? toFeatureType(planType) : BookingItemFeatureType.LegacyUsers,
			bookingText: "bookingItemUsersIncluding_label",
			count: userRowCount,
			freeAmount: 0,
			reactivate: false,
		})
		if (!accepted) return false
	}

	if (sharedRowCount > 0) {
		const accepted = await showBuyDialog({
			featureType: BookingItemFeatureType.SharedMailGroup,
			bookingText: "sharedMailbox_label",
			count: sharedRowCount,
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
				data.rows,
				{
					provider: data.provider,
					host: data.host,
					port: data.port.toString(),
					useSSL: data.useSSL,
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
