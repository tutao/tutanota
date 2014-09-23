/*
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

#ifndef NOTIFICATION_H
#define NOTIFICATION_H

#include <QtQuick>
#include <QMediaPlayer>
#include <cplugin.h>
#include <cordova.h>

class Dialogs: public CPlugin {
    Q_OBJECT
public:
    explicit Dialogs(Cordova *cordova): CPlugin(cordova), _alertCallback(0) {
    }

    virtual const QString fullName() override {
        return Dialogs::fullID();
    }

    virtual const QString shortName() override {
        return "Notification";
    }

    static const QString fullID() {
        return "Notification";
    }
public slots:
    void beep(int scId, int ecId, int times);
    void alert(int scId, int ecId, const QString &message, const QString &title, const QString &buttonLabel);
    void confirm(int scId, int ecId, const QString &message, const QString &title, const QStringList &buttonLabels);
    void prompt(int scId, int ecId, const QString &message, const QString &title, const QStringList &buttonLabels, const QString &defaultText);

    void notificationDialogButtonPressed(int buttonId, const QString &text, bool prompt) {
        if (prompt) {
            QVariantMap res;
            res.insert("buttonIndex", buttonId);
            res.insert("input1", text);
            this->cb(_alertCallback, res);
        } else {
            this->cb(_alertCallback, buttonId);
        }
        _alertCallback = 0;
    }

private:
    int _alertCallback;
    QMediaPlayer _player;
};

#endif
