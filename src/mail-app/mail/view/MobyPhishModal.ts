import m, { Children } from "mithril";
import { modal, ModalComponent } from "../../../common/gui/base/Modal.js";
import type { Shortcut } from "../../../common/misc/KeyManager.js";
import { Keys } from "../../../common/api/common/TutanotaConstants";

export class MobyPhishModal implements ModalComponent {
    private message: string;
    private focusedBeforeShown: HTMLElement | null = null;

    constructor(message: string, callingElement?: HTMLElement) {
        this.message = message;
        this.focusedBeforeShown = callingElement || null;
    }

    view(): Children {
        return m(".dialog-container", [
            m(".dialog.elevated-bg.border-radius", {
                style: {
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                }
            }, [
                m("h3", "Action Confirmation"),
                m("p", this.message),
                m("button", { onclick: () => modal.remove(this) }, "Close")
            ])
        ]);
    }    

    hideAnimation(): Promise<void> {
        return Promise.resolve();
    }

    onClose(): void {
        modal.remove(this);
        if (this.focusedBeforeShown) {
            this.focusedBeforeShown.focus(); // Return focus
        }
    }

    popState(e: Event): boolean {
        this.onClose();
        return false;
    }

    callingElement(): HTMLElement | null {
        return this.focusedBeforeShown;
    }

    shortcuts(): Shortcut[] {
        return [
            {
                key: Keys.ESC,
                shift: false,
                exec: () => this.onClose(),
                help: "close_alt",
            },
        ];
    }

    backgroundClick(e: MouseEvent): void {
        this.onClose();
    }
}
