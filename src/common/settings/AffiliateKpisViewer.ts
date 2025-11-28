import { UpdatableSettingsDetailsViewer } from "./Interfaces.js"
import m from "mithril"
import { EntityUpdateData } from "../api/common/utils/EntityUpdateUtils.js"
import { ListColumnWrapper } from "../gui/ListColumnWrapper.js"
import { ColumnWidth, Table, TableLineAttrs } from "../gui/base/Table.js"
import { mailLocator } from "../../mail-app/mailLocator.js"
import { formatShortMonthYear2Digit } from "../misc/Formatter.js"
import { AffiliateViewModel } from "./AffiliateViewModel.js"
import { formatPrice } from "../subscription/utils/PriceUtils.js"
import { LazyLoaded } from "@tutao/tutanota-utils"
import { DateTime } from "luxon"

export class AffiliateKpisViewer implements UpdatableSettingsDetailsViewer {
	private readonly affiliateViewModel: LazyLoaded<AffiliateViewModel> = new LazyLoaded<AffiliateViewModel>(async () => await mailLocator.affiliateViewModel())

	renderView(): m.Children {
		return m(
			ListColumnWrapper,
			m(
				".flex.flex-column.fill-absolute.plr-24",
				m("h4.mt-32", "KPIs"),
				m(
					".overflow-auto.pt-8",
					{ style: { height: "100%" } },
					m(
						"",
						{ style: { minWidth: "800px" } },
						m(Table, {
							columnHeading: [
								{ label: "month_label" },
								{ label: "affiliateSettingsNewFree_label", helpText: "affiliateSettingsNewFree_msg" },
								{ label: "affiliateSettingsNewPaid_label", helpText: "affiliateSettingsNewPaid_msg" },
								{
									label: "affiliateSettingsTotalFree_label",
									helpText: "affiliateSettingsTotalFree_msg",
								},
								{
									label: "affiliateSettingsTotalPaid_label",
									helpText: "affiliateSettingsTotalPaid_msg",
								},
								{
									label: "affiliateSettingsCommission_label",
									helpText: "affiliateSettingsCommission_msg",
								},
							],
							columnWidths: [
								ColumnWidth.Largest,
								ColumnWidth.Largest,
								ColumnWidth.Largest,
								ColumnWidth.Largest,
								ColumnWidth.Largest,
								ColumnWidth.Largest,
							],
							showActionButtonColumn: false,
							addButtonAttrs: null,
							lines: this.renderRows(),
						}),
					),
				),
			),
		)
	}

	private renderRows(): TableLineAttrs[] {
		if (this.affiliateViewModel.isLoaded()) {
			const avm = this.affiliateViewModel.getSync()!
			return (avm.data?.kpis ?? [])
				.slice()
				.sort((a, b) => Number(b.monthTimestamp) - Number(a.monthTimestamp))
				.map((month) => {
					const date = DateTime.fromJSDate(new Date(Number(month.monthTimestamp)))
						.minus({ day: 3 })
						.toJSDate() // Remove 3 days to avoid timezones issues (just in case), since the original date is the end of the month.

					return {
						cells: [
							formatShortMonthYear2Digit(date),
							month.newFree,
							month.newPaid,
							month.totalFree,
							month.totalPaid,
							formatPrice(Number(month.commission), true),
						],
					}
				})
		} else {
			this.affiliateViewModel.getAsync().then(() => m.redraw())
			return []
		}
	}

	entityEventsReceived(updates: readonly EntityUpdateData[]): Promise<unknown> {
		return Promise.resolve()
	}
}
