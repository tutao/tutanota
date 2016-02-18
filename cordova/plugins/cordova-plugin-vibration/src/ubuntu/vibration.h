/*
 *
 * Copyright 2013 Canonical Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
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

#ifndef _VIBRATION_H_SFAFKNVX3456
#define _VIBRATION_H_SFAFKNVX3456

#include <QtCore>
#include <QFeedbackHapticsEffect>
#include <cplugin.h>

class Vibration: public CPlugin {
    Q_OBJECT
public:
    explicit Vibration(Cordova *cordova): CPlugin(cordova) {
    }

    virtual const QString fullName() override {
        return Vibration::fullID();
    }

    virtual const QString shortName() override {
        return "Vibration";
    }

    static const QString fullID() {
        return "Vibration";
    }
public slots:
    void vibrate(int, int, int mills);
    void cancelVibration(int, int);
    void vibrateWithPattern(int, int, const QList<int> &pattern, int);

private:
    QList<QSharedPointer<QFeedbackEffect>> _effects;
    QList<QSharedPointer<QTimer>> _timers;
};

#endif
