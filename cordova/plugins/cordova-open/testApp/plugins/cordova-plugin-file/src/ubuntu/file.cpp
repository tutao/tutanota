/*
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

#include "file.h"

#include <QApplication>

namespace {
    class FileError {
    public:
        static const QString kEncodingErr;
        static const QString kTypeMismatchErr;
        static const QString kNotFoundErr;
        static const QString kSecurityErr;
        static const QString kAbortErr;
        static const QString kNotReadableErr;
        static const QString kNoModificationAllowedErr;
        static const QString kInvalidStateErr;
        static const QString kSyntaxErr;
        static const QString kInvalidModificationErr;
        static const QString kQuotaExceededErr;
        static const QString kPathExistsErr;
    };

    bool checkFileName(const QString &name) {
        if (name.contains(":")){
            return false;
        }
        return true;
    }
};

const QString FileError::kEncodingErr("FileError.ENCODING_ERR");
const QString FileError::kTypeMismatchErr("FileError.TYPE_MISMATCH_ERR");
const QString FileError::kNotFoundErr("FileError.NOT_FOUND_ERR");
const QString FileError::kSecurityErr("FileError.SECURITY_ERR");
const QString FileError::kAbortErr("FileError.ABORT_ERR");
const QString FileError::kNotReadableErr("FileError.NOT_READABLE_ERR");
const QString FileError::kNoModificationAllowedErr("FileError.NO_MODIFICATION_ALLOWED_ERR");
const QString FileError::kInvalidStateErr("FileError.INVALID_STATE_ERR");
const QString FileError::kSyntaxErr("FileError.SYNTAX_ERR");
const QString FileError::kInvalidModificationErr("FileError.INVALID_MODIFICATION_ERR");
const QString FileError::kQuotaExceededErr("FileError.QUOTA_EXCEEDED_ERR");
const QString FileError::kPathExistsErr("FileError.PATH_EXISTS_ERR");

File::File(Cordova *cordova) :
    CPlugin(cordova),
    _persistentDir(QString("%1/.local/share/%2/persistent").arg(QDir::homePath()).arg(QCoreApplication::applicationName())) {
    QDir::root().mkpath(_persistentDir.absolutePath());
}

QVariantMap File::file2map(const QFileInfo &fileInfo) {
    QVariantMap res;

    res.insert("name", fileInfo.fileName());
    QPair<QString, QString> r = GetRelativePath(fileInfo);
    res.insert("fullPath", QString("/") + r.second);
    res.insert("filesystemName", r.first);

    res.insert("nativeURL", QString("file://localhost") + fileInfo.absoluteFilePath());
    res.insert("isDirectory", (int)fileInfo.isDir());
    res.insert("isFile", (int)fileInfo.isFile());

    return res;
}

QVariantMap File::dir2map(const QDir &dir) {
    return file2map(QFileInfo(dir.absolutePath()));
}

QPair<QString, QString> File::GetRelativePath(const QFileInfo &fileInfo) {
    QString fullPath = fileInfo.isDir() ? QDir::cleanPath(fileInfo.absoluteFilePath()) : fileInfo.absoluteFilePath();

    QString relativePath1 = _persistentDir.relativeFilePath(fullPath);
    QString relativePath2 = QDir::temp().relativeFilePath(fullPath);

    if (!(relativePath1[0] != '.' || relativePath2[0] != '.')) {
        if (relativePath1.size() > relativePath2.size()) {
            return QPair<QString, QString>("temporary", relativePath2);
        } else {
            return QPair<QString, QString>("persistent", relativePath1);
        }
    }

    if (relativePath1[0] != '.')
        return QPair<QString, QString>("persistent", relativePath1);
    return QPair<QString, QString>("temporary", relativePath2);
}

void File::requestFileSystem(int scId, int ecId, unsigned short type, unsigned long long size) {
    QDir dir;

    if (size >= 1000485760){
        this->callback(ecId, FileError::kQuotaExceededErr);
        return;
    }

    if (type == 0)
        dir = QDir::temp();
    else
        dir = _persistentDir;

    if (type > 1) {
        this->callback(ecId, FileError::kSyntaxErr);
        return;
    } else {
        QVariantMap res;
        res.insert("root", dir2map(dir));
        if (type == 0)
            res.insert("name", "temporary");
        else
            res.insert("name", "persistent");

        this->cb(scId, res);
    }
}

QPair<bool, QFileInfo> File::resolveURI(int ecId, const QString &uri) {
    QPair<bool, QFileInfo> result;

    result.first = false;

    QUrl url = QUrl::fromUserInput(uri);

    if (url.scheme() == "file" && url.isValid()) {
        result.first = true;
        result.second = QFileInfo(url.path());
        return result;
    }

    if (url.scheme() != "cdvfile") {
        if (ecId)
            this->callback(ecId, FileError::kTypeMismatchErr);
        return result;
    }

    QString path = url.path().replace("//", "/");
    //NOTE: colon is not safe in url, it is not a valid path in Win and Mac, simple disable it here.
    if (path.contains(":") || !url.isValid()){
        if (ecId)
            this->callback(ecId, FileError::kEncodingErr);
        return result;
    }
    if (!path.startsWith("/persistent/") && !path.startsWith("/temporary/")) {
        if (ecId)
            this->callback(ecId, FileError::kEncodingErr);
        return result;
    }

    result.first = true;
    if (path.startsWith("/persistent/")) {
        QString relativePath = path.mid(QString("/persistent/").size());
        result.second = QFileInfo(_persistentDir.filePath(relativePath));
    } else {
        QString relativePath = path.mid(QString("/temporary/").size());
        result.second = QFileInfo(QDir::temp().filePath(relativePath));
    }
    return result;
}

QPair<bool, QFileInfo> File::resolveURI(const QString &uri) {
    return resolveURI(0, uri);
}


void File::_getLocalFilesystemPath(int scId, int ecId, const QString& uri) {
    QPair<bool, QFileInfo> f1 = resolveURI(ecId, uri);

    if (!f1.first)
        return;

    this->cb(scId, f1.second.absoluteFilePath());
}

void File::resolveLocalFileSystemURI(int scId, int ecId, const QString &uri) {
    if (uri[0] == '/' || uri[0] == '.') {
        this->callback(ecId, FileError::kEncodingErr);
        return;
    }

    QPair<bool, QFileInfo> f1 = resolveURI(ecId, uri);

    if (!f1.first)
        return;

    QFileInfo fileInfo = f1.second;
    if (!fileInfo.exists()) {
        this->callback(ecId, FileError::kNotFoundErr);
        return;
    }

    this->cb(scId, file2map(fileInfo));
}

void File::getFile(int scId, int ecId, const QString &parentPath, const QString &rpath, const QVariantMap &options) {
    QPair<bool, QFileInfo> f1 = resolveURI(ecId, parentPath + "/" + rpath);
    if (!f1.first)
        return;

    bool create = options.value("create").toBool();
    bool exclusive = options.value("exclusive").toBool();
    QFile file(f1.second.absoluteFilePath());

    // if create is false and the path represents a directory, return error
    QFileInfo fileInfo = f1.second;
    if ((!create) && fileInfo.isDir()) {
        this->callback(ecId, FileError::kTypeMismatchErr);
        return;
    }

    // if file does exist, and create is true and exclusive is true, return error
    if (file.exists()) {
        if (create && exclusive) {
            this->callback(ecId, FileError::kPathExistsErr);
            return;
        }
    }
    else {
        // if file does not exist and create is false, return error
        if (!create) {
            this->callback(ecId, FileError::kNotFoundErr);
            return;
        }

        file.open(QIODevice::WriteOnly);
        file.close();

        // Check if creation was successfull
        if (!file.exists()) {
            this->callback(ecId, FileError::kNoModificationAllowedErr);
            return;
        }
    }

    this->cb(scId, file2map(QFileInfo(file)));
}

void File::getDirectory(int scId, int ecId, const QString &parentPath, const QString &rpath, const QVariantMap &options) {
    QPair<bool, QFileInfo> f1 = resolveURI(ecId, parentPath + "/" + rpath);
    if (!f1.first)
        return;

    bool create = options.value("create").toBool();
    bool exclusive = options.value("exclusive").toBool();
    QDir dir(f1.second.absoluteFilePath());

    QFileInfo &fileInfo = f1.second;
    if ((!create) && fileInfo.isFile()) {
        this->callback(ecId, FileError::kTypeMismatchErr);
        return;
    }

    if (dir.exists()) {
        if (create && exclusive) {
            this->callback(ecId, FileError::kPathExistsErr);
            return;
        }
    }
    else {
        if (!create) {
            this->callback(ecId, FileError::kNotFoundErr);
            return;
        }

        QString folderName = dir.dirName();
        dir.cdUp();
        dir.mkdir(folderName);
        dir.cd(folderName);

        if (!dir.exists()) {
            this->callback(ecId, FileError::kNoModificationAllowedErr);
            return;
        }
    }

    this->cb(scId, dir2map(dir));
}

void File::removeRecursively(int scId, int ecId, const QString &uri) {
    QPair<bool, QFileInfo> f1 = resolveURI(ecId, uri);

    if (!f1.first)
        return;

    QDir dir(f1.second.absoluteFilePath());
    if (File::rmDir(dir))
        this->cb(scId);
    else
        this->callback(ecId, FileError::kNoModificationAllowedErr);
}

void File::write(int scId, int ecId, const QString &uri, const QString &_data, unsigned long long position, bool binary) {
    QPair<bool, QFileInfo> f1 = resolveURI(ecId, uri);

    if (!f1.first)
        return;

    QFile file(f1.second.absoluteFilePath());

    file.open(QIODevice::WriteOnly);
    file.close();

    if (!file.exists()) {
        this->callback(ecId, FileError::kNotFoundErr);
        return;
    }

    QFileInfo fileInfo(file);
    if (!file.open(QIODevice::ReadWrite)) {
        this->callback(ecId, FileError::kNoModificationAllowedErr);
        return;
    }

    if (!binary) {
        QTextStream textStream(&file);
        textStream.setCodec("UTF-8");
        textStream.setAutoDetectUnicode(true);

        if (!textStream.seek(position)) {
            file.close();
            fileInfo.refresh();

            this->callback(ecId, FileError::kInvalidModificationErr);
            return;
        }

        textStream << _data;
        textStream.flush();
    } else {
        QByteArray data(_data.toUtf8());
        if (!file.seek(position)) {
            file.close();
            fileInfo.refresh();

            this->callback(ecId, FileError::kInvalidModificationErr);
            return;
        }

        file.write(data.data(), data.length());
    }

    file.flush();
    file.close();
    fileInfo.refresh();

    this->cb(scId, fileInfo.size() - position);
}

void File::truncate(int scId, int ecId, const QString &uri, unsigned long long size) {
    QPair<bool, QFileInfo> f1 = resolveURI(ecId, uri);

    if (!f1.first)
        return;

    QFile file(f1.second.absoluteFilePath());

    if (!file.exists()) {
        this->callback(ecId, FileError::kNotFoundErr);
        return;
    }

    if (!file.resize(size)) {
        this->callback(ecId, FileError::kNoModificationAllowedErr);
        return;
    }

    this->cb(scId, size);
}

void File::getParent(int scId, int ecId, const QString &uri) {
    QPair<bool, QFileInfo> f1 = resolveURI(ecId, uri);

    if (!f1.first)
        return;
    QDir dir(f1.second.absoluteFilePath());

    //can't cdup more than app's root
    // Try to change into upper directory
    if (dir != _persistentDir && dir != QDir::temp()){
        if (!dir.cdUp()) {
            this->callback(ecId, FileError::kNotFoundErr);
            return;
        }

    }
    this->cb(scId, dir2map(dir));
}

void File::remove(int scId, int ecId, const QString &uri) {
    QPair<bool, QFileInfo> f1 = resolveURI(ecId, uri);
    if (!f1.first)
        return;

    QFileInfo &fileInfo = f1.second;
    //TODO: fix
    if (!fileInfo.exists() || (fileInfo.absoluteFilePath() == _persistentDir.absolutePath()) || (QDir::temp() == fileInfo.absoluteFilePath())) {
        this->callback(ecId, FileError::kNoModificationAllowedErr);
        return;
    }

    if (fileInfo.isDir()) {
        QDir dir(fileInfo.absoluteFilePath());
        if (dir.rmdir(dir.absolutePath())) {
            this->cb(scId);
            return;
        }
    } else {
        QFile file(fileInfo.absoluteFilePath());
        if (file.remove()) {
            this->cb(scId);
            return;
        }
    }

    this->callback(ecId, FileError::kInvalidModificationErr);
}

void File::getFileMetadata(int scId, int ecId, const QString &uri) {
    QPair<bool, QFileInfo> f1 = resolveURI(ecId, uri);

    if (!f1.first)
        return;
    QFileInfo &fileInfo = f1.second;

    if (!fileInfo.exists()) {
        this->callback(ecId, FileError::kNotFoundErr);
    } else {
        QMimeType mime = _db.mimeTypeForFile(fileInfo.fileName());

        QString args = QString("{name: %1, fullPath: %2, type: %3, lastModifiedDate: new Date(%4), size: %5}")
            .arg(CordovaInternal::format(fileInfo.fileName())).arg(CordovaInternal::format(fileInfo.absoluteFilePath()))
            .arg(CordovaInternal::format(mime.name())).arg(fileInfo.lastModified().toMSecsSinceEpoch())
            .arg(fileInfo.size());

        this->callback(scId, args);
    }
}

void File::getMetadata(int scId, int ecId, const QString &uri) {
    QPair<bool, QFileInfo> f1 = resolveURI(ecId, uri);

    if (!f1.first)
        return;
    QFileInfo &fileInfo = f1.second;

    if (!fileInfo.exists())
        this->callback(ecId, FileError::kNotFoundErr);
    else {
        QVariantMap obj;
        obj.insert("modificationTime", fileInfo.lastModified().toMSecsSinceEpoch());
        obj.insert("size", fileInfo.isDir() ? 0 : fileInfo.size());
        this->cb(scId, obj);
    }
}

void File::readEntries(int scId, int ecId, const QString &uri) {
    QPair<bool, QFileInfo> f1 = resolveURI(ecId, uri);

    if (!f1.first)
        return;
    QDir dir(f1.second.absoluteFilePath());
    QString entriesList;

    if (!dir.exists()) {
        this->callback(ecId, FileError::kNotFoundErr);
        return;
    }

    for (const QFileInfo &fileInfo: dir.entryInfoList(QDir::Dirs | QDir::Files | QDir::NoDotAndDotDot)) {
        entriesList += CordovaInternal::format(file2map(fileInfo)) + ",";
    }
    // Remove trailing comma
    if (entriesList.size() > 0)
        entriesList.remove(entriesList.size() - 1, 1);

    entriesList = "new Array(" + entriesList + ")";

    this->callback(scId, entriesList);
}

void File::readAsText(int scId, int ecId, const QString &uri, const QString &/*encoding*/, int sliceStart, int sliceEnd) {
    QPair<bool, QFileInfo> f1 = resolveURI(ecId, uri);

    if (!f1.first)
        return;

    QFile file(f1.second.absoluteFilePath());

    if (!file.exists()) {
        this->callback(ecId, FileError::kNotFoundErr);
        return;
    }

    if (!file.open(QIODevice::ReadOnly)) {
        this->callback(ecId, FileError::kNotReadableErr);
        return;
    }

    QByteArray content = file.readAll();

    if (sliceEnd == -1)
        sliceEnd = content.size();
    if (sliceEnd < 0) {
        sliceEnd++;
        sliceEnd = std::max(0, content.size() + sliceEnd);
    }
    if (sliceEnd > content.size())
        sliceEnd = content.size();

    if (sliceStart < 0)
        sliceStart = std::max(0, content.size() + sliceStart);
    if (sliceStart > content.size())
        sliceStart = content.size();

    if (sliceStart > sliceEnd)
        sliceEnd = sliceStart;

    //FIXME: encoding
    content = content.mid(sliceStart, sliceEnd - sliceStart);

    this->cb(scId, content);
}

void File::readAsArrayBuffer(int scId, int ecId, const QString &uri, int sliceStart, int sliceEnd) {
    const QString str2array("\
    (function strToArray(str) {                 \
        var res = new Uint8Array(str.length);   \
        for (var i = 0; i < str.length; i++) {  \
            res[i] = str.charCodeAt(i);         \
        }                                       \
        return res;                             \
    })(\"%1\")");

    QPair<bool, QFileInfo> f1 = resolveURI(ecId, uri);

    if (!f1.first)
        return;

    QFile file(f1.second.absoluteFilePath());

    if (!file.exists()) {
        this->callback(ecId, FileError::kNotFoundErr);
        return;
    }

    if (!file.open(QIODevice::ReadOnly)) {
        this->callback(ecId, FileError::kNotReadableErr);
        return;
    }
    QString res;
    QByteArray content = file.readAll();

    if (sliceEnd == -1)
        sliceEnd = content.size();
    if (sliceEnd < 0) {
        sliceEnd++;
        sliceEnd = std::max(0, content.size() + sliceEnd);
    }
    if (sliceEnd > content.size())
        sliceEnd = content.size();

    if (sliceStart < 0)
        sliceStart = std::max(0, content.size() + sliceStart);
    if (sliceStart > content.size())
        sliceStart = content.size();

    if (sliceStart > sliceEnd)
        sliceEnd = sliceStart;

    content = content.mid(sliceStart, sliceEnd - sliceStart);

    res.reserve(content.length() * 6);
    for (uchar c: content) {
        res += "\\x";
        res += QString::number(c, 16).rightJustified(2, '0').toUpper();
    }

    this->callback(scId, str2array.arg(res));
}

void File::readAsBinaryString(int scId, int ecId, const QString &uri, int sliceStart, int sliceEnd) {
    QPair<bool, QFileInfo> f1 = resolveURI(ecId, uri);

    if (!f1.first)
        return;

    QFile file(f1.second.absoluteFilePath());

    if (!file.exists()) {
        this->callback(ecId, FileError::kNotFoundErr);
        return;
    }

    if (!file.open(QIODevice::ReadOnly)) {
        this->callback(ecId, FileError::kNotReadableErr);
        return;
    }
    QString res;
    QByteArray content = file.readAll();

    if (sliceEnd == -1)
        sliceEnd = content.size();
    if (sliceEnd < 0) {
        sliceEnd++;
        sliceEnd = std::max(0, content.size() + sliceEnd);
    }
    if (sliceEnd > content.size())
        sliceEnd = content.size();

    if (sliceStart < 0)
        sliceStart = std::max(0, content.size() + sliceStart);
    if (sliceStart > content.size())
        sliceStart = content.size();

    if (sliceStart > sliceEnd)
        sliceEnd = sliceStart;

    content = content.mid(sliceStart, sliceEnd - sliceStart);

    res.reserve(content.length() * 6);
    for (uchar c: content) {
        res += "\\x";
        res += QString::number(c, 16).rightJustified(2, '0').toUpper();
    }
    this->callback(scId, "\"" + res + "\"");
}

void File::readAsDataURL(int scId, int ecId, const QString &uri, int sliceStart, int sliceEnd) {
    QPair<bool, QFileInfo> f1 = resolveURI(ecId, uri);

    if (!f1.first)
        return;

    QFile file(f1.second.absoluteFilePath());
    QFileInfo &fileInfo = f1.second;

    if (!file.exists()) {
        this->callback(ecId, FileError::kNotReadableErr);
        return;
    }

    if (!file.open(QIODevice::ReadOnly)) {
        this->callback(ecId, FileError::kNotReadableErr);
        return;
    }

    QByteArray content = file.readAll();
    QString contentType(_db.mimeTypeForFile(fileInfo.fileName()).name());

    if (sliceEnd == -1)
        sliceEnd = content.size();
    if (sliceEnd < 0) {
        sliceEnd++;
        sliceEnd = std::max(0, content.size() + sliceEnd);
    }
    if (sliceEnd > content.size())
        sliceEnd = content.size();

    if (sliceStart < 0)
        sliceStart = std::max(0, content.size() + sliceStart);
    if (sliceStart > content.size())
        sliceStart = content.size();

    if (sliceStart > sliceEnd)
        sliceEnd = sliceStart;

    content = content.mid(sliceStart, sliceEnd - sliceStart);

    this->cb(scId, QString("data:%1;base64,").arg(contentType) + content.toBase64());
}

bool File::rmDir(const QDir &dir) {
    if (dir == _persistentDir || dir == QDir::temp()) {//can't remove root dir
        return false;
    }
    bool result = true;
    if (dir.exists()) {
        // Iterate over entries and remove them
        Q_FOREACH(const QFileInfo &fileInfo, dir.entryInfoList(QDir::Dirs | QDir::Files | QDir::NoDotAndDotDot)) {
            if (fileInfo.isDir()) {
                result = rmDir(fileInfo.absoluteFilePath());
            }
            else {
                result = QFile::remove(fileInfo.absoluteFilePath());
            }

            if (!result) {
                return result;
            }
        }

        // Finally remove the current dir
        return dir.rmdir(dir.absolutePath());
    }
    return result;
}

bool File::copyFile(int scId, int ecId,const QString& sourceUri, const QString& destinationUri, const QString& newName) {
    QPair<bool, QFileInfo> destDir = resolveURI(ecId, destinationUri);
    QPair<bool, QFileInfo> sourceFile = resolveURI(ecId, sourceUri);

    if (!destDir.first || !sourceFile.first)
        return false;

    if (!checkFileName(newName)) {
        this->callback(ecId, FileError::kEncodingErr);
        return false;
    }

    if (destDir.second.isFile()) {
        this->callback(ecId, FileError::kInvalidModificationErr);
        return false;
    }

    if (!destDir.second.isDir()) {
        this->callback(ecId, FileError::kNotFoundErr);
        return false;
    }

    QFileInfo &fileInfo = sourceFile.second;
    QString fileName((newName.isEmpty()) ? fileInfo.fileName() : newName);
    QString destinationFile(QDir(destDir.second.absoluteFilePath()).filePath(fileName));
    if (QFile::copy(fileInfo.absoluteFilePath(), destinationFile)){
        this->cb(scId, file2map(QFileInfo(destinationFile)));
        return true;
    }
    this->callback(ecId, FileError::kInvalidModificationErr);
    return false;
}

void File::copyDir(int scId, int ecId,const QString& sourceUri, const QString& destinationUri, const QString& newName) {
    QPair<bool, QFileInfo> destDir = resolveURI(ecId, destinationUri);
    QPair<bool, QFileInfo> sourceDir = resolveURI(ecId, sourceUri);

    if (!destDir.first || !sourceDir.first)
        return;
    if (!checkFileName(newName)) {
        this->callback(ecId, FileError::kEncodingErr);
        return;
    }

    QString targetName = ((newName.isEmpty()) ? sourceDir.second.fileName() : newName);
    QString target(QDir(destDir.second.absoluteFilePath()).filePath(targetName));

    if (QFileInfo(target).isFile()){
        this->callback(ecId, FileError::kInvalidModificationErr);
        return;
    }

    // check: copy directory into itself
    if (QDir(sourceDir.second.absoluteFilePath()).relativeFilePath(target)[0] != '.'){
        this->callback(ecId, FileError::kInvalidModificationErr);
        return;
    }

    if (!QDir(target).exists()){
        QDir(destDir.second.absoluteFilePath()).mkdir(target);;
    } else{
        this->callback(ecId, FileError::kInvalidModificationErr);
        return;
    }

    if (copyFolder(sourceDir.second.absoluteFilePath(), target)){
        this->cb(scId, dir2map(QDir(target)));
        return;
    }
    this->callback(ecId, FileError::kInvalidModificationErr);
    return;
}

void File::copyTo(int scId, int ecId, const QString& source, const QString& destinationDir, const QString& newName) {
    QPair<bool, QFileInfo> f1 = resolveURI(ecId, source);

    if (!f1.first)
        return;

    if (f1.second.isDir())
        copyDir(scId, ecId, source, destinationDir, newName);
    else
        copyFile(scId, ecId, source, destinationDir, newName);
}

void File::moveFile(int scId, int ecId,const QString& sourceUri, const QString& destinationUri, const QString& newName) {
    QPair<bool, QFileInfo> sourceFile = resolveURI(ecId, sourceUri);
    QPair<bool, QFileInfo> destDir = resolveURI(ecId, destinationUri);

    if (!destDir.first || !sourceFile.first)
        return;
    if (!checkFileName(newName)) {
        this->callback(ecId, FileError::kEncodingErr);
        return;
    }

    QString fileName = ((newName.isEmpty()) ? sourceFile.second.fileName() : newName);
    QString target = QDir(destDir.second.absoluteFilePath()).filePath(fileName);

    if (sourceFile.second == QFileInfo(target)) {
        this->callback(ecId, FileError::kInvalidModificationErr);
        return;
    }

    if (!destDir.second.exists()) {
        this->callback(ecId, FileError::kNotFoundErr);
        return;
    }
    if (!destDir.second.isDir()){
        this->callback(ecId, FileError::kInvalidModificationErr);
        return;
    }

    if (QFileInfo(target).exists()) {
        if (!QFile::remove(target)) {
            this->callback(ecId, FileError::kInvalidModificationErr);
            return;
        }
    }

    QFile::rename(sourceFile.second.absoluteFilePath(), target);
    this->cb(scId, file2map(QFileInfo(target)));
}

void File::moveDir(int scId, int ecId,const QString& sourceUri, const QString& destinationUri, const QString& newName){
    QPair<bool, QFileInfo> sourceDir = resolveURI(ecId, sourceUri);
    QPair<bool, QFileInfo> destDir = resolveURI(ecId, destinationUri);

    if (!destDir.first || !sourceDir.first)
        return;
    if (!checkFileName(newName)) {
        this->callback(ecId, FileError::kEncodingErr);
        return;
    }

    QString fileName = ((newName.isEmpty()) ? sourceDir.second.fileName() : newName);
    QString target = QDir(destDir.second.absoluteFilePath()).filePath(fileName);

    if (!destDir.second.exists()){
        this->callback(ecId, FileError::kNotFoundErr);
        return;
    }

    if (destDir.second.isFile()){
        this->callback(ecId, FileError::kInvalidModificationErr);
        return;
    }

    // check: copy directory into itself
    if (QDir(sourceDir.second.absoluteFilePath()).relativeFilePath(target)[0] != '.'){
        this->callback(ecId, FileError::kInvalidModificationErr);
        return;
    }

    if (QFileInfo(target).exists() && !QDir(destDir.second.absoluteFilePath()).rmdir(fileName)) {
        this->callback(ecId, FileError::kInvalidModificationErr);
        return;
    }

    if (copyFolder(sourceDir.second.absoluteFilePath(), target)) {
        rmDir(sourceDir.second.absoluteFilePath());
        this->cb(scId, file2map(QFileInfo(target)));
    } else {
        this->callback(ecId, FileError::kNoModificationAllowedErr);
    }
}

void File::moveTo(int scId, int ecId, const QString& source, const QString& destinationDir, const QString& newName) {
    QPair<bool, QFileInfo> f1 = resolveURI(ecId, source);

    if (!f1.first)
        return;

    if (f1.second.isDir())
        moveDir(scId, ecId, source, destinationDir, newName);
    else
        moveFile(scId, ecId, source, destinationDir, newName);
}

bool File::copyFolder(const QString& sourceFolder, const QString& destFolder) {
    QDir sourceDir(sourceFolder);
    if (!sourceDir.exists())
        return false;
    QDir destDir(destFolder);
    if (!destDir.exists()){
        destDir.mkdir(destFolder);
    }
    QStringList files = sourceDir.entryList(QDir::Files);
    for (int i = 0; i< files.count(); i++)
    {
        QString srcName = sourceFolder + "/" + files[i];
        QString destName = destFolder + "/" + files[i];
        QFile::copy(srcName, destName);
    }
    files.clear();
    files = sourceDir.entryList(QDir::AllDirs | QDir::NoDotAndDotDot);
    for (int i = 0; i< files.count(); i++)
    {
        QString srcName = sourceFolder + "/" + files[i];
        QString destName = destFolder + "/" + files[i];
        copyFolder(srcName, destName);
    }
    return true;
}
