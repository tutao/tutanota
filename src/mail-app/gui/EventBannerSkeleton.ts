import { pureComponent } from "../../common/gui/base/PureComponent"
import m from "mithril"
import { styles } from "../../common/gui/styles"
import { px, size } from "../../common/gui/size"
import { Skeleton } from "../../common/gui/base/Skeleton"

export const EventBannerSkeleton = pureComponent(() =>
	m(
		".border-sm.skeleton-border-1.border-radius-m.grid.clip",
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
						"max-width": px(size.two_column_layout_width),
						width: "100%",
					},
		},
		[
			m(".flex.flex-column.center.items-center.pr-vpad-l.pl-vpad-l.pb.pt.justify-center.skeleton-bg-1.gap-vpad-xs.fill-grid-column", [
				m(Skeleton, {
					style: {
						width: "25px",
						height: "20px",
					},
				}),
				m(Skeleton, {
					style: {
						width: "36px",
						height: "40px",
					},
				}),
				m(Skeleton, {
					style: {
						width: "25px",
						height: "20px",
					},
				}),
			]),
			m(".flex.flex-column.pr-vpad-l.pl-vpad-l.pb.pt.skeleton-bg-2.gap-vpad-xs", [
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
				".flex.flex-column.pr-vpad-l.pl-vpad-l.pb.pt.skeleton-bg-2.gap-vpad-xs.skeleton-border-1",
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
