/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

#include "contacts.h"

#if defined QTCONTACTS_USE_NAMESPACE
QTCONTACTS_USE_NAMESPACE
#endif

Contacts::Contacts(Cordova *cordova): CPlugin(cordova) {
    m_fieldNamePairs.clear();

    m_fieldNamePairs["displayName"] = QContactDetail::TypeDisplayLabel;
    m_fieldNamePairs["name"] = QContactDetail::TypeName;
    m_fieldNamePairs["nickname"] = QContactDetail::TypeNickname;
    m_fieldNamePairs["phoneNumbers"] = QContactDetail::TypePhoneNumber;
    m_fieldNamePairs["emails"] = QContactDetail::TypeEmailAddress;
    m_fieldNamePairs["addresses"] = QContactDetail::TypeAddress;
    m_fieldNamePairs["ims"] = QContactDetail::TypeOnlineAccount;
    m_fieldNamePairs["organizations"] = QContactDetail::TypeOrganization;
    m_fieldNamePairs["birthday"] = QContactDetail::TypeBirthday;
    m_fieldNamePairs["note"] = QContactDetail::TypeNote;
    m_fieldNamePairs["photos"] = QContactDetail::TypeAvatar;
    m_fieldNamePairs["urls"] = QContactDetail::TypeUrl;

    m_notSupportedFields.clear();
    m_notSupportedFields << "categories";
    m_manager.clear();
    m_manager = QSharedPointer<QContactManager>(new QContactManager());
}

void Contacts::save(int scId, int ecId, const QVariantMap &params) {
    QContact result;
    QList<QContactDetail *> detailsToDelete;

    if (params.find("id") != params.end()) {
        QString id = params.find("id")->toString();
        if (!id.isEmpty()) {
            result = m_manager->contact(QContactId::fromString(id));
            result.clearDetails();
        }
    }

    foreach (QString field, params.keys()) {
        QContactDetail::DetailType qtDefinition = cordovaFieldNameToQtDefinition(field);
        if (qtDefinition == QContactDetail::TypeUndefined)
            continue;

        if (field == "nickname") {
            QContactNickname *detail = new QContactNickname;
            detail->setNickname(params[field].toString());
            detailsToDelete << detail;
            result.saveDetail(detail);
        } else if (field == "note") {
            QContactNote *detail = new QContactNote;
            detail->setNote(params[field].toString());
            detailsToDelete << detail;
            result.saveDetail(detail);
        } else if (field == "phoneNumbers") {
            if (params[field].type() != QVariant::List)
                continue;
            QVariantList phonesList = params[field].toList();
            foreach (const QVariant &phoneDesc, phonesList) {
                if (phoneDesc.type() != QVariant::Map)
                    continue;
                QContactPhoneNumber *detail = new QContactPhoneNumber;
                detail->setNumber(phoneDesc.toMap()["value"].toString());
                if (!phoneDesc.toMap()["type"].toString().isEmpty() &&
                        phoneDesc.toMap()["type"].toString() != "phone")
                    detail->setSubTypes(QList<int>() <<
                                        subTypePhoneFromString(phoneDesc.toMap()["type"].toString()));
                detailsToDelete << detail;
                result.saveDetail(detail);
            }
        } else if (field == "emails") {
            if (params[field].type() != QVariant::List)
                continue;
            QVariantList emailsList = params[field].toList();
            foreach (const QVariant &emailDesc, emailsList) {
                if (emailDesc.type() != QVariant::Map)
                    continue;
                if (emailDesc.toMap()["value"].toString().isEmpty())
                    continue;
                QContactEmailAddress *detail = new QContactEmailAddress;
                detail->setEmailAddress(emailDesc.toMap()["value"].toString());
                detailsToDelete << detail;
                result.saveDetail(detail);
            }
        } else if (field == "ims") {
            if (params[field].type() != QVariant::List)
                continue;
            QVariantList imsList = params[field].toList();
            foreach (const QVariant &imDesc, imsList) {
                if (imDesc.type() != QVariant::Map)
                    continue;
                QContactOnlineAccount *detail = new QContactOnlineAccount;
                detail->setAccountUri(imDesc.toMap()["value"].toString());
                if (!imDesc.toMap()["type"].toString().isEmpty())
                    detail->setSubTypes(QList<int>() <<
                                        subTypeOnlineAccountFromString(imDesc.toMap()["type"].toString()));
                detailsToDelete << detail;
                result.saveDetail(detail);
            }
        } else if (field == "photos") {
            if (params[field].type() != QVariant::List)
                continue;
            QVariantList photosList = params[field].toList();
            foreach (const QVariant &photoDesc, photosList) {
                if (photoDesc.type() != QVariant::Map)
                    continue;
                //TODO: we need to decide should we support base64 images or not
                if (photoDesc.toMap()["type"].toString() != "url")
                    continue;
                QContactAvatar *detail = new QContactAvatar;
                detail->setImageUrl(QUrl(photoDesc.toMap()["value"].toString()));
                detailsToDelete << detail;
                result.saveDetail(detail);
            }
        } else if (field == "urls") {
            if (params[field].type() != QVariant::List)
                continue;
            QVariantList urlsList = params[field].toList();
            foreach (const QVariant &urlDesc, urlsList) {
                if (urlDesc.type() != QVariant::Map)
                    continue;
                QContactUrl *detail = new QContactUrl;
                detail->setUrl(urlDesc.toMap()["value"].toString());
                if (!urlDesc.toMap()["type"].toString().isEmpty())
                    detail->setSubType((QContactUrl::SubType) subTypeUrlFromString(urlDesc.toMap()["type"].toString()));
                detailsToDelete << detail;
                result.saveDetail(detail);
            }
        } else if (field == "birthday") {
            QDateTime birthday;
            birthday.setTime_t(params[field].toLongLong() / 1000);

            QContactBirthday *detail = new QContactBirthday;
            detail->setDateTime(birthday);
            detailsToDelete << detail;
            result.saveDetail(detail);
        } else if (field == "organizations") {

            if (params[field].type() != QVariant::List)
                continue;
            QVariantList organizationsList = params[field].toList();
            foreach (const QVariant &organizationDesc, organizationsList) {
                if (organizationDesc.type() != QVariant::Map)
                    continue;
                QContactOrganization *detail = new QContactOrganization;
                detail->setName(organizationDesc.toMap()["name"].toString());
                detail->setDepartment(QStringList() << organizationDesc.toMap()["department"].toString());
                detail->setRole(organizationDesc.toMap()["title"].toString());
                detailsToDelete << detail;
                result.saveDetail(detail);
            }

        } else if (field == "name") {
            QContactName *detail = new QContactName;
            QVariantMap nameMap = params[field].toMap();
            detail->setLastName(nameMap["familyName"].toString());
            detail->setFirstName(nameMap["givenName"].toString());
            detail->setMiddleName(nameMap["middleName"].toString());
            detail->setPrefix(nameMap["honorificPrefix"].toString());
            detail->setSuffix(nameMap["honorificSuffix"].toString());
            detailsToDelete << detail;
            result.saveDetail(detail);
        }

    }
    if (!m_manager->saveContact(&result)) {
        switch (m_manager->error()) {
        case QContactManager::DoesNotExistError:
        case QContactManager::AlreadyExistsError:
        case QContactManager::InvalidDetailError:
        case QContactManager::InvalidRelationshipError:
        case QContactManager::BadArgumentError:
        case QContactManager::InvalidContactTypeError:
            callback(ecId, "ContactError.INVALID_ARGUMENT_ERROR");
            break;
        case QContactManager::DetailAccessError:
        case QContactManager::PermissionsError:
            callback(ecId, "ContactError.PERMISSION_DENIED_ERROR");
            break;
        case QContactManager::NotSupportedError:
            callback(ecId, "ContactError.NOT_SUPPORTED_ERROR");
            break;
        case QContactManager::TimeoutError:
            callback(ecId, "ContactError.TIMEOUT_ERROR");
            break;
        case QContactManager::UnspecifiedError:
        case QContactManager::LockedError:
        case QContactManager::OutOfMemoryError:
        case QContactManager::VersionMismatchError:
        case QContactManager::LimitReachedError:
        case QContactManager::NoError:
        default:
            callback(ecId, "ContactError.UNKNOWN_ERROR");
            break;
        }
    } else {
        callback(scId, jsonedContact(result));
    }
    qDeleteAll(detailsToDelete);
}

void Contacts::remove(int scId, int ecId, const QString &localId) {
    QContactId id = QContactId::fromString(localId);

    if (!m_manager->removeContact(id)) {
        switch (m_manager->error()) {
        case QContactManager::AlreadyExistsError:
        case QContactManager::InvalidDetailError:
        case QContactManager::InvalidRelationshipError:
        case QContactManager::BadArgumentError:
        case QContactManager::InvalidContactTypeError:
            callback(ecId, "ContactError.INVALID_ARGUMENT_ERROR");
            break;
        case QContactManager::DetailAccessError:
        case QContactManager::PermissionsError:
            callback(ecId, "ContactError.PERMISSION_DENIED_ERROR");
            break;
        case QContactManager::NotSupportedError:
            callback(ecId, "ContactError.NOT_SUPPORTED_ERROR");
            break;
        case QContactManager::TimeoutError:
            callback(ecId, "ContactError.TIMEOUT_ERROR");
            break;
        case QContactManager::UnspecifiedError:
        case QContactManager::LockedError:
        case QContactManager::OutOfMemoryError:
        case QContactManager::VersionMismatchError:
        case QContactManager::LimitReachedError:
        case QContactManager::NoError:
        case QContactManager::DoesNotExistError:
        default:
            callback(ecId, "ContactError.UNKNOWN_ERROR");
            break;
        }

    } else {
        cb(scId);
    }
}

void Contacts::search(int scId, int ecId, const QStringList &fields, const QVariantMap &params) {
    QString filter;
    bool multiple = true;

    if (params.find("filter") != params.end()) {
        filter = params["filter"].toString();
    }
    if (params.find("multiple") != params.end()) {
        multiple = params["multiple"].toBool();
    }

    findContacts(scId, ecId, fields, filter, multiple);
}

void Contacts::findContacts(int scId, int ecId, const QStringList &fields, const QString &filter, bool multiple) {
    if (fields.length() <= 0){
        callback(ecId, "new ContactError(ContactError.INVALID_ARGUMENT_ERROR)");
    }

    QContactUnionFilter unionFilter;

    QMap<QContactDetail::DetailType, QList<int> > fieldNames;
    fieldNames[QContactDetail::TypeDisplayLabel] << QContactDisplayLabel::FieldLabel;
    fieldNames[QContactDetail::TypeName] << QContactName::FieldFirstName << QContactName::FieldLastName << QContactName::FieldMiddleName << QContactName::FieldPrefix << QContactName::FieldSuffix;
    fieldNames[QContactDetail::TypeNickname] << QContactNickname::FieldNickname;
    fieldNames[QContactDetail::TypePhoneNumber] << QContactPhoneNumber::FieldNumber;
    fieldNames[QContactDetail::TypeEmailAddress] << QContactEmailAddress::FieldEmailAddress;
    fieldNames[QContactDetail::TypeAddress] << QContactAddress::FieldCountry << QContactAddress::FieldLocality << QContactAddress::FieldPostcode << QContactAddress::FieldPostOfficeBox << QContactAddress::FieldRegion << QContactAddress::FieldStreet;
    fieldNames[QContactDetail::TypeOnlineAccount] << QContactOnlineAccount::FieldAccountUri;
    fieldNames[QContactDetail::TypeOrganization] << QContactOrganization::FieldAssistantName << QContactOrganization::FieldDepartment << QContactOrganization::FieldLocation << QContactOrganization::FieldName << QContactOrganization::FieldRole << QContactOrganization::FieldTitle;
    fieldNames[QContactDetail::TypeBirthday] << QContactBirthday::FieldBirthday;
    fieldNames[QContactDetail::TypeNote] << QContactNote::FieldNote;
    fieldNames[QContactDetail::TypeUrl] << QContactUrl::FieldUrl;

    foreach (const QContactDetail::DetailType &defName, fieldNames.keys()) {
        foreach(int fieldName, fieldNames[defName]) {
            QContactDetailFilter subFilter;
            subFilter.setDetailType(defName, fieldName);
            subFilter.setValue(filter);
            subFilter.setMatchFlags(QContactFilter::MatchContains);
            unionFilter.append(subFilter);
        }
    }

    QList<QContact> contacts = m_manager->contacts(unionFilter);
    if (contacts.empty()) {
        callback(scId, "[]");
    } else {
        QStringList stringifiedContacts;
        foreach (const QContact &contact, contacts) {
            stringifiedContacts << jsonedContact(contact, fields);

            if (!multiple)
                break;
        }
        callback(scId, QString("[%1]").arg(stringifiedContacts.join(", ")));
    }
}

QContactDetail::DetailType Contacts::cordovaFieldNameToQtDefinition(const QString &cordovaFieldName) const {
    if (m_fieldNamePairs.contains(cordovaFieldName))
        return m_fieldNamePairs[cordovaFieldName];

    return QContactDetail::TypeUndefined;
}

int Contacts::subTypePhoneFromString(const QString &cordovaSubType) const
{
    QString preparedSubType = cordovaSubType.toLower();
    if (preparedSubType == "mobile")
        return QContactPhoneNumber::SubTypeMobile;
    else if (preparedSubType == "fax")
        return QContactPhoneNumber::SubTypeFax;
    else if (preparedSubType == "pager")
        return QContactPhoneNumber::SubTypePager;
    else if (preparedSubType == "voice")
        return QContactPhoneNumber::SubTypeVoice;
    else if (preparedSubType == "modem")
        return QContactPhoneNumber::SubTypeModem;
    else if (preparedSubType == "video")
        return QContactPhoneNumber::SubTypeVideo;
    else if (preparedSubType == "car")
        return QContactPhoneNumber::SubTypeCar;
    else if (preparedSubType == "assistant")
        return QContactPhoneNumber::SubTypeAssistant;
    return QContactPhoneNumber::SubTypeLandline;
}

int Contacts::subTypeOnlineAccountFromString(const QString &cordovaSubType) const {
    QString preparedSubType = cordovaSubType.toLower();
    if (preparedSubType == "aim")
        return QContactOnlineAccount::ProtocolAim;
    else if (preparedSubType == "icq")
        return QContactOnlineAccount::ProtocolIcq;
    else if (preparedSubType == "irc")
        return QContactOnlineAccount::ProtocolIrc;
    else if (preparedSubType == "jabber")
        return QContactOnlineAccount::ProtocolJabber;
    else if (preparedSubType == "msn")
        return QContactOnlineAccount::ProtocolMsn;
    else if (preparedSubType == "qq")
        return QContactOnlineAccount::ProtocolQq;
    else if (preparedSubType == "skype")
        return QContactOnlineAccount::ProtocolSkype;
    else if (preparedSubType == "yahoo")
        return QContactOnlineAccount::ProtocolYahoo;
    return QContactOnlineAccount::ProtocolUnknown;
}

int Contacts::subTypeUrlFromString(const QString &cordovaSubType) const {
    QString preparedSubType = cordovaSubType.toLower();
    if (preparedSubType == "blog")
        return QContactUrl::SubTypeBlog;
    else if (preparedSubType == "favourite")
        return QContactUrl::SubTypeFavourite;
    return QContactUrl::SubTypeHomePage;
}

QString Contacts::subTypePhoneToString(int qtSubType) const {
    if (qtSubType == QContactPhoneNumber::SubTypeMobile)
        return "mobile";
    else if (qtSubType == QContactPhoneNumber::SubTypeFax)
        return "fax";
    else if (qtSubType == QContactPhoneNumber::SubTypePager)
        return "pager";
    else if (qtSubType == QContactPhoneNumber::SubTypeVoice)
        return "voice";
    else if (qtSubType == QContactPhoneNumber::SubTypeModem)
        return "modem";
    else if (qtSubType == QContactPhoneNumber::SubTypeVideo)
        return "video";
    else if (qtSubType == QContactPhoneNumber::SubTypeCar)
        return "car";
    else if (qtSubType == QContactPhoneNumber::SubTypeAssistant)
        return "assistant";
    return "home";
}

QString Contacts::subTypeOnlineAccountToString(int qtSubType) const {
    if (qtSubType == QContactOnlineAccount::ProtocolAim)
        return "aim";
    else if (qtSubType == QContactOnlineAccount::ProtocolIcq)
        return "icq";
    else if (qtSubType == QContactOnlineAccount::ProtocolIrc)
        return "irc";
    else if (qtSubType == QContactOnlineAccount::ProtocolJabber)
        return "jabber";
    else if (qtSubType == QContactOnlineAccount::ProtocolMsn)
        return "msn";
    else if (qtSubType == QContactOnlineAccount::ProtocolQq)
        return "qq";
    else if (qtSubType == QContactOnlineAccount::ProtocolSkype)
        return "skype";
    else if (qtSubType == QContactOnlineAccount::ProtocolYahoo)
        return "yahoo";
    return "unknown";
}

QString Contacts::subTypeUrlToString(int qtSubType) const {
    if (qtSubType == QContactUrl::SubTypeBlog)
        return "blog";
    else if (qtSubType == QContactUrl::SubTypeFavourite)
        return "favourite";
    return "homepage";
}

QString Contacts::jsonedContact(const QContact &contact, const QStringList &fields) const {
    QStringList resultingFields = fields;
    if (resultingFields.empty())
        resultingFields.append(m_fieldNamePairs.keys());
    if (!resultingFields.contains("id"))
        resultingFields << "id";
    QStringList fieldValuesList;
    foreach (const QString &field, resultingFields) {
        QContactDetail::DetailType qtDefinitionName = cordovaFieldNameToQtDefinition(field);
        if (field == "id") {
            fieldValuesList << QString("%1: \"%2\"")
                               .arg(field)
                               .arg(contact.id().toString());
        } else if (field == "displayName") {
            QContactDisplayLabel detail = contact.detail(qtDefinitionName);
            fieldValuesList << QString("%1: \"%2\"")
                               .arg(field)
                               .arg(detail.label());
        } else if (field == "nickname") {
            QContactNickname detail = contact.detail(qtDefinitionName);
            fieldValuesList << QString("%1: \"%2\"")
                               .arg(field)
                               .arg(detail.nickname());
        } else if (field == "note") {
            QContactNote detail = contact.detail(qtDefinitionName);
            fieldValuesList << QString("%1: \"%2\"")
                               .arg(field)
                               .arg(detail.note());
        } else if (field == "phoneNumbers") {
            QStringList fieldValues;
            QList<QContactDetail> details = contact.details(qtDefinitionName);
            foreach (const QContactDetail &detail, details) {
                QContactPhoneNumber castedDetail = detail;
                QStringList subTypes;
                foreach (int subType, castedDetail.subTypes())
                    subTypes << subTypePhoneToString(subType);

                if (subTypes.isEmpty())
                    subTypes << "phone";
                foreach(const QString &subType, subTypes) {
                    fieldValues << QString("{type: \"%1\", value: \"%2\", pref: %3}")
                                   .arg(subType)
                                   .arg(castedDetail.number())
                                   .arg("false");
                }
            }
            fieldValuesList << QString("%1: [%2]")
                               .arg(field)
                               .arg(fieldValues.join(", "));
        } else if (field == "emails") {
            QStringList fieldValues;
            QList<QContactDetail> details = contact.details(qtDefinitionName);
            foreach (const QContactDetail &detail, details) {
                QContactEmailAddress castedDetail = detail;
                fieldValues << QString("{type: \"%1\", value: \"%2\", pref: %3}")
                               .arg("email")
                               .arg(castedDetail.emailAddress())
                               .arg("false");
            }
            fieldValuesList << QString("%1: [%2]")
                               .arg(field)
                               .arg(fieldValues.join(", "));
        } else if (field == "ims") {
            QStringList fieldValues;
            QList<QContactDetail> details = contact.details(qtDefinitionName);
            foreach (const QContactDetail &detail, details) {
                QContactOnlineAccount castedDetail = detail;
                QStringList subTypes;
                foreach (int subType, castedDetail.subTypes())
                    subTypes << subTypeOnlineAccountToString(subType);

                if (subTypes.isEmpty())
                    subTypes << "IM";
                foreach(const QString &subType, subTypes) {
                    fieldValues << QString("{type: \"%1\", value: \"%2\", pref: %3}")
                                   .arg(subType)
                                   .arg(castedDetail.accountUri())
                                   .arg("false");
                }
            }
            fieldValuesList << QString("%1: [%2]")
                               .arg(field)
                               .arg(fieldValues.join(", "));
        } else if (field == "photos") {
            QStringList fieldValues;
            QList<QContactDetail> details = contact.details(qtDefinitionName);
            foreach (const QContactDetail &detail, details) {
                QContactAvatar castedDetail = detail;
                fieldValues << QString("{type: \"%1\", value: \"%2\", pref: %3}")
                               .arg("url")
                               .arg(castedDetail.imageUrl().toString())
                               .arg("false");
            }
            fieldValuesList << QString("%1: [%2]")
                               .arg(field)
                               .arg(fieldValues.join(", "));
        } else if (field == "urls") {
            QStringList fieldValues;
            QList<QContactDetail> details = contact.details(qtDefinitionName);

            foreach (const QContactDetail &detail, details) {
                QContactUrl castedDetail = detail;
                QString subType = subTypeUrlToString(castedDetail.subType());

                fieldValues << QString("{type: \"%1\", value: \"%2\", pref: %3}")
                               .arg(subType)
                               .arg(castedDetail.url())
                               .arg("false");
            }
            fieldValuesList << QString("%1: [%2]")
                               .arg(field)
                               .arg(fieldValues.join(", "));
        } else if (field == "birthday") {
            QContactBirthday detail = contact.detail(qtDefinitionName);
            fieldValuesList << QString("%1: %2")
                               .arg(field)
                               .arg(detail.dateTime().toMSecsSinceEpoch());
        } else if (field == "organizations") {
            QStringList fieldValues;
            QList<QContactDetail> details = contact.details(qtDefinitionName);
            foreach (const QContactDetail &detail, details) {
                QContactOrganization castedDetail = detail;
                fieldValues << QString("{type: \"%1\", name: \"%2\", department: \"%3\", title: \"%4\", pref: %5}")
                               .arg("organization")
                               .arg(castedDetail.name())
                               .arg(castedDetail.department().join(" "))
                               .arg(castedDetail.role())
                               .arg("false");
            }
            fieldValuesList << QString("%1: [%2]")
                               .arg(field)
                               .arg(fieldValues.join(", "));
        } else if (field == "name") {
            QContactName detail = contact.detail(qtDefinitionName);
            fieldValuesList <<  QString("%1: {familyName: \"%2\", givenName: \"%3\", middleName: \"%4\", honorificPrefix: \"%5\", honorificSuffix: \"%6\"}")
                                .arg(field)
                                .arg(detail.lastName())
                                .arg(detail.firstName())
                                .arg(detail.middleName())
                                .arg(detail.prefix())
                                .arg(detail.suffix());
        }


    }

    return QString("{%1}").arg(fieldValuesList.join(", "));
}
