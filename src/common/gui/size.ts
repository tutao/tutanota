import { assertMainOrNodeBoot } from "../api/common/Env"

assertMainOrNodeBoot()
export const size = {
	/*
	 Base & core size
	 Use core sizes whenever it's possible.
	 It reduces the cognitive load on users, and enable developers to make better and faster decisions with fewer options.
	 Increments of 4 (base) are allowed for design flexibility, but try to use the core sizes first.
	 See also: https://www.figma.com/design/AGqWHYG9dYRMCFcW5sKWhp/Switch---Tuta-Design-System?node-id=19-4
	*/
	base_4: 4,
	core_8: 8,
	core_16: 16,
	core_24: 24,
	core_32: 32,
	core_40: 40,
	core_48: 48,
	core_56: 56,
	core_64: 64,
	core_72: 72,
	core_80: 80,
	core_96: 96,
	core_112: 112,
	core_128: 128,

	// Spacings
	get spacing_4(): number {
		return this.base_4
	},
	get spacing_8(): number {
		return this.core_8
	},
	get spacing_12(): number {
		return this.core_8 + this.base_4
	},
	get spacing_16(): number {
		return this.core_16
	},
	get spacing_24(): number {
		return this.core_24
	},
	get spacing_32(): number {
		return this.core_32
	},
	get spacing_48(): number {
		return this.core_48
	},
	get spacing_64(): number {
		return this.core_64
	},

	// Icons
	get icon_12(): number {
		return this.core_8 + this.base_4
	},
	get icon_16(): number {
		return this.core_16
	},
	get icon_20(): number {
		return this.core_16 + this.base_4
	},
	get icon_24(): number {
		return this.core_24
	},
	get icon_32(): number {
		return this.core_32
	},
	get icon_64(): number {
		return this.core_64
	},
	get icon_80(): number {
		return this.core_80
	},

	// Radii
	get radius_4(): number {
		return this.base_4
	},
	get radius_8(): number {
		return this.core_8
	},
	get radius_12(): number {
		return this.core_8 + this.base_4
	},
	get radius_16(): number {
		return this.core_16
	},
}

export const font_size = {
	base: 16,
	smaller: 14,
	small: 12,
	line_height: 1.428571429,
	line_height_m: 1.6,
	line_height_l: 1.8,

	get line_height_input(): number {
		return this.base + 8
	},
}

export const layout_size = {
	get calendar_line_height(): number {
		return font_size.small + 6
	},

	get calendar_hour_height(): number {
		return (this.calendar_line_height + 2 * this.calendar_event_border + this.calendar_day_event_padding) * 4
	},

	calendar_days_header_height: 25,
	calendar_hour_width: 80,
	calendar_hour_width_mobile: 30,
	calendar_event_margin: 6,
	calendar_event_margin_mobile: 2,
	calendar_event_border: 1,
	calendar_day_event_padding: 2,
	drawer_menu_width: 44,
	column_width_s_desktop: 135,
	column_width_s_mobile: 70,
	first_col_min_width: 240,
	first_col_max_width: 300,
	second_col_min_width: 300,
	second_col_max_width: 350,
	third_col_min_width: 600,
	third_col_max_width: 2400,
	only_show_in_single_column_min_max_width: 10000, // viewport >= every mobile device viewport

	get desktop_layout_width(): number {
		return this.first_col_min_width + this.second_col_min_width + this.third_col_min_width
	},

	get two_column_layout_width(): number {
		return this.second_col_min_width + this.third_col_min_width
	},

	column_resize_element_width: 5,
}

export const component_size = {
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
	dot_size: 7,
	checkbox_size: 14,
	checkbox_border_size: 2,
	get checkbox_helper_text_margin(): number {
		return this.checkbox_size + this.checkbox_border_size + size.spacing_4
	},
}

export function px(value: number): string {
	return value + "px"
}
