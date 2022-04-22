import type { SettingsSection, SettingsTableAttrs, SettingsValue } from "./SettingsModel";
import { SettingsTable } from "./SettingsModel";
import type { IUserController } from "../../api/main/UserController";
import stream from "mithril/stream";
import type { EntityUpdateData } from "../../api/main/EventController";
import { isUpdateForTypeRef } from "../../api/main/EventController";
import type { TextFieldAttrs } from "../../gui/base/TextFieldN";
import { TextFieldN } from "../../gui/base/TextFieldN";
import type { ButtonAttrs } from "../../gui/base/ButtonN";
import { ButtonN, ButtonType } from "../../gui/base/ButtonN";
import { PasswordForm } from "../PasswordForm";
import { Icons } from "../../gui/base/icons/Icons";
import m from "mithril";
import { attachDropdown } from "../../gui/base/DropdownN";
import * as RecoverCodeDialog from "../RecoverCodeDialog";
import { logins } from "../../api/main/LoginController";
import { lang } from "../../misc/LanguageViewModel";
import { ifAllowedTutanotaLinks } from "../../gui/base/GuiUtils";
import type { TableAttrs, TableLineAttrs } from "../../gui/base/TableN";
import { ColumnWidth } from "../../gui/base/TableN";
import type { User } from "../../api/entities/sys/User";
import { SessionTypeRef } from "../../api/entities/sys/Session";
import { SecondFactorTypeRef } from "../../api/entities/sys/SecondFactor";
import { LazyLoaded, neverNull, noOp, promiseMap } from "@tutao/tutanota-utils";
import Stream from "mithril/stream"

export class LoginSettingsSection implements SettingsSection {
  heading: string;
  category: string;
  settingsValues: Array<SettingsValue<any>>;
  mailAddress: Stream<string>;
  stars: Stream<string>;
  user: LazyLoaded<User>;

  constructor(userController: IUserController) {
    this.heading = "Login credentials";
    this.category = "Login";
    this.settingsValues = [];
    this.mailAddress = stream(userController.userGroupInfo.mailAddress || "");
    this.stars = stream("***");
    this.user = new LazyLoaded(() => Promise.resolve(userController.user));
    this.settingsValues.push(this.createPasswordSetting());
    this.settingsValues.push(this.createMailAddressSetting());
    this.settingsValues.push(this.createRecoverySetting());
    this.settingsValues.push(this.createSecondFactorSetting()); //add second factor form
  }

  createPasswordSetting(): SettingsValue<TextFieldAttrs> {
    const changePasswordButtonAttrs: ButtonAttrs = {
      label: "changePassword_label",
      click: () => PasswordForm.showChangeOwnPasswordDialog(),
      icon: () => Icons.Edit
    };
    const passwordAttrs: TextFieldAttrs = {
      label: "password_label",
      value: this.stars,
      disabled: true,
      injectionsRight: () => m(ButtonN, changePasswordButtonAttrs)
    };
    return {
      name: "password_label",
      component: TextFieldN,
      attrs: passwordAttrs
    };
  }

  createMailAddressSetting(): SettingsValue<TextFieldAttrs> {
    const mailAddressAttrs: TextFieldAttrs = {
      label: "mailAddress_label",
      value: this.mailAddress,
      disabled: true
    };
    return {
      name: "mailAddress_label",
      component: TextFieldN,
      attrs: mailAddressAttrs
    };
  }

  createRecoverySetting(): SettingsValue<TextFieldAttrs> {
    const recoveryCodeDropdownButtonAttrs: ButtonAttrs = attachDropdown({
      label: "edit_action",
      icon: () => Icons.Edit,
      click: noOp
    }, () => [{
      label: "show_action",
      click: () => RecoverCodeDialog.showRecoverCodeDialogAfterPasswordVerification('get'),
      type: ButtonType.Dropdown,
      isVisible: () => {
        const auth = logins.getUserController().user.auth;
        return Boolean(auth && auth.recoverCode);
      }
    }, {
      label: () => neverNull(logins.getUserController().user.auth).recoverCode ? lang.get("update_action") : lang.get("setUp_action"),
      click: () => RecoverCodeDialog.showRecoverCodeDialogAfterPasswordVerification('create'),
      type: ButtonType.Dropdown
    }], () => true);
    const recoveryCodeFieldAttrs: TextFieldAttrs = {
      label: "recoveryCode_label",
      helpLabel: () => {
        return ifAllowedTutanotaLinks("recoverCode_link", link => [m("span", lang.get("moreInfo_msg") + " "), m("span.text-break", [m(`a[href=${link}][target=_blank]`, link)])]);
      },
      value: this.stars,
      disabled: true,
      injectionsRight: () => m(ButtonN, recoveryCodeDropdownButtonAttrs)
    };
    return {
      name: "recoveryCode_label",
      component: TextFieldN,
      attrs: recoveryCodeFieldAttrs
    };
  }

  createSecondFactorSetting(): SettingsValue<SettingsTableAttrs> {
    const _2FALineAttrs: Stream<TableLineAttrs[]> = stream([]);

    const secondFactorTableAttrs: TableAttrs = {
      columnHeading: ["name_label", "type_label"],
      columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest],
      lines: _2FALineAttrs(),
      showActionButtonColumn: true,
      addButtonAttrs: {
        label: "addSecondFactor_action",
        click: () => console.log("clicked"),
        // new SecondFactorDialog(),
        icon: () => Icons.Add
      }
    };
    const secondFactorTableSetting: SettingsTableAttrs = {
      tableHeading: "secondFactor_label",
      tableAttrs: secondFactorTableAttrs
    };
    return {
      name: "secondFactor_label",
      component: SettingsTable,
      attrs: secondFactorTableSetting
    };
  }

  updateSecondFactor() {// TODO: do something
  }

  entityEventReceived(updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<unknown> {
    return promiseMap(updates, update => {
      let promise = Promise.resolve();

      if (isUpdateForTypeRef(SecondFactorTypeRef, update)) {
        // promise = this.updateSecondFactor();
      }

      return promise;
    }).then(noOp);
  }

}
export class SessionSettings implements SettingsSection {
  heading: string;
  category: string;
  settingsValues: Array<SettingsValue<any>>;
  closedSessionsExpanded: Stream<boolean> = stream(false);
  activeSessionsTableLines: Stream<Array<TableLineAttrs>> = stream([]);
  closedSessionsTableLines: Stream<Array<TableLineAttrs>> = stream([]);

  constructor() {
    this.heading = "Sessions";
    this.category = "Login";
    this.settingsValues = [];
    this.closedSessionsExpanded = stream(false);
    this.activeSessionsTableLines = stream([]);
    this.closedSessionsTableLines = stream([]);
    stream.merge([this.closedSessionsTableLines, this.activeSessionsTableLines]).map(m.redraw);
    this.updateSessions();
    this.settingsValues.push(this.createActiveSessionsSetting());
    this.settingsValues.push(this.createClosedSessionSettings());
  }

  createActiveSessionsSetting(): SettingsValue<SettingsTableAttrs> {
    const activeSessionTableAttrs: TableAttrs = {
      columnHeading: ["client_label", "lastAccess_label", "IpAddress_label"],
      columnWidths: [ColumnWidth.Largest, ColumnWidth.Small, ColumnWidth.Small],
      showActionButtonColumn: true,
      lines: this.activeSessionsTableLines()
    };
    const activeSessionSettingTableAttrs: SettingsTableAttrs = {
      tableHeading: "activeSessions_label",
      tableAttrs: activeSessionTableAttrs
    };
    return {
      name: "activeSessions_label",
      component: SettingsTable,
      attrs: activeSessionSettingTableAttrs
    };
  }

  createClosedSessionSettings(): SettingsValue<SettingsTableAttrs> {
    const closedSessionTableAttrs: TableAttrs = {
      columnHeading: ["client_label", "lastAccess_label", "IpAddress_label"],
      columnWidths: [ColumnWidth.Small, ColumnWidth.Largest, ColumnWidth.Small],
      showActionButtonColumn: true,
      lines: this.closedSessionsTableLines()
    };
    const closedSessionSettingTableAttrs: SettingsTableAttrs = {
      tableHeading: "closedSessions_label",
      tableAttrs: closedSessionTableAttrs
    };
    return {
      name: "closedSessions_label",
      component: SettingsTable,
      attrs: closedSessionSettingTableAttrs
    };
  }

  updateSessions() {// TODO: do something
  }

  entityEventReceived(updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<unknown> {
    return promiseMap(updates, update => {
      let promise = Promise.resolve();

      if (isUpdateForTypeRef(SessionTypeRef, update)) {
        // promise = this.updateSessions();
      }

      return promise;
    }).then(noOp);
  }

}