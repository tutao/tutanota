if (typeof importScripts !== 'function') {
    tutao.env = new tutao.Environment(tutao.Env.LOCAL_COMPILED, false, '192.168.178.46', 9000);
    tutao.tutanota.Bootstrap.init();
}
