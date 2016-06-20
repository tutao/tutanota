"use strict";

tutao.provide('tutao.tutanota.ctrl.GroupData');

/**
 * @param {string} name
 *            the name of the group.
 * @param {string} mailAddr
 * @param {bitArray} userKey
 *            the symmetric user key used for encrypting the symmetric group key for group
 *            memberships.
 * @param {bitArray} adminGroupKey
 *            the key of the admin group, used to encrypt the symmetric group key for the admin group.
 * @param {bitArray} customerGroupKey
 *            the key of the customer group
 * @param {bitArray} listKey
 *            the key of the list, used to encrypt all regular data of the group (e.g. name)
 * @return {Promise.<[tutao.entity.sys.CreateGroupData, Object]>}>} Resolves to an array which contains the tutao.entity.sys.CreateGroupData instance and the userGroupKey, rejected if failed.
 */
tutao.tutanota.ctrl.GroupData.generateGroupKeys = function(name, mailAddr, userKey, adminGroupKey, customerGroupKey, listKey) {
	var symGroupKey = tutao.locator.aesCrypter.generateRandomKey();
    return tutao.locator.crypto.generateRsaKey(tutao.locator.rsaUtil.keyLengthInBits).then(function (keyPair) {
        var sessionKey = tutao.locator.aesCrypter.generateRandomKey();

        var groupData = new tutao.entity.sys.CreateGroupData()
            .setEncryptedName(tutao.locator.aesCrypter.encryptUtf8(sessionKey, name))
            .setMailAddress(mailAddr)
            .setPubKey(tutao.util.EncodingConverter.hexToBase64(tutao.locator.rsaUtil.publicKeyToHex(keyPair.publicKey)))
            .setSymEncPrivKey(tutao.locator.aesCrypter.encryptPrivateRsaKey(symGroupKey, tutao.locator.rsaUtil.privateKeyToHex(keyPair.privateKey)));

        if (userKey != null) {
            groupData.setSymEncGKey(tutao.locator.aesCrypter.encryptKey(userKey, symGroupKey));
        }
        if (adminGroupKey != null) {
            groupData.setAdminEncGKey(tutao.locator.aesCrypter.encryptKey(adminGroupKey, symGroupKey));
        } else {
            // this is the adminGroup
            groupData.setAdminEncGKey(tutao.locator.aesCrypter.encryptKey(symGroupKey, symGroupKey));
        }

        groupData.setListEncSessionKey(tutao.locator.aesCrypter.encryptKey(listKey, sessionKey));

        if (customerGroupKey) {
            groupData.setCustomerEncUserGroupInfoSessionKey(tutao.locator.aesCrypter.encryptKey(customerGroupKey, sessionKey));
        }

        return [groupData, symGroupKey];
    });

};