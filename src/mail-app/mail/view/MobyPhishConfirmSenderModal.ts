import m, { Children } from "mithril";
import { Keys } from "../../../common/api/common/TutanotaConstants.js";
import { modal, ModalComponent } from "../../../common/gui/base/Modal.js";
import type { Shortcut } from "../../../common/misc/KeyManager.js";
import { MailViewerViewModel } from "./MailViewerViewModel.js";

export class MobyPhishConfirmSenderModal implements ModalComponent {
    private viewModel: MailViewerViewModel;
    private modalHandle?: ModalComponent;
    private selectedSender: string = "";
    private trustedSenders: string[];

    constructor(viewModel: MailViewerViewModel, trustedSenders: string[]) {
        this.viewModel = viewModel;
        this.trustedSenders = trustedSenders;
    }

    view(): Children {
        return m(".modal-overlay", { onclick: (e: MouseEvent) => this.backgroundClick(e) }, [
            m(".modal-content", { onclick: (e: MouseEvent) => e.stopPropagation() }, [
                m(".dialog.elevated-bg.border-radius", { style: this.getModalStyle() }, [
                    m("p", {
                        style: { fontSize: "16px", fontWeight: "bold", textAlign: "center" }
                    }, "Who do you believe this email is from?"),

                    m("input[type=text]", {
                        placeholder: "Search or type a known sender...",
                        value: this.selectedSender,
                        oninput: (e: Event) => {
                            this.selectedSender = (e.target as HTMLInputElement).value;
                        },
                        list: "trusted-senders-list",
                        style: {
                            padding: "10px",
                            width: "100%",
                            borderRadius: "8px",
                            border: "1px solid #ccc"
                        }
                    }),
                    m("datalist#trusted-senders-list", this.trustedSenders.map(sender =>
                        m("option", { value: sender })
                    )),

                    m("button.btn", {
                        onclick: () => {
                            console.log(`📩 User claims this email is from: ${this.selectedSender}`);
                            //this.viewModel.setClaimedSender(this.selectedSender);
                            modal.remove(this.modalHandle!);
                            m.redraw();
                        },
                        style: this.getButtonStyle("#D4EDDA", "#C3E6CB")
                    }, "Confirm"),

                    m("button.btn", {
                        onclick: () => modal.remove(this.modalHandle!),
                        style: this.getCancelButtonStyle()
                    }, "Cancel")
                ])
            ])
        ]);
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

    private getCancelButtonStyle() {
        return {
            background: "transparent",
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
            justifyContent: "center"
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
        modal.remove(this.modalHandle!);
    }

    popState(): boolean {
        modal.remove(this.modalHandle!);
        return false;
    }

    callingElement(): HTMLElement | null {
        return null;
    }

    shortcuts(): Shortcut[] {
        return [{
            key: Keys.ESC,
            exec: () => {
                modal.remove(this.modalHandle!);
                return true;
            },
            help: "close_alt"
        }];
    }

    setModalHandle(handle: ModalComponent) {
        this.modalHandle = handle;
    }
}
