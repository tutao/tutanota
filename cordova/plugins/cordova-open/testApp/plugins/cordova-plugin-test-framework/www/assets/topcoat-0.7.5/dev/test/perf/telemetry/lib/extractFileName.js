var extractFileName = function (path) {
    if (path.split('/').length > 1) {
        sep = '/';
    } else if (path.split('\\').length > 1) {
        sep = '\\';
    } else {
        throw new Error('ERROR: the separator in test result file path is neither "/" nor "\\".');
    }
    return path.split(sep).pop().split('.')[0];
};

module.exports = extractFileName;