import m, { Children, Component, Vnode } from "mithril"
import { MultiUserMigrationData } from "./AddMultiUserMigrationWizard"
import { assertMainOrNode } from "@tutao/app-env"
import { WizardStepComponentAttrs } from "../../../../ui/base/wizard/WizardStep"
import { TitleSection, TitleSectionAttrs } from "../../../../ui/TitleSection"
import { Icons } from "../../../../ui/base/icons/Icons"
import { theme } from "../../../../ui/theme"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { px, size } from "../../../../ui/size"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { ColumnWidth, Table, TableAttrs } from "../../../../ui/base/Table"
import { renderCsv, stringToUtf8Uint8Array } from "../../../../platform-kit/utils"
import { createDataFile } from "../../../common/api/worker/utils/DataFile"
import { mailLocator } from "../../mailLocator"

assertMainOrNode()

const CREDENTIALS_CSV_FILENAME = "migration-users.csv"
const CREDENTIALS_CSV_MIMETYPE = "text/csv"

export const MultiUserMigrationSummaryPage: Component<WizardStepComponentAttrs<MultiUserMigrationData>> = {
	view({ attrs: { ctx } }: Vnode<WizardStepComponentAttrs<MultiUserMigrationData>>): Children {
		const data = ctx.viewModel
		const successCount = data.results.filter((r) => r.success).length
		const failed = data.results.filter((r) => !r.success)
		const hasCredentials = data.results.some((r) => r.success && r.generatedPassword)

		return m(".mt-24", [
			m(TitleSection, {
				icon: successCount === data.results.length ? Icons.Checkmark : Icons.InfoFilled,
				iconOptions: { color: successCount === data.results.length ? theme.success : theme.on_surface_variant },
				subTitle: lang.getTranslation("migrationBatchSuccessCount_msg", {
					"{count}": successCount,
					"{total}": data.results.length,
				}).text,
				title: lang.getTranslationText("migrationBatchSummary_title"),
				style: {
					marginTop: px(size.spacing_16),
					borderRadius: px(size.radius_16),
				},
			} as TitleSectionAttrs),
			failed.length > 0 ? renderFailures(failed) : null,
			hasCredentials
				? m(
						".mt-16",
						m(PrimaryButton, {
							label: "migrationDownloadCredentials_action",
							onclick: () => downloadCredentials(data),
						}),
					)
				: null,
			m(
				".flex-end.full-width.pt-32.mb-32",
				m(
					"",
					{ style: { width: "260px" } },
					m(PrimaryButton, {
						label: "done_action",
						class: "wizard-next-button",
						onclick: () => ctx.goNext(),
					}),
				),
			),
		])
	},
}

function renderFailures(failed: MultiUserMigrationData["results"]): Children {
	const tableAttrs: TableAttrs = {
		columnHeading: ["migrationCsvColumnSource_label", "migrationCsvColumnError_label"],
		columnWidths: [ColumnWidth.Small, ColumnWidth.Largest],
		showActionButtonColumn: false,
		lines: failed.map((result) => ({
			cells: [result.row.sourceEmail, result.errorMessage ?? ""],
		})),
	}
	return m(".mt-16", m(Table, tableAttrs))
}

async function downloadCredentials(data: MultiUserMigrationData) {
	const csv = renderCsv(
		["username", "tutaEmail", "sourceEmail", "password"],
		data.results
			.filter((r) => r.success && r.generatedPassword)
			.map((r) => [r.row.username, r.row.tutaEmail, r.row.sourceEmail, r.generatedPassword ?? ""]),
	)
	const dataFile = createDataFile(CREDENTIALS_CSV_FILENAME, CREDENTIALS_CSV_MIMETYPE, stringToUtf8Uint8Array(csv))
	await mailLocator.fileController.saveDataFile(dataFile)
}
