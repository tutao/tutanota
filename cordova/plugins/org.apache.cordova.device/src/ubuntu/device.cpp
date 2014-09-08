/*
 *  Copyright 2011 Wolfgang Koller - http://www.gofg.at/
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

#include <QDeviceInfo>
#include <QtSystemInfo>

#include"device.h"

#define CORDOVA "3.0.0"

Device::Device(Cordova *cordova) : CPlugin(cordova) {
}

static QString getOSName() {
#ifdef Q_OS_SYMBIAN
    QString platform = "Symbian";
#endif
#ifdef Q_OS_WIN
    QString platform = "Windows";
#endif
#ifdef Q_OS_WINCE
    QString platform = "Windows CE";
#endif
#ifdef Q_OS_LINUX
    QString platform = "Linux";
#endif
    return platform;
}

void Device::getInfo(int scId, int ecId) {
    Q_UNUSED(ecId)

    QDeviceInfo systemDeviceInfo;
    QDeviceInfo systemInfo;

    QString platform = getOSName();

    QString uuid = systemDeviceInfo.uniqueDeviceID();
    if (uuid.isEmpty()) {
        QString deviceDescription = systemInfo.imei(0) + ";" + systemInfo.manufacturer() + ";" + systemInfo.model() + ";" + systemInfo.productName() + ";" + platform;
        QString user = qgetenv("USER");
        if (user.isEmpty()) {
            user = qgetenv("USERNAME");
            if (user.isEmpty())
                user = QDir::homePath();
        }
        uuid = QString(QCryptographicHash::hash((deviceDescription + ";" + user).toUtf8(), QCryptographicHash::Md5).toHex());
    }

    this->cb(scId, systemDeviceInfo.model(), CORDOVA, platform, uuid, systemInfo.version(QDeviceInfo::Os));
}
