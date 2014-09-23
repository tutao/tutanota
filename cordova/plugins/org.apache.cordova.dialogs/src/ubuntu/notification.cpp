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

#include "notification.h"

#include <QApplication>

void Dialogs::beep(int scId, int ecId, int times) {
    Q_UNUSED(scId)
    Q_UNUSED(ecId)
    Q_UNUSED(times)

    _player.setVolume(100);
    _player.setMedia(QUrl::fromLocalFile("/usr/share/sounds/ubuntu/stereo/bell.ogg"));
    _player.play();
}

void Dialogs::alert(int scId, int ecId, const QString &message, const QString &title, const QString &buttonLabel) {
    QStringList list;
    list.append(buttonLabel);

    confirm(scId, ecId, message, title, list);
}

void Dialogs::confirm(int scId, int ecId, const QString &message, const QString &title, const QStringList &buttonLabels) {
    Q_UNUSED(ecId);

    if (_alertCallback) {
        qCritical() << "can't open second dialog";
        return;
    }
    _alertCallback = scId;

    QString s1, s2, s3;
    if (buttonLabels.size() > 0)
        s1 = buttonLabels[0];
    if (buttonLabels.size() > 1)
        s2 = buttonLabels[1];
    if (buttonLabels.size() > 2)
        s3 = buttonLabels[2];

    QString path = m_cordova->get_app_dir() + "/../qml/notification.qml";
    QString qml = QString("PopupUtils.open(%1, root, { root: root, cordova: cordova, title: %2, text: %3, promptVisible: false, button1Text: %4, button2Text: %5, button3Text: %6 })")
        .arg(CordovaInternal::format(path)).arg(CordovaInternal::format(title)).arg(CordovaInternal::format(message))
        .arg(CordovaInternal::format(s1)).arg(CordovaInternal::format(s2)).arg(CordovaInternal::format(s3));

    m_cordova->execQML(qml);
}

void Dialogs::prompt(int scId, int ecId, const QString &message, const QString &title, const QStringList &buttonLabels, const QString &defaultText) {
    Q_UNUSED(ecId);

    if (_alertCallback) {
        qCritical() << "can't open second dialog";
        return;
    }
    _alertCallback = scId;

    QString s1, s2, s3;
    if (buttonLabels.size() > 0)
        s1 = buttonLabels[0];
    if (buttonLabels.size() > 1)
        s2 = buttonLabels[1];
    if (buttonLabels.size() > 2)
        s3 = buttonLabels[2];
    QString path = m_cordova->get_app_dir() + "/../qml/notification.qml";
    QString qml = QString("PopupUtils.open(%1, root, { root: root, cordova: cordova, title: %2, text: %3, promptVisible: true, defaultPromptText: %7, button1Text: %4, button2Text: %5, button3Text: %6 })")
        .arg(CordovaInternal::format(path)).arg(CordovaInternal::format(title)).arg(CordovaInternal::format(message))
        .arg(CordovaInternal::format(s1)).arg(CordovaInternal::format(s2))
        .arg(CordovaInternal::format(s3)).arg(CordovaInternal::format(defaultText));

    m_cordova->execQML(qml);
}
