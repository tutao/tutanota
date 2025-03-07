import m, { Children, Component } from "mithril"
import { Button, ButtonType } from "../src/common/gui/base/Button"
import { lang } from "../src/common/misc/LanguageViewModel"
import { styles } from "../src/common/gui/styles"
import { ThemeController } from "../src/common/gui/ThemeController"
import stream from "mithril/stream"
import { Tutao } from "../src/global"
import { theme } from "../src/common/gui/theme"
import { themes } from "../src/common/gui/builtinThemes"
import { IconButton } from "../src/common/gui/base/IconButton"
import { Icons, IconsSvg } from "../src/common/gui/base/icons/Icons"
import { ButtonSize } from "../src/common/gui/base/ButtonSize"
import { noOp } from "@tutao/tutanota-utils"
import { TextField, TextFieldType } from "../src/common/gui/base/TextField"
import { DropDownSelector, SelectorItemList } from "../src/common/gui/base/DropDownSelector"
import en from "../src/mail-app/translations/en"
import { root } from "../src/RootView"
import { AllIcons, Icon, IconSize } from "../src/common/gui/base/Icon"
import { client } from "../src/common/misc/ClientDetector"
import { BootIconsSvg } from "../src/common/gui/base/icons/BootIcons"
import { LoginButton, LoginButtonAttrs, LoginButtonType } from "../src/common/gui/base/buttons/LoginButton"
import { pureComponent } from "../src/common/gui/base/PureComponent"
import * as colors from "../src/common/gui/colors"

window.tutao = {
	appState: { prefixWithoutFile: "" },
} as Tutao

class Showcase implements Component {
	view(): Children {
		return m(
			root,
			m(
				".flex.col.scroll.height-100p",
				{
					style: {
						padding: "40px 20px",
					},
				},
				[
					this.renderSection("Button", [
						m(Button, {
							label: lang.makeTranslation("label", "Primary button"),
							type: ButtonType.Primary,
						}),
						m(Button, {
							label: lang.makeTranslation("label", "Secondary button"),
							type: ButtonType.Secondary,
						}),
						m(ConfigurableButton),
					]),
					this.renderSection("Icon Button", [
						m(IconButton, {
							icon: Icons.Folder,
							title: lang.makeTranslation("label", "Normal"),
							click: noOp,
							size: ButtonSize.Normal,
						}),
						m(IconButton, {
							icon: Icons.Folder,
							title: lang.makeTranslation("label", "Compact"),
							click: noOp,
							size: ButtonSize.Compact,
						}),
						m(IconButton, {
							icon: Icons.Folder,
							title: lang.makeTranslation("label", "Large"),
							click: noOp,
							size: ButtonSize.Large,
						}),
						m(ConfigurableIconButton),
					]),
					this.renderSection("Text Field", [
						m(TextField, {
							label: lang.makeTranslation("label", "Label"),
							value: "value",
							type: TextFieldType.Text,
						}),
						m(ConfigurableTextField),
					]),
					this.renderSection("Login button", [
						m(LoginButton, {
							label: lang.makeTranslation("label", "Login button"),
							disabled: false,
							onclick: noOp,
							type: LoginButtonType.FlexWidth,
						} satisfies LoginButtonAttrs),
						m(LoginButton, {
							label: lang.makeTranslation("label", "Login button"),
							disabled: true,
							onclick: noOp,
							type: LoginButtonType.FlexWidth,
						} satisfies LoginButtonAttrs),
						m(ConfigurableLoginButton),
					]),
					this.renderSection("Icons", [m(IconsShowcase)]),
					this.renderSection("Colors", [m(ColorsShowcase)]),
				],
			),
		)
	}

	renderSection(header: string, children: Children): Children {
		return m(".flex.col", [m("h2.mb", header), m(".flex.column-gap", children)])
	}
}

class ColorsShowcase implements Component {
	view(): Children {
		return m(".flex.col", [
			m(
				".flex.col",
				Object.entries(theme).map(([name, value]) => {
					if (value.startsWith("#")) {
						return m(ColorSwatch, { name, value })
					} else {
						return null
					}
				}),
			),
			m("hr"),
			Object.entries(colors).map(([name, value]) => {
				if (value.startsWith("#")) {
					return m(ColorSwatch, { name, value })
				} else {
					return null
				}
			}),
		])
	}
}

const ColorSwatch = pureComponent(({ name, value }: { name: string; value: string }) => {
	return m(
		".flex",
		m("b", name),
		m("", {
			style: {
				width: "60px",
				height: "20px",
				backgroundColor: value,
			},
		}),
	)
})

class IconsShowcase implements Component {
	view(): Children {
		const allIcons = [...Object.keys(IconsSvg), ...Object.keys(BootIconsSvg)] as readonly AllIcons[]
		return m(
			".flex.flex-wrap.gap-hpad",
			allIcons.map((icon) =>
				m(Icon, {
					icon,
					size: IconSize.XL,
					style: {
						fill: theme.content_button,
					},
				}),
			),
		)
	}
}

class ConfigurableButton implements Component {
	private label = "Configurable"
	private type: ButtonType = ButtonType.Primary

	view(): Children {
		return m(".flex.col", [
			m(TextField, {
				label: lang.makeTranslation("label", "Label"),
				value: this.label,
				oninput: (v) => (this.label = v),
			}),
			m(DropDownSelector, {
				label: lang.makeTranslation("label", "Button type"),
				items: [
					{ name: "Primary", value: ButtonType.Primary },
					{ name: "Secondary", value: ButtonType.Secondary },
				],
				selectedValue: this.type,
				selectionChangedHandler: (v: ButtonType) => (this.type = v),
			}),
			m(Button, {
				label: lang.makeTranslation("label", this.label),
				type: this.type,
			}),
		])
	}
}

class ConfigurableIconButton implements Component {
	private title = "Configurable"
	private size: ButtonSize = ButtonSize.Normal
	private icon: AllIcons = Icons.Folder

	view(): Children {
		return m(".flex.col", [
			m(TextField, {
				label: lang.makeTranslation("label", "Label"),
				value: this.title,
				oninput: (v) => (this.title = v),
			}),
			m(DropDownSelector, {
				label: lang.makeTranslation("label", "Button size"),
				items: [
					{ name: "Normal", value: ButtonSize.Normal },
					{ name: "Large", value: ButtonSize.Large },
					{ name: "Compact", value: ButtonSize.Compact },
				],
				selectedValue: this.size,
				selectionChangedHandler: (v: ButtonSize) => (this.size = v),
			}),
			m(DropDownSelector, {
				label: lang.makeTranslation("label", "Icon"),
				items: [...Object.keys(IconsSvg), ...Object.keys(BootIconsSvg)].map((key) => {
					return { name: key, value: key, icon: key }
				}) as SelectorItemList<AllIcons>,
				selectedValue: this.icon,
				selectionChangedHandler: (v: AllIcons) => (this.icon = v),
			}),
			m(IconButton, {
				icon: this.icon,
				title: lang.makeTranslation("label", this.title),
				click: noOp,
				size: this.size,
			}),
		])
	}
}

class ConfigurableTextField implements Component {
	private label = "Configurable"
	private type: TextFieldType = TextFieldType.Text
	private value: string = ""
	private icon: AllIcons | null = null
	private disabled = false

	view(): Children {
		const icon = this.icon
		const allIcons = [...Object.keys(IconsSvg), ...Object.keys(BootIconsSvg)] as readonly AllIcons[]
		const iconItems: SelectorItemList<AllIcons> = allIcons.map((key) => {
			return { name: key, value: key, icon: key }
		})
		return m(".flex.col", [
			m(TextField, {
				label: lang.makeTranslation("label", "Label"),
				value: this.label,
				oninput: (v) => (this.label = v),
			}),
			m(DropDownSelector, {
				label: lang.makeTranslation("label", "Type"),
				items: [
					{ name: "Text", value: TextFieldType.Text },
					{ name: "Email", value: TextFieldType.Email },
					{ name: "Area", value: TextFieldType.Area },
					{ name: "Number", value: TextFieldType.Number },
					{ name: "Url", value: TextFieldType.Url },
					{ name: "Date", value: TextFieldType.Date },
					{ name: "Time", value: TextFieldType.Time },
				],
				selectedValue: this.type,
				selectionChangedHandler: (v: TextFieldType) => (this.type = v),
			}),
			m(DropDownSelector, {
				label: lang.makeTranslation("label", "Injections right (compact icon)"),
				items: [...iconItems, { name: "none", value: null }] satisfies SelectorItemList<AllIcons | null>,
				selectedValue: this.icon,
				selectionChangedHandler: (v: AllIcons) => (this.icon = v),
			}),
			m(DropDownSelector, {
				label: lang.makeTranslation("label", "Disabled"),
				items: [
					{ name: "false", value: false },
					{ name: "true", value: true },
				],
				selectedValue: this.disabled,
				selectionChangedHandler: (v: boolean) => (this.disabled = v),
			}),
			m(TextField, {
				label: lang.makeTranslation("label", this.label),
				type: this.type,
				value: this.value,
				oninput: (v) => (this.value = v),
				disabled: this.disabled,
				injectionsRight: icon
					? () =>
							m(IconButton, {
								icon,
								title: lang.makeTranslation("label", "injection right"),
								size: ButtonSize.Compact,
								click: noOp,
							})
					: undefined,
			}),
		])
	}
}

class ConfigurableLoginButton {
	label = "Login"
	disabled = false

	view() {
		return m(".flex.col", [
			m(TextField, {
				label: lang.makeTranslation("label", "Label"),
				value: this.label,
				oninput: (v) => (this.label = v),
			}),
			m(DropDownSelector, {
				label: lang.makeTranslation("label", "Disabled"),
				items: [
					{ name: "false", value: false },
					{ name: "true", value: true },
				],
				selectedValue: this.disabled,
				selectionChangedHandler: (v: boolean) => (this.disabled = v),
			}),
			m(LoginButton, {
				label: lang.makeTranslation("label", this.label),
				disabled: this.disabled,
				onclick: noOp,
				type: LoginButtonType.FlexWidth,
			}),
		])
	}
}

lang.init(en)
Object.assign(theme, themes().light)
client.init(navigator.userAgent, "web")
styles.init({ observableThemeId: stream() } as Partial<ThemeController> as ThemeController)

await import("../src/common/gui/main-styles.js")

m.mount(document.body, Showcase)
