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

#ifndef FILE_TRANSFER_H_SDASDASDAS
#define FILE_TRANSFER_H_SDASDASDAS

#include <QtCore>
#include <QtNetwork>

#include <cplugin.h>

class FileTransfer;

class FileTransferRequest: public QObject {
    Q_OBJECT

    QNetworkAccessManager &_manager;
    int _scId, _ecId;
    int _id;
    QSharedPointer<QNetworkReply> _reply;

    enum FileTransferError {
        FILE_NOT_FOUND_ERR = 1,
        INVALID_URL_ERR = 2,
        CONNECTION_ERR = 3,
        ABORT_ERR = 4
    };

public:
    FileTransferRequest(QNetworkAccessManager &manager, int scId, int ecId, int id, FileTransfer *plugin):
        _manager(manager),
        _scId(scId),
        _ecId(ecId),
        _id(id),
        _plugin(plugin) {
    }

    void download(const QString& url, const QString &targetURI, const QVariantMap &headers);
    void upload(const QString& _url, const QString& fileURI, QString fileKey, QString fileName, QString mimeType, const QVariantMap &params, const QVariantMap &headers);
    void abort();

signals:
    void done();

private slots:
    void progress(qint64 bytesReceived, qint64 bytesTotal);
    void error(QNetworkReply::NetworkError code);
private:
    FileTransfer *_plugin;
    Q_DISABLE_COPY(FileTransferRequest);
};

class FileTransfer : public CPlugin {
    Q_OBJECT
public:
    explicit FileTransfer(Cordova *cordova): CPlugin(cordova) {
    }

    Cordova* cordova() {
        return m_cordova;
    }

    virtual const QString fullName() override {
        return FileTransfer::fullID();
    }

    virtual const QString shortName() override {
        return "FileTransfer";
    }

    static const QString fullID() {
        return "FileTransfer";
    }

public slots:
    void abort(int scId, int ecId, int id);
    void download(int scId, int ecId, const QString& url, const QString &target, bool /*trustAllHost*/, int id, const QVariantMap &/*headers*/);
    void upload(int scId, int ecId, const QString &filePath, const QString& url, const QString& fileKey, const QString& fileName, const QString& mimeType,
                const QVariantMap & params, bool /*trustAllHosts*/, bool /*chunkedMode*/, const QVariantMap &headers, int id, const QString &httpMethod);

private:
    QNetworkAccessManager _manager;
    QMultiMap<int, QSharedPointer<FileTransferRequest> > _id2request;
    int lastRequestId;
};

#endif
