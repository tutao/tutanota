import m, { Children, Vnode } from "mithril";
import { modal, ModalComponent } from "../../../common/gui/base/Modal.js";
import type { Shortcut } from "../../../common/misc/KeyManager.js"; // Import Shortcut
import { animations, opacity } from "../../../common/gui/animation/Animations.js";

export class MobyPhishModal implements ModalComponent {
    private message: string;
    private focusedBeforeShown: HTMLElement | null = null;
    private domDialog: HTMLElement | null = null; // Store reference to modal element

    constructor(message: string, callingElement?: HTMLElement) {
        this.message = message;
        this.focusedBeforeShown = callingElement || null;
    }

    view(): Children {
        return m(
            ".dialog.elevated-bg.border-radius",
            {
                role: "dialog",
                "aria-modal": "true",
                onclick: (e: MouseEvent) => e.stopPropagation(), // Prevent clicks from closing modal
                oncreate: (vnode) => {
                    this.domDialog = vnode.dom as HTMLElement;
                    animations.add(this.domDialog, opacity(0, 1, true));
                },
            },
            [
                m("h3", "Action Confirmation"),
                m("p", this.message),
                m("button", {
                    onclick: () => this.onClose(),
                }, "Close")
            ]
        );
    }

    hideAnimation(): Promise<void> {
        return this.domDialog
            ? animations.add(this.domDialog, opacity(1, 0, true)).then(() => {})
            : Promise.resolve();
    }

    onClose(): void {
        modal.remove(this);
        if (this.focusedBeforeShown) {
            this.focusedBeforeShown.focus(); // Return focus to previous element
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
                key: "Escape",
                shift: false,
                exec: () => this.onClose(),
                help: "close_modal",
            },
        ];
    }

    backgroundClick(e: MouseEvent): void {
        this.onClose();
    }
}
