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

#ifndef CONTACTS_H_SSSSSSS
#define CONTACTS_H_SSSSSSS

#include <cplugin.h>

#include <QtContacts>
#include <QtCore>

QTCONTACTS_USE_NAMESPACE

class Contacts : public CPlugin {
    Q_OBJECT
public:
    explicit Contacts(Cordova *cordova);

    virtual const QString fullName() override {
        return Contacts::fullID();
    }

    virtual const QString shortName() override {
        return "Contacts";
    }

    static const QString fullID() {
        return "Contacts";
    }

public slots:
    void save(int scId, int ecId, const QVariantMap &params);
    void remove(int scId, int ecId, const QString &localId);
    void search(int scId, int ecId, const QStringList &fields, const QVariantMap &params);

private:
    void findContacts(int scId, int ecId, const QStringList &fields, const QString &filter, bool multiple);
    QContactDetail::DetailType cordovaFieldNameToQtDefinition(const QString &cordovaFieldName) const;
    int subTypePhoneFromString(const QString &cordovaSubType) const;
    int subTypeOnlineAccountFromString(const QString &cordovaSubType) const;
    int subTypeUrlFromString(const QString &cordovaSubType) const;
    QString subTypePhoneToString(int qtSubType) const;
    QString subTypeOnlineAccountToString(int qtSubType) const;
    QString subTypeUrlToString(int qtSubType) const;
    QString jsonedContact(const QContact &contact, const QStringList &fields = QStringList()) const;

    QHash<QString, QContactDetail::DetailType> m_fieldNamePairs;
    QSet<QString> m_notSupportedFields;
    QSharedPointer<QContactManager> m_manager;
};

#endif
