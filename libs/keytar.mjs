import require$$0 from '../build/Release/keytar.node';

var keytar = require$$0;

function checkRequired(val, name) {
  if (!val || val.length <= 0) {
    throw new Error(name + ' is required.');
  }
}

var keytar_1 = {
  getPassword: function (service, account) {
    checkRequired(service, 'Service');
    checkRequired(account, 'Account');

    return keytar.getPassword(service, account)
  },

  setPassword: function (service, account, password) {
    checkRequired(service, 'Service');
    checkRequired(account, 'Account');
    checkRequired(password, 'Password');

    return keytar.setPassword(service, account, password)
  },

  deletePassword: function (service, account) {
    checkRequired(service, 'Service');
    checkRequired(account, 'Account');

    return keytar.deletePassword(service, account)
  },

  findPassword: function (service) {
    checkRequired(service, 'Service');

    return keytar.findPassword(service)
  },

  findCredentials: function (service) {
    checkRequired(service, 'Service');

    return keytar.findCredentials(service)
  },
  /**
   * used as an error msg in keytar_posix.cc to signal that the user cancelled secret unlock
   */
  CANCELLED: "user_cancellation"
};

export { keytar_1 as default };
