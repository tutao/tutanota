// src/mail-app/mail/view/MobyPhishNotTrustedModal.ts

import m, { Children } from "mithril";
import { Keys } from "../../../common/api/common/TutanotaConstants.js";
import { modal, ModalComponent } from "../../../common/gui/base/Modal.js";
import type { Shortcut } from "../../../common/misc/KeyManager.js";
import { Icon } from "../../../common/gui/base/Icon.js";
import { Icons } from "../../../common/gui/base/icons/Icons.js"; // Assuming Icons are available

// Using similar styles as MobyPhishAlreadyTrustedModal reference
const styleId = "moby-phish-info-style"; // Use a more generic ID if reusing styles
if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
        .mobyphish-info-btn { /* Consistent button class */
            background: #007BFF; /* Blue OK button */
            color: #ffffff;
            border: none; padding: 12px; border-radius: 8px;
            cursor: pointer; width: 100%; font-size: 14px;
            font-weight: bold; text-align: center; display: flex;
            align-items: center; justify-content: center;
            transition: opacity 0.2s ease; margin-top: 10px; opacity: 1;
        }
        .mobyphish-info-btn:hover { opacity: 0.8; }
    `;
    document.head.appendChild(style);
}

export class MobyPhishNotTrustedModal implements ModalComponent {
    private modalHandle?: ModalComponent;

    // No viewModel needed, just displaying info
    constructor() {}

    view(): Children {
        return m(".modal-overlay", { onclick: (e: MouseEvent) => this.backgroundClick(e) }, [
            m(".modal-content", { onclick: (e: MouseEvent) => e.stopPropagation() }, [
                m(".dialog.elevated-bg.border-radius", { style: this.getModalStyle() }, [
                    // Icon and Message
                    m("p", { style: { fontSize: "16px", fontWeight: "bold", textAlign: "center", marginBottom: "10px" } },
                        m(Icon, { icon: Icons.Info, style: { fill: '#17A2B8', marginRight: '8px', verticalAlign: 'middle' } }) // Info Icon
                    ),
                    m("p", {
                        style: { fontSize: "14px", textAlign: "center", marginBottom: "20px", lineHeight: "1.5" }
                    },
                        "This sender is not currently on your trusted list."
                    ),

                    // OK Button
                    m("button.mobyphish-info-btn", {
                        onclick: () => this.closeModal()
                    }, "OK")
                ])
            ])
        ]);
    }

    private closeModal(): void {
        if (this.modalHandle) {
            modal.remove(this.modalHandle);
        }
    }

    // --- Standard Modal Methods (Copied from Reference) ---
    private getModalStyle() { /* ... (copy from MobyPhishAlreadyTrustedModal) ... */
         return {
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            padding: "25px", textAlign: "center", background: "#fff",
            boxShadow: "0px 5px 15px rgba(0,0,0,0.25)", borderRadius: "10px",
            width: "90%", maxWidth: "380px", display: "flex", flexDirection: "column", gap: "10px"
        };
    }
    hideAnimation(): Promise<void> { return Promise.resolve(); }
    onClose(): void {}
    backgroundClick(e: MouseEvent): void { this.closeModal(); }
    popState(): boolean { this.closeModal(); return false; }
    callingElement(): HTMLElement | null { return null; }
    shortcuts(): Shortcut[] { return [{ key: Keys.ESC, exec: () => { this.closeModal(); return true; }, help: "close_alt" }]; }
    setModalHandle(handle: ModalComponent) { this.modalHandle = handle; }
}