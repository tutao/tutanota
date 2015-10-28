if (typeof importScripts !== 'function') {
    // this is not a worker, see : https://github.com/kripken/emscripten/blob/54b0f19d9e8130de16053b0915d114c346c99f17/src/shell.js
    tutao.env = new tutao.Environment(tutao.Env.LOCAL, location.protocol == 'https:', location.hostname, location.port === '' ? '' : location.port, "http://pay.localhost:9000", "0.0.0");
    tutao.tutanota.Bootstrap.init();
}