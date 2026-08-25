import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { MigrationMailboxRow } from "./MigrationCsvParser"
import { MigrationCsvPreviewRow } from "./MigrationCsvPreviewRow"
import { MigrationSortArrow } from "./MigrationSortArrow"

const GRID_COLUMNS = "32px minmax(160px, 1fr) minmax(160px, 1fr) 120px minmax(120px, 1fr)"

function compareString(s1: string, s2: string): number {
	return s1.toLowerCase().localeCompare(s2.toLowerCase())
}

/** Column a `MigrationCsvPreviewTable` can be sorted by - mirrors `MigrationMailboxTable`'s `MigrationSortColumn`. */
const enum PreviewSortColumn {
	sourceEmail = "sourceEmail",
	tutaEmail = "tutaEmail",
	mailboxType = "mailboxType",
	aliases = "aliases",
}
type SortOrder = "asc" | "desc"
interface PreviewSortingPreference {
	column: PreviewSortColumn
	order: SortOrder
}

const SORT_COMPARATORS: Record<PreviewSortColumn, (a: MigrationMailboxRow, b: MigrationMailboxRow) => number> = {
	[PreviewSortColumn.sourceEmail]: (a, b) => compareString(a.sourceEmail, b.sourceEmail),
	[PreviewSortColumn.tutaEmail]: (a, b) => compareString(a.tutaEmail, b.tutaEmail),
	[PreviewSortColumn.mailboxType]: (a, b) => compareString(a.mailboxType, b.mailboxType),
	[PreviewSortColumn.aliases]: (a, b) => compareString(a.aliases.join(", "), b.aliases.join(", ")),
}

export interface MigrationCsvPreviewTableAttrs {
	rows: ReadonlyArray<MigrationMailboxRow>
	selectedSourceEmails: ReadonlySet<string>
	onToggleRow: (sourceEmail: string) => void
	onToggleSelectAll: () => void
}

/**
 * The CSV upload preview table: one row per parsed CSV row, with a checkbox to include/exclude it from the
 * batch (all rows are selected by default). Mirrors `MigrationMailboxTable`'s grid/subgrid + multiselect +
 * sortable-header pattern, but selection is controlled from the wizard's view model instead of owned locally,
 * since the parent needs to read the selection to filter which rows actually get created/migrated.
 */
export class MigrationCsvPreviewTable implements Component<MigrationCsvPreviewTableAttrs> {
	private sortingPreference: PreviewSortingPreference = { column: PreviewSortColumn.sourceEmail, order: "asc" }

	view({ attrs }: Vnode<MigrationCsvPreviewTableAttrs>): Children {
		const { selectedSourceEmails, onToggleRow, onToggleSelectAll } = attrs
		const rows = this.sortedRows(attrs.rows)
		const allSelected = rows.length > 0 && rows.every((row) => selectedSourceEmails.has(row.sourceEmail))

		return m(".mt-16", [
			m(".small.mb-8", lang.getTranslation("migrationCsvRowsFound_msg", { "{count}": rows.length }).text),
			m(".mt-8.grid", { style: { "grid-template-columns": GRID_COLUMNS } }, [
				m(".items-center.pb-8.subgrid-columns.fill-grid-row.text-fade", [
					m(
						"div",
						m("input.checkbox", {
							type: "checkbox",
							checked: allSelected,
							onchange: onToggleSelectAll,
						}),
					),
					this.renderHeaderCell("migrationCsvColumnSource_label", PreviewSortColumn.sourceEmail),
					this.renderHeaderCell("migrationCsvColumnTuta_label", PreviewSortColumn.tutaEmail),
					this.renderHeaderCell("migrationCsvColumnType_label", PreviewSortColumn.mailboxType),
					this.renderHeaderCell("migrationCsvColumnAliases_label", PreviewSortColumn.aliases),
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

	private renderHeaderCell(label: Parameters<typeof lang.getTranslationText>[0], column: PreviewSortColumn): Children {
		return m("button.flex.items-center.gap-4.b.text-fade.click", { onclick: () => this.sort(column) }, [
			lang.getTranslationText(label),
			m(MigrationSortArrow, {
				sortOrder: column === this.sortingPreference.column ? this.sortingPreference.order : null,
			}),
		])
	}

	private sortedRows(rows: ReadonlyArray<MigrationMailboxRow>): MigrationMailboxRow[] {
		const comparator = SORT_COMPARATORS[this.sortingPreference.column]
		const sorted = rows.slice().sort(comparator)
		return this.sortingPreference.order === "asc" ? sorted : sorted.reverse()
	}

	private sort(column: PreviewSortColumn): void {
		if (this.sortingPreference.column === column) {
			this.sortingPreference = { column, order: this.sortingPreference.order === "asc" ? "desc" : "asc" }
		} else {
			this.sortingPreference = { column, order: "asc" }
		}
	}
}
