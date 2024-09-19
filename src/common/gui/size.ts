import { assertMainOrNodeBoot } from "../api/common/Env"

assertMainOrNodeBoot()
export const size = {
	icon_size_xl: 32,
	icon_size_large: 24,
	icon_size_medium_large: 20,
	icon_size_medium: 16,
	icon_size_small: 12,
	icon_message_box: 80,
	hpad_small: 5,
	hpad: 10,
	hpad_medium: 20,
	hpad_large: 20,
	hpad_large_mobile: 6,
	hpad_button: 6,
	hpad_nav_button: 9,
	// 6 + 9 = 15px
	vpad_xs: 3,
	vpad_xsm: 4,
	vpad: 16,
	vpad_small: 8,
	vpad_ml: 25,
	vpad_large: 32,
	vpad_xl: 48,
	vpad_xxl: 64,
	text_bubble_tpad: 20,
	border_radius_small: 3,
	border_radius: 6,
	border_radius_medium: 8,
	border_radius_larger: 9,
	border_selection: 4,
	font_size_base: 16,
	font_size_smaller: 14,
	font_size_small: 12,
	button_height: 44,
	button_height_accent: 40,
	button_height_bubble: 30,
	button_height_compact: 30,
	button_icon_bg_size: 32,
	button_floating_size: 56,
	icon_segment_control_button_height: 36,
	icon_segment_control_button_width: 48,

	navbar_height: 70,
	navbar_height_mobile: 52,
	bottom_nav_bar: 50,
	navbar_button_width: 80,
	navbar_edge_width_mobile: 58,
	header_logo_height: 38,
	header_logo_height_mobile: 32,
	list_row_height: 68,
	column_width_s_desktop: 135,
	column_width_s_mobile: 70,
	line_height: 1.428571429,
	// 20/14,
	line_height_m: 1.6,
	line_height_l: 1.8,

	get calendar_line_height(): number {
		return this.font_size_small + 6
	},

	get calendar_hour_height(): number {
		return (this.calendar_line_height + 2 * this.calendar_event_border + this.calendar_day_event_padding) * 4
	},

	calendar_days_header_height: 25,
	calendar_hour_width: 80,
	calendar_hour_width_mobile: 30,
	calendar_first_col_min_width: 270,
	calendar_event_margin: 6,
	calendar_event_margin_mobile: 2,
	calendar_event_border: 1,
	calendar_day_event_padding: 2,
	drawer_menu_width: 44,
	first_col_min_width: 240,
	first_col_max_width: 300,
	second_col_min_width: 300,
	second_col_max_width: 350,
	third_col_min_width: 600,
	third_col_max_width: 2400,

	// Using the breakpoint set by bootstrap to cover small tablets as well
	// https://getbootstrap.com/docs/5.0/layout/breakpoints/
	tablet_min_size: 576,

	get desktop_layout_width(): number {
		return this.first_col_min_width + this.second_col_min_width + this.third_col_min_width
	},

	get two_column_layout_width(): number {
		return this.second_col_min_width + this.third_col_min_width
	},

	dot_size: 7,
	checkbox_size: 14,
}
export const inputLineHeight: number = size.font_size_base + 8

export function px(value: number): string {
	return value + "px"
}
