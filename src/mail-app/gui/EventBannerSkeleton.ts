import { pureComponent } from "../../common/gui/base/PureComponent"
import m from "mithril"
import { styles } from "../../common/gui/styles"
import { layout_size, px, size } from "../../common/gui/size"
import { Skeleton } from "../../common/gui/base/Skeleton"
import { theme } from "../../common/gui/theme.js"

export const EventBannerSkeleton = pureComponent(() =>
	m(
		".border-sm.skeleton-border-1.border-radius-8.grid.clip",
		{
			class: styles.isSingleColumnLayout() ? "" : "fit-content",
			style: styles.isSingleColumnLayout()
				? {
						"grid-template-columns": "min-content 1fr",
						"grid-template-rows": "1fr 1fr",
						"max-width": "100%",
						width: "100%",
					}
				: {
						"grid-template-columns": "min-content 40% 1fr",
						"max-width": px(layout_size.two_column_layout_width),
						width: "100%",
					},
		},
		[
			m(".flex.flex-column.center.items-center.pr-32.pl-32.pb-16.pt-16.justify-center.skeleton-bg-1.gap-4.fill-grid-column", [
				m(Skeleton, {
					style: {
						width: "25px",
						height: "20px",
						backgroundColor: theme.surface_container_highest,
					},
				}),
				m(Skeleton, {
					style: {
						width: "36px",
						height: "40px",
						backgroundColor: theme.surface_container_highest,
					},
				}),
				m(Skeleton, {
					style: {
						width: "25px",
						height: "20px",
						backgroundColor: theme.surface_container_highest,
					},
				}),
			]),
			m(".flex.flex-column.pr-32.pl-32.pb-16.pt-16.skeleton-bg-2.gap-4", [
				m(Skeleton, {
					style: {
						width: "75%",
						height: "30px",
					},
				}),
				m(Skeleton, {
					style: {
						width: "60%",
						height: "18px",
					},
				}),
				m(Skeleton, {
					style: {
						width: styles.isSingleColumnLayout() ? "70%" : "100%",
						height: "40px",
					},
				}),
			]),
			m(
				".flex.flex-column.pr-32.pl-32.pb-16.pt-16.skeleton-bg-2.gap-4.skeleton-border-1",
				{
					class: styles.isSingleColumnLayout() ? "border-sm border-left-none border-right-none border-bottom-none" : "border-left-sm",
				},
				[
					m(Skeleton, {
						style: {
							width: "75%",
							height: "30px",
						},
					}),
					m(Skeleton, {
						style: {
							width: "50%",
							height: "18px",
						},
					}),
					m(Skeleton, {
						style: {
							width: styles.isSingleColumnLayout() ? "100%" : "100%",
							height: styles.isSingleColumnLayout() ? "100%" : "120px",
						},
					}),
				],
			),
		],
	),
)
