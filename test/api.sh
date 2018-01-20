#!/bin/sh

## Manage `server.js` instance needed for server API tests.
##
## The scripts aims at preventing potential bad interactions with
## other `server.js` instances.  It introduces requirement on
## non-POSIX `pgrep` command in order to achieve that.
##
## The scripts aims at returning a distinct well-known exit code for
## each error case in each script invocation code path.  The reason
## for returning a distinct exit code is that the caller may swallow
## standard error and standard output, returning only the exit code
## (behaviour observed with `npm`).  The well-known exit codes are
## identified among the following:
## * http://tldp.org/LDP/abs/html/exitcodes.html
## * https://www.freebsd.org/cgi/man.cgi?query=sysexits&apropos=0&sektion=0&manpath=FreeBSD+11-current&arch=default&format=html

usage() {
  echo "$0 server <spawn|stop> <server_js_path>"
}

exit_usage() {
  usage 1>&2
  exit 64 ## EX_USAGE
}

euid() {
  id -un
}

server_count() {
  pgrep -c -u "${1:?}" -fx 'node .*server.js ABA_TAG=testapi'
}

server_desc() {
  pgrep -a -f 'server'
}

server_find() {
  pgrep -u "${1:?}" -fx 'node .*server.js ABA_TAG=testapi'
}

server_spawn() {
  ( U=$(euid)
    test -n "$U" || exit 67 ## EX_NOUSER
    S0=$(server_count "${U:?}")
    test 0 -eq $S0 || { echo "No expected server PIDs, observed $S0. A new more permissive search returns $(server_desc)." 1>&2; exit 78; } ## EX_CONFIG
    echo "Spawning server.js (euid=${U:?})."
    node "${1:?}" ABA_TAG=testapi & ## Customize command for preventing ABA problem with other scripts starting/stopping same server script.
    S=$!
    echo "Spawned server.js (pid=${S:?}; euid=${U:?})."
  )
}

server_stop() {
  ( U=$(euid)
    test -n "$U" || exit 67 ## EX_NOUSER
    S=$(server_find "${U:?}")
    test -n "$S" || { echo "One expected server PID, observed $S. A new more permissive search returns $(server_desc)." 1>&2; exit 70; } ## EX_SOFTWARE
    printf "%b" "Killing server.js (pid=${S:?}; euid=${U:?})..."
    kill -TERM ${S:?} || exit 69 ## EX_UNAVAILABLE (also catchall)
    while kill -0 ${S:?} 2>/dev/null; do
      kill -TERM ${S:?} 2>/dev/null
      printf "%b" "."
      sleep 1
    done
    printf "%b\n" " killed."
  )
}

case "$1" in
  server)
    case "$2" in
      spawn|stop)
        case "$3" in
          *server.js)
            test -f "$3" || exit 65 ## EX_DATAERR
            server_$2 "$3"
            ;;
          *) exit_usage
        esac
        ;;
      *) exit_usage
    esac
    ;;
  *) exit_usage
esac
