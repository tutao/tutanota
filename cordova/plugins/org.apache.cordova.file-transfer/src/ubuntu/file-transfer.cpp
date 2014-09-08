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

#include "file-transfer.h"
#include <plugins/org.apache.cordova.file/file.h>
#include <cassert>

static void SetHeaders(QNetworkRequest &request, const QVariantMap &headers) {
    for (const QString &key: headers.keys()) {
        QVariant val = *headers.find(key);
        QString value = val.toString();
        if (val.userType() == QMetaType::QVariantList || val.userType() == QMetaType::QStringList) {
            QList<QVariant> list = val.toList();
            for (QVariant v: list) {
                if (value.size())
                    value += ", ";
                value += v.toString();
            }
        }
        request.setRawHeader(key.toUtf8(), value.toUtf8());
    }
}

void FileTransfer::download(int scId, int ecId, const QString& url, const QString &target, bool /*trustAllHost*/, int id, const QVariantMap &headers) {
    QSharedPointer<FileTransferRequest> request(new FileTransferRequest(_manager, scId, ecId, id, this));

    assert(_id2request.find(id) == _id2request.end());

    _id2request.insert(id, request);

    request->connect(request.data(), &FileTransferRequest::done, [&]() {
        auto it = _id2request.find(id);
        while (it != _id2request.end() && it.key() == id) {
            if (it.value().data() == request.data()) {
                _id2request.erase(it);
                break;
            }
            it++;
        }
    });
    request->download(url, target, headers);
}

void FileTransfer::upload(int scId, int ecId, const QString &fileURI, const QString& url, const QString& fileKey, const QString& fileName, const QString& mimeType,
                          const QVariantMap & params, bool /*trustAllHosts*/, bool /*chunkedMode*/, const QVariantMap &headers, int id, const QString &/*httpMethod*/) {
    QSharedPointer<FileTransferRequest> request(new FileTransferRequest(_manager, scId, ecId, id, this));

    assert(_id2request.find(id) == _id2request.end());

    _id2request.insert(id, request);

    request->connect(request.data(), &FileTransferRequest::done, [&]() {
        auto it = _id2request.find(id);
        while (it != _id2request.end() && it.key() == id) {
            if (it.value().data() == request.data()) {
                _id2request.erase(it);
                break;
            }
            it++;
        }
    });
    request->upload(url, fileURI, fileKey, fileName, mimeType, params, headers);
}

void FileTransfer::abort(int scId, int ecId, int id) {
    Q_UNUSED(scId)
    Q_UNUSED(ecId)

    auto it = _id2request.find(id);
    while (it != _id2request.end() && it.key() == id) {
        (*it)->abort();
        it++;
    }
}

void FileTransferRequest::download(const QString& uri, const QString &targetURI, const QVariantMap &headers) {
    QUrl url(uri);
    QNetworkRequest request;

    QSharedPointer<CPlugin> filePlugin(_plugin->cordova()->getPlugin<File>());

    if (!filePlugin.data())
        return;

    if (!url.isValid()) {
        QVariantMap map;
        map.insert("code", INVALID_URL_ERR);
        map.insert("source", uri);
        map.insert("target", targetURI);
        _plugin->cb(_ecId, map);
        emit done();
        return;
    }

    request.setUrl(url);
    if (url.password().size() || url.userName().size()) {
        QString headerData = "Basic " + (url.userName() + ":" + url.password()).toLocal8Bit().toBase64();
        request.setRawHeader("Authorization", headerData.toLocal8Bit());
    }
    SetHeaders(request, headers);
    _reply = QSharedPointer<QNetworkReply>(_manager.get(request));

    _reply->connect(_reply.data(), &QNetworkReply::finished, [this, targetURI, uri, filePlugin]() {
        if (!_scId || _reply->error() != QNetworkReply::NoError)
            return;

        QPair<bool, QFileInfo> f1(dynamic_cast<File*>(filePlugin.data())->resolveURI(targetURI));

        QFile res(f1.second.absoluteFilePath());
        if (!f1.first || !res.open(QIODevice::WriteOnly)) {
            QVariantMap map;
            map.insert("code", INVALID_URL_ERR);
            map.insert("source", uri);
            map.insert("target", targetURI);
            _plugin->cb(_ecId, map);
            emit done();
            return;
        }
        res.write(_reply->readAll());

        _plugin->cb(_scId, dynamic_cast<File*>(filePlugin.data())->file2map(f1.second));

        emit done();
    });
    _reply->connect(_reply.data(), SIGNAL(error(QNetworkReply::NetworkError)), this, SLOT(error(QNetworkReply::NetworkError)));
    _reply->connect(_reply.data(), SIGNAL(downloadProgress(qint64, qint64)), this, SLOT(progress(qint64, qint64)));
}

void FileTransferRequest::upload(const QString& _url, const QString& fileURI, QString fileKey, QString fileName, QString mimeType, const QVariantMap &params, const QVariantMap &headers) {
    QUrl url(_url);
    QNetworkRequest request;

    QSharedPointer<CPlugin> filePlugin(_plugin->cordova()->getPlugin<File>());

    if (!filePlugin.data())
        return;

    if (!url.isValid()) {
        QVariantMap map;
        map.insert("code", INVALID_URL_ERR);
        map.insert("source", fileURI);
        map.insert("target", _url);
        _plugin->cb(_ecId, map);
        emit done();
        return;
    }

    QPair<bool, QFileInfo> f1(dynamic_cast<File*>(filePlugin.data())->resolveURI(fileURI));
    QFile file(f1.second.absoluteFilePath());
    if (!f1.first || !file.open(QIODevice::ReadOnly)) {
        QVariantMap map;
        map.insert("code", FILE_NOT_FOUND_ERR);
        map.insert("source", fileURI);
        map.insert("target", _url);
        _plugin->cb(_ecId, map);
        emit done();
        return;
    }
    QString content{file.readAll()};

    request.setUrl(url);
    if (url.password().size() || url.userName().size()) {
        QString headerData = "Basic " + (url.userName() + ":" + url.password()).toLocal8Bit().toBase64();
        request.setRawHeader("Authorization", headerData.toLocal8Bit());
    }
    SetHeaders(request, headers);

    QString boundary = QString("CORDOVA-QT-%1A").arg(qrand());
    while (content.contains(boundary)) {
        boundary += QString("B%1A").arg(qrand());
    }

    request.setHeader(QNetworkRequest::ContentTypeHeader, QString("multipart/form-data; boundary=") + boundary);

    fileKey.replace("\"", "");
    fileName.replace("\"", "");
    mimeType.replace("\"", "");
    QString part = "--" + boundary + "\r\n";

    part += "Content-Disposition: form-data; name=\"" + fileKey +"\"; filename=\"" + fileName + "\"\r\n";
    part += "Content-Type: " + mimeType + "\r\n\r\n";
    part += content + "\r\n";

    for (QString key: params.keys()) {
        part += "--" + boundary + "\r\n";
        part += "Content-Disposition: form-data; name=\"" +  key + "\";\r\n\r\n";
        part += params.find(key)->toString();
        part += "\r\n";
    }

    part += QString("--") + boundary + "--" + "\r\n";

    _reply = QSharedPointer<QNetworkReply>(_manager.post(request, QByteArray(part.toUtf8())));

    _reply->connect(_reply.data(), &QNetworkReply::finished, [this, content]() {
        if (_reply->error() != QNetworkReply::NoError)
            return;
        int status = 200;
        QVariant statusCode = _reply->attribute(QNetworkRequest::HttpStatusCodeAttribute);

        if (statusCode.isValid()) {
            status = statusCode.toInt();
        }

        QVariantMap map;
        map.insert("responseCode", status);
        map.insert("response", QString(_reply->readAll()));
        map.insert("bytesSent", content.size());
        _plugin->cb(_scId, map);
        emit done();
    });
    _reply->connect(_reply.data(), SIGNAL(error(QNetworkReply::NetworkError)), this, SLOT(error(QNetworkReply::NetworkError)));
    _reply->connect(_reply.data(), SIGNAL(uploadProgress(qint64, qint64)), this, SLOT(progress(qint64, qint64)));
}

void FileTransferRequest::abort() {
    QVariantMap map;
    map.insert("code", ABORT_ERR);
    _plugin->cb(_ecId, map);
    _scId = 0;
    emit done();
}

void FileTransferRequest::error(QNetworkReply::NetworkError code) {
    Q_UNUSED(code);

    int status = 404;
    QVariant statusCode = _reply->attribute(QNetworkRequest::HttpStatusCodeAttribute);
    if (statusCode.isValid()) {
        status = statusCode.toInt();
    }

    QVariantMap map;
    map.insert("http_status", status);
    map.insert("body", QString(_reply->readAll()));
    map.insert("code", CONNECTION_ERR);
    _plugin->cb(_ecId, map);
    emit done();
}

void FileTransferRequest::progress(qint64 bytesReceived, qint64 bytesTotal) {
    QVariantMap map;
    map.insert("lengthComputable", true);
    map.insert("total", bytesTotal);
    map.insert("loaded", bytesReceived);

    if (bytesReceived && bytesTotal && _scId)
        _plugin->callbackWithoutRemove(_scId, CordovaInternal::format(map));
}
