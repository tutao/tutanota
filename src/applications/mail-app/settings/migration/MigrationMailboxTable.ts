import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { TertiaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { MigrationMailboxRowView, MigrationMailboxTableRow } from "./MigrationMailboxTableRow"
import { MigrationSortArrow } from "./MigrationSortArrow"

const GRID_COLUMNS = "32px minmax(160px, 1fr) minmax(200px, 1.5fr) 170px 180px"

function compareString(s1: string, s2: string): number {
	return s1.toLowerCase().localeCompare(s2.toLowerCase())
}

/** Column a `MigrationMailboxTable` can be sorted by - mirrors Drive's `SortColumn`/`SortingPreference` concept. */
const enum MigrationSortColumn {
	name = "name",
	mailAddress = "mailAddress",
	status = "status",
	password = "password",
}
type SortOrder = "asc" | "desc"
interface MigrationSortingPreference {
	column: MigrationSortColumn
	order: SortOrder
}

const SORT_COMPARATORS: Record<MigrationSortColumn, (a: MigrationMailboxRowView, b: MigrationMailboxRowView) => number> = {
	[MigrationSortColumn.name]: (a, b) => compareString(a.name, b.name),
	[MigrationSortColumn.mailAddress]: (a, b) => compareString(a.mailAddress, b.mailAddress),
	[MigrationSortColumn.status]: (a, b) => parseInt(a.status) - parseInt(b.status),
	[MigrationSortColumn.password]: (a, b) => compareString(a.initialPassword ?? "", b.initialPassword ?? ""),
}

export interface MigrationMailboxTableAttrs {
	rows: ReadonlyArray<MigrationMailboxRowView>
	onDownloadSelectedCredentials?: (rows: ReadonlyArray<MigrationMailboxRowView>) => unknown
}

/**
 * The migration status table: sortable columns and checkbox multiselect (with a small bulk-action bar),
 * mirroring the concepts the Drive app's file table uses (`DriveViewModel`'s `SortingPreference`/`sort()`,
 * `ListModel`'s `selectedItems`/`inMultiselect`) at a scale appropriate for a small, fully-in-memory table
 * (no virtualization/pagination).
 */
export class MigrationMailboxTable implements Component<MigrationMailboxTableAttrs> {
	private selectedIds = new Set<string>()
	private revealedIds = new Set<string>()
	private sortingPreference: MigrationSortingPreference = { column: MigrationSortColumn.name, order: "asc" }

	view({ attrs }: Vnode<MigrationMailboxTableAttrs>): Children {
		const rows = this.sortedRows(attrs.rows)
		const selectedRows = rows.filter((row) => this.selectedIds.has(row.mailAddress))

		return m(".mt-8", [
			selectedRows.length > 0 ? this.renderSelectionBar(selectedRows, attrs) : null,
			m(".mt-8.grid", { style: { "grid-template-columns": GRID_COLUMNS } }, [
				this.renderHeader(rows),
				rows.map((row) =>
					m(MigrationMailboxTableRow, {
						key: row.mailAddress,
						row,
						selected: this.selectedIds.has(row.mailAddress),
						onToggleSelected: () => this.toggleRow(row.mailAddress),
						revealed: this.revealedIds.has(row.mailAddress),
						onToggleRevealed: () => this.toggleRevealed(row.mailAddress),
					}),
				),
			]),
		])
	}

	private renderHeader(rows: ReadonlyArray<MigrationMailboxRowView>): Children {
		return m(".pb-8.grid.fill-grid-row.text-fade", { style: { "grid-template-columns": "subgrid" } }, [
			m(
				"div",
				m("input.checkbox", {
					type: "checkbox",
					checked: this.areAllSelected(rows),
					onchange: () => this.toggleSelectAll(rows),
				}),
			),
			this.renderHeaderCell("migrationColumnUser_label", MigrationSortColumn.name),
			this.renderHeaderCell("migrationColumnTutaAddress_label", MigrationSortColumn.mailAddress),
			this.renderHeaderCell("migrationColumnStatus_label", MigrationSortColumn.status),
			this.renderHeaderCell("migrationColumnPassword_label", MigrationSortColumn.password),
		])
	}

	private renderHeaderCell(label: Parameters<typeof lang.getTranslationText>[0], column: MigrationSortColumn): Children {
		return m("button.flex.items-center.gap-4.b.text-fade.click", { onclick: () => this.sort(column) }, [
			lang.getTranslationText(label),
			m(MigrationSortArrow, {
				sortOrder: column === this.sortingPreference.column ? this.sortingPreference.order : null,
			}),
		])
	}

	private renderSelectionBar(selectedRows: ReadonlyArray<MigrationMailboxRowView>, attrs: MigrationMailboxTableAttrs): Children {
		return m(".flex.items-center.justify-between.pb-8", [
			m(".b", lang.getTranslation("itemsSelected_label", { "{number}": selectedRows.length }).text),
			attrs.onDownloadSelectedCredentials
				? m(TertiaryButton, {
						label: "migrationDownloadCredentials_action",
						onclick: () => attrs.onDownloadSelectedCredentials!(selectedRows),
					})
				: null,
		])
	}

	private sortedRows(rows: ReadonlyArray<MigrationMailboxRowView>): MigrationMailboxRowView[] {
		const comparator = SORT_COMPARATORS[this.sortingPreference.column]
		const sorted = rows.slice().sort(comparator)
		return this.sortingPreference.order === "asc" ? sorted : sorted.reverse()
	}

	private sort(column: MigrationSortColumn): void {
		if (this.sortingPreference.column === column) {
			this.sortingPreference = { column, order: this.sortingPreference.order === "asc" ? "desc" : "asc" }
		} else {
			this.sortingPreference = { column, order: "asc" }
		}
	}

	private toggleRow(id: string): void {
		if (this.selectedIds.has(id)) {
			this.selectedIds.delete(id)
		} else {
			this.selectedIds.add(id)
		}
	}

	private toggleRevealed(id: string): void {
		if (this.revealedIds.has(id)) {
			this.revealedIds.delete(id)
		} else {
			this.revealedIds.add(id)
		}
	}

	private areAllSelected(rows: ReadonlyArray<MigrationMailboxRowView>): boolean {
		return rows.length > 0 && rows.every((row) => this.selectedIds.has(row.mailAddress))
	}

	private toggleSelectAll(rows: ReadonlyArray<MigrationMailboxRowView>): void {
		if (this.areAllSelected(rows)) {
			this.selectedIds.clear()
		} else {
			for (const row of rows) {
				this.selectedIds.add(row.mailAddress)
			}
		}
	}
}
