import m, { Children, Vnode } from "mithril";
import { modal, ModalComponent } from "../../../common/gui/base/Modal.js";
import type { Shortcut } from "../../../common/misc/KeyManager.js"; // Import Shortcut


export class MobyPhishModal implements ModalComponent {
    private message: string;
    private element: HTMLElement | null = null; // Stores calling element for focus return

    constructor(message: string) {
        this.message = message;
    }

    view(): Children {
        return m(".modal-overlay", [
            m(".modal-content", [
                m("h3", "Action Confirmation"),
                m("p", this.message),
                m("button", {
                    onclick: () => modal.remove(this), // Close modal
                }, "Close")
            ])
        ]);
    }

    hideAnimation(): Promise<void> {
        return Promise.resolve();
    }

    onClose(): void {}

    shortcuts(): Shortcut[] {
        return [];
    }

    backgroundClick(e: MouseEvent): void {
        modal.remove(this);
    }

    popState(e: Event): boolean {
        modal.remove(this);
        return false;
    }

    callingElement(): HTMLElement | null {
        return this.element;
    }
}
