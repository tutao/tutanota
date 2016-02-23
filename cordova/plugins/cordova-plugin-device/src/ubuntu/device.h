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

#ifndef DEVICE_H_FDSAFAS
#define DEVICE_H_FDSAFAS

#include <QtCore>

#include <cplugin.h>

class Device: public CPlugin {
    Q_OBJECT
public:
    explicit Device(Cordova *cordova);

    virtual const QString fullName() override {
        return Device::fullID();
    }

    virtual const QString shortName() override {
        return "Device";
    }

    static const QString fullID() {
        return "com.cordova.Device";
    }

signals:

public slots:
    void getInfo(int scId, int ecId);
};

#endif
