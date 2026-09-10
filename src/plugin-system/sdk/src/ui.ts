export interface Ui {
	registerButton(): void
	displayTextPopup(s: string): void
}

interface Popup {
	text(s: string): void
	inputField(s: string): void
}
