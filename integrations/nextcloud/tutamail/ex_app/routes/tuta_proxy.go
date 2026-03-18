package routes

import (
	"log"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"sync"
	"time"
)

const UserProxyTtl = 1 * time.Hour
const CleanupJobInterval = 15 * time.Minute

type ProxyValueWithTTL struct {
	reverseProxy     *httputil.ReverseProxy
	lastTimeAccessed time.Time
}

type TutaProxy struct {
	userProxies sync.Map
	target      url.URL
	rootHandler *http.ServeMux
}

func NewTutaProxy(targetTutaHost string) *TutaProxy {
	target, _ := url.Parse(targetTutaHost)
	return &TutaProxy{
		userProxies: sync.Map{},
		rootHandler: http.NewServeMux(),
		target:      *target,
	}
}

func (p *TutaProxy) getUserProxy(userSessionId string) *httputil.ReverseProxy {
	v, loadOk := p.userProxies.Load(userSessionId)
	if loadOk {
		proxy, ok := v.(*ProxyValueWithTTL)
		if !ok {
			log.Fatal("Proxy sync Map has invalid entry type (not ProxyValueWithTTL)")
			return nil
		}
		proxy.lastTimeAccessed = time.Now()
		return proxy.reverseProxy
	}

	newProxy := &ProxyValueWithTTL{}
	newProxy.lastTimeAccessed = time.Now()
	newProxy.reverseProxy = &httputil.ReverseProxy{
		Rewrite: p.rewriteProxyRequest,
	}

	p.userProxies.Store(userSessionId, newProxy)
	return newProxy.reverseProxy

}

func (p *TutaProxy) rewriteProxyRequest(r *httputil.ProxyRequest) {
	var proxyUpstream url.URL

	targetServerHeader := r.In.Header.Get("X-Nextcloud-BaseUrl")
	if targetServerHeader != "" {
		targetServer, err := url.Parse(targetServerHeader)
		if err != nil {
			log.Fatalln("Invalid url value in 'X-Nextcloud-BaseUrl' header. value: ", targetServer, " Error: ", err)
			return
		}
		proxyUpstream = *targetServer
	} else {
		proxyUpstream = p.target
	}
	r.In.Header.Del("X-Nextcloud-BaseUrl")
	r.Out.Host = proxyUpstream.Host
	r.Out.URL.Host = proxyUpstream.Host
	r.Out.URL.Scheme = proxyUpstream.Scheme
}

func (p *TutaProxy) StartProxyCleanupJob() {
	for {
		time.Sleep(CleanupJobInterval)
		now := time.Now()
		p.userProxies.Range(func(sessionId, proxy any) bool {
			typedProxy, ok := proxy.(*ProxyValueWithTTL)
			if !ok {
				log.Fatal("Proxy sync Map has invalid entry type (not ProxyValueWithTTL)")
				return true
			}
			if now.Sub(typedProxy.lastTimeAccessed) > UserProxyTtl {
				p.userProxies.Delete(sessionId)
			}
			return true
		})
	}
}

func (p *TutaProxy) Run(listenAddress string) {
	loggedMux := loggingMiddleware(p.rootHandler)

	hpSharedKey := os.Getenv("HP_SHARED_KEY")
	if hpSharedKey != "" {
		socketPath := "/tmp/exapp.sock"
		// Clean up stale socket
		if err := os.RemoveAll(socketPath); err != nil {
			log.Fatal(err)
		}

		var listener net.Listener
		var err error
		listener, err = net.Listen("unix", socketPath)
		if err != nil {
			log.Fatal(err)
		}

		log.Println("Listening on unix socket:", socketPath)
		http.Serve(listener, loggedMux)
	} else {
		err := http.ListenAndServe(listenAddress, loggedMux)
		log.Fatalln("TutaProxy ended: ", err)

	}

}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		next.ServeHTTP(w, r)

		log.Printf("%s %s",
			r.Method, r.URL.Path,
		)
	})
}
