import m, { Children } from "mithril"
import { modal, ModalComponent } from "../../../common/gui/base/Modal"
import type { Shortcut } from "../../../common/misc/KeyManager"
import { Keys } from "../../../common/api/common/TutanotaConstants"

export class MobyPhishReminderModal implements ModalComponent {
    private modalHandle?: ModalComponent
    private senderName: string

    constructor(senderName: string) {
        this.senderName = senderName
    }

    view(): Children {
        return m(".modal-overlay", {
            onclick: () => this.closeModal()
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
                    }, `For your protection, please confirm this email was sent from ${this.senderName} using the button in the banner above.`),
                    m("button.btn", {
                        onclick: () => this.closeModal(),
                        style: this.getButtonStyle()
                    }, "OK")
                ])
            ])
        ])
    }

    private closeModal() {
        if (this.modalHandle) {
            modal.remove(this.modalHandle)
        }
    }

    private getModalStyle() {
        return {
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            padding: "20px",
            background: "#fff",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
            borderRadius: "10px",
            width: "320px",
            textAlign: "center"
        }
    }

    private getButtonStyle() {
        return {
            background: "#007BFF",
            color: "#FFF",
            border: "none",
            padding: "12px",
            borderRadius: "8px",
            cursor: "pointer",
            width: "100%",
            fontSize: "16px",
            fontWeight: "bold",
            marginTop: "10px"
        }
    }

    shortcuts(): Shortcut[] {
        return [{
            key: Keys.ESC,
            exec: () => {
                this.closeModal()
                return true
            },
            help: "close_alt"
        }]
    }

    setModalHandle(handle: ModalComponent) {
        this.modalHandle = handle
    }

    hideAnimation(): Promise<void> {
        return Promise.resolve()
    }

    onClose(): void {}
    popState(): boolean {
        this.closeModal()
        return false
    }

    callingElement(): HTMLElement | null {
        return null
    }
}
