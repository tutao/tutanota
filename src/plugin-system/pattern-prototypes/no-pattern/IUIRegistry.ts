export interface IUIRegistry {
	mail: IMail
}

export interface IMail {
	mailView: IMailView
}

export interface IMailView {
	dotMenu: IDotMenu
}

export interface IDotMenu {
	add(icon: string, name: string, action: () => void): void
	remove(name: string): void
}
