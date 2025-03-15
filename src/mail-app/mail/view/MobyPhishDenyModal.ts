import m, { Children } from "mithril";
import { Keys } from "../../../common/api/common/TutanotaConstants.js";
import { modal, ModalComponent } from "../../../common/gui/base/Modal.js";
import type { Shortcut } from "../../../common/misc/KeyManager.js";

export class MobyPhishDenyModal implements ModalComponent {
    view(): Children {
        return m(".modal-overlay", {
            onclick: (e: MouseEvent) => this.backgroundClick(e) // Handle background click properly
        }, [
            m(".modal-content", {
                onclick: (e: MouseEvent) => e.stopPropagation() // Prevent modal from closing when clicking inside it
            }, [
                m(".dialog.elevated-bg.border-radius", {
                    style: {
                        position: "fixed",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        padding: "20px",
                        textAlign: "center",
                        background: "#fff", // Ensure modal is visible
                        boxShadow: "0px 0px 10px rgba(0,0,0,0.2)", // Add shadow for better visibility
                        borderRadius: "6px"
                    }
                }, [
                    m("h3", "Choose an Action"),
                    m("button.btn", { onclick: () => console.log("This is someone else clicked") }, "This is someone else"),
                    m("button.btn", { onclick: () => console.log("Remove from Trusted Senders clicked") }, "Remove from Trusted Senders"),
                    m("button.btn", { onclick: () => modal.remove(this) }, "Cancel") // Close button
                ])
            ])
        ]);
    }

    hideAnimation(): Promise<void> {
        return Promise.resolve();
    }

    onClose(): void {}

    backgroundClick(e: MouseEvent): void {
        console.log("Background clicked, closing modal...");
        modal.remove(this);
    }

    popState(e: Event): boolean {
        modal.remove(this);
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
                    modal.remove(this);
                    return true;
                },
                help: "close_alt",
            }
        ];
    }
}
