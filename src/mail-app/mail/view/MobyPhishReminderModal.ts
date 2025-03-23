import m, { Children } from "mithril";
import { modal, ModalComponent } from "../../../common/gui/base/Modal";
import type { Shortcut } from "../../../common/misc/KeyManager";
import { Keys } from "../../../common/api/common/TutanotaConstants";

export class MobyPhishReminderModal implements ModalComponent {
	private modalHandle?: ModalComponent;
	private senderName: string;

	constructor(senderName: string) {
		this.senderName = senderName;
	}

	view(): Children {
		return m(".modal-overlay", {
			onclick: (e: MouseEvent) => this.backgroundClick(e)
		}, [
			m(".modal-content", {
				onclick: (e: MouseEvent) => e.stopPropagation()
			}, [
				m(".dialog.elevated-bg.border-radius", {
					style: this.getModalStyle()
				}, [
					m("p", {
						style: {
							fontSize: "16px",
							fontWeight: "bold",
							textAlign: "center"
						}
					}, `We believe this is mail from ${this.senderName}. For your protection, please confirm the email using the banner above before clicking links or attachments.`),

					m("button.btn", {
						onclick: () => this.closeModal(),
						style: this.getButtonStyle("#D1ECF1", "#BEE5EB")
					}, "OK")
				])
			])
		]);
	}

	private closeModal() {
		if (this.modalHandle) {
			modal.remove(this.modalHandle);
		}
	}

	private getButtonStyle(defaultColor: string, hoverColor: string) {
		return {
			background: defaultColor,
			color: "#000",
			border: "none",
			padding: "15px",
			borderRadius: "8px",
			cursor: "pointer",
			width: "100%",
			fontSize: "16px",
			fontWeight: "bold",
			textAlign: "center",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			onmouseover: (e: MouseEvent) => (e.target as HTMLElement).style.background = hoverColor,
			onmouseout: (e: MouseEvent) => (e.target as HTMLElement).style.background = defaultColor
		};
	}

	private getModalStyle() {
		return {
			position: "fixed",
			top: "50%",
			left: "50%",
			transform: "translate(-50%, -50%)",
			padding: "20px",
			textAlign: "center",
			background: "#fff",
			boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
			borderRadius: "10px",
			width: "320px",
			display: "flex",
			flexDirection: "column",
			gap: "10px"
		};
	}

	hideAnimation(): Promise<void> {
		return Promise.resolve();
	}

	onClose(): void {}

	backgroundClick(e: MouseEvent): void {
		if (this.modalHandle) {
			modal.remove(this.modalHandle);
		}
	}

	popState(e: Event): boolean {
		if (this.modalHandle) {
			modal.remove(this.modalHandle);
		}
		return false;
	}

	callingElement(): HTMLElement | null {
		return null;
	}

	shortcuts(): Shortcut[] {
		return [
			{
				key: Keys.ESC,
				exec: () => {
					this.closeModal();
					return true;
				},
				help: "close_alt"
			}
		];
	}

	setModalHandle(handle: ModalComponent) {
		this.modalHandle = handle;
	}
}
