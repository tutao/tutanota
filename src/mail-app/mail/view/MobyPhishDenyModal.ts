import m, { Children } from "mithril";
import { modal, ModalComponent } from "../../../common/gui/base/Modal.js";
import type { Shortcut } from "../../../common/misc/KeyManager.js";

export class MobyPhishDenyModal implements ModalComponent {
    view(): Children {
        return m(".dialog-container", [
            m(".dialog.elevated-bg.border-radius", {
                style: {
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    padding: "20px",
                    textAlign: "center"
                }
            }, [
                m("h3", "Choose an Action"),
                m("button.btn", { onclick: () => console.log("This is someone else clicked") }, "This is someone else"),
                m("button.btn", { onclick: () => console.log("Remove from Trusted Senders clicked") }, "Remove from Trusted Senders"),
                m("button.btn", { onclick: () => modal.remove(this) }, "Cancel") // Close button
            ])
        ]);
    }

    hideAnimation(): Promise<void> {
        return Promise.resolve();
    }

    onClose(): void {}

    backgroundClick(e: MouseEvent): void {
        modal.remove(this);
    }

    popState(e: Event): boolean {
        modal.remove(this);
        return false;
    }

    callingElement(): HTMLElement | null {
        return null;
    }

    // **Fix: Add shortcuts() method**
    shortcuts(): Shortcut[] {
        return [
            {
                key: "Escape", // Close modal when Escape key is pressed
                exec: () => {
                    modal.remove(this);
                    return true;
                },
                help: "close_alt",
            }
        ];
    }
}
