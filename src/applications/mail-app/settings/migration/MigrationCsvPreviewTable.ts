import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { MigrationMailboxRow } from "./MigrationCsvParser"
import { MigrationCsvPreviewRow } from "./MigrationCsvPreviewRow"

const GRID_COLUMNS = "32px minmax(160px, 1fr) minmax(160px, 1fr) 120px minmax(120px, 1fr)"

export interface MigrationCsvPreviewTableAttrs {
	rows: ReadonlyArray<MigrationMailboxRow>
	selectedSourceEmails: ReadonlySet<string>
	onToggleRow: (sourceEmail: string) => void
	onToggleSelectAll: () => void
}

/**
 * The CSV upload preview table: one row per parsed CSV row, with a checkbox to include/exclude it from the
 * batch (all rows are selected by default). Mirrors `MigrationMailboxTable`'s grid/subgrid + multiselect
 * pattern, controlled from the wizard's view model instead of owning its own selection state, since the
 * parent needs to read the selection to filter which rows actually get created/migrated.
 */
export class MigrationCsvPreviewTable implements Component<MigrationCsvPreviewTableAttrs> {
	view({ attrs }: Vnode<MigrationCsvPreviewTableAttrs>): Children {
		const { rows, selectedSourceEmails, onToggleRow, onToggleSelectAll } = attrs
		const allSelected = rows.length > 0 && rows.every((row) => selectedSourceEmails.has(row.sourceEmail))

		return m(".mt-16", [
			m(".small.mb-8", lang.getTranslation("migrationCsvRowsFound_msg", { "{count}": rows.length }).text),
			m(".mt-8.grid", { style: { "grid-template-columns": GRID_COLUMNS } }, [
				m(".small.pb-8.subgrid-columns.fill-grid-row.text-fade", [
					m(
						"div",
						m("input.checkbox", {
							type: "checkbox",
							checked: allSelected,
							onchange: onToggleSelectAll,
						}),
					),
					m("div", lang.getTranslationText("migrationCsvColumnSource_label")),
					m("div", lang.getTranslationText("migrationCsvColumnTuta_label")),
					m("div", lang.getTranslationText("migrationCsvColumnType_label")),
					m("div", lang.getTranslationText("migrationCsvColumnAliases_label")),
				]),
				rows.map((row) =>
					m(MigrationCsvPreviewRow, {
						key: row.sourceEmail,
						row,
						selected: selectedSourceEmails.has(row.sourceEmail),
						onToggleSelected: () => onToggleRow(row.sourceEmail),
					}),
				),
			]),
		])
	}
}
