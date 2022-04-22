import type { SettingsSection, SettingsTableAttrs, SettingsValue } from "./SettingsModel";
import { SettingsTable } from "./SettingsModel";
import type { EntityUpdateData } from "../../api/main/EventController";
import { logins } from "../../api/main/LoginController";
import type { TableAttrs, TableLineAttrs } from "../../gui/base/TableN";
import { ColumnWidth } from "../../gui/base/TableN";
import { createNotAvailableForFreeClickHandler } from "../../misc/SubscriptionDialogs";
import { showPurchaseGiftCardDialog } from "../../subscription/giftcards/PurchaseGiftCardDialog";
import { Icons } from "../../gui/base/icons/Icons";
import { formatDate } from "../../misc/Formatter";
import { formatPrice } from "../../subscription/PriceUtils";
import { attachDropdown } from "../../gui/base/DropdownN";
import { loadGiftCards, showGiftCardToShare } from "../../subscription/giftcards/GiftCardUtils";
import {ButtonAttrs, ButtonType} from "../../gui/base/ButtonN";
import stream from "mithril/stream";
import { Dialog, DialogType } from "../../gui/base/Dialog";
import { lang } from "../../misc/LanguageViewModel";
import m from "mithril";
import { GiftCardMessageEditorField } from "../../subscription/giftcards/GiftCardMessageEditorField";
import { locator } from "../../api/main/MainLocator";
import type { GiftCard } from "../../api/entities/sys/GiftCard";
import { elementIdPart } from "../../api/common/utils/EntityUtils";
import type { IUserController } from "../../api/main/UserController";
import {lazy, neverNull} from "@tutao/tutanota-utils";
import {TranslationKeyType} from "../../misc/TranslationKey"
export class GiftCardSettingsSection implements SettingsSection {
  heading: string;
  category: string;
  userController: IUserController;
  settingsValues: Array<SettingsValue<any>>;
  giftCards: Map<Id, GiftCard>;

  constructor(userController: IUserController) {
    this.heading = "Gift Cards";
    this.category = "Gift Cards";
    this.settingsValues = [];
    this.userController = userController;
    this.giftCards = new Map();
    loadGiftCards(neverNull(this.userController.user.customer)).then(giftCards => {
      giftCards.forEach(giftCard => this.giftCards.set(elementIdPart(giftCard._id), giftCard));
    });
    this.settingsValues.push(this.createGiftCardsSetting());
  }

  createGiftCardsSetting(): SettingsValue<SettingsTableAttrs> {
    const isPremiumPredicate = () => logins.getUserController().isPremiumAccount();

    const columnHeading: (lazy<string> | TranslationKeyType)[] = ["purchaseDate_label", "value_label"];
    const columnWidths = [ColumnWidth.Largest, ColumnWidth.Small, ColumnWidth.Small];
    const lines = this.getLines();
    const addButtonAttrs: ButtonAttrs = {
      label: "buyGiftCard_label",
      click: createNotAvailableForFreeClickHandler(false, () => showPurchaseGiftCardDialog(), isPremiumPredicate),
      icon: () => Icons.Add
    };
    const GiftCardTableAttrs: TableAttrs = {
      addButtonAttrs,
      columnHeading,
      columnWidths,
      lines,
      showActionButtonColumn: true
    };
    const GiftCardSettingsTableAttrs: SettingsTableAttrs = {
      tableHeading: "giftCard_label",
      tableAttrs: GiftCardTableAttrs
    };
    return {
      name: "giftCard_label",
      component: SettingsTable,
      attrs: GiftCardSettingsTableAttrs
    };
  }

  getLines(): Array<TableLineAttrs> {
    const giftCards = Array.from(this.giftCards.values());
    return giftCards.filter(giftCard => giftCard.usable).map(giftCard => {
      return {
        cells: [formatDate(giftCard.orderDate), formatPrice(parseFloat(giftCard.value), true)],
        actionButtonAttrs: attachDropdown({
          label: "options_action",
          click: () => showGiftCardToShare(giftCard),
          icon: () => Icons.More,
          type: ButtonType.Dropdown
        }, () => [{
          label: "view_label",
          click: () => showGiftCardToShare(giftCard),
          type: ButtonType.Dropdown
        }, {
          label: "edit_action",
          click: () => {
            let message = stream(giftCard.message);
            Dialog.showActionDialog({
              title: lang.get("editMessage_label"),
              child: () => m(".flex-center", m(GiftCardMessageEditorField, {
                message
              })),
              okAction: dialog => {
                giftCard.message = message();
                locator.entityClient.update(giftCard).then(() => dialog.close()).catch(() => Dialog.message("giftCardUpdateError_msg"));
                showGiftCardToShare(giftCard);
              },
              okActionTextId: "save_action",
              type: DialogType.EditSmall
            });
          },
          type: ButtonType.Dropdown
        }])
      };
    });
  }

  entityEventReceived(updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<unknown> {
    return Promise.resolve(undefined);
  }

}