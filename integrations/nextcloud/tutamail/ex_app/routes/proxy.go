package routes

import (
	"net/http"
	"net/url"
	"strings"
)

func (p *TutaProxy) RegisterTutaProxy() {
	p.rootHandler.HandleFunc("/patch/{patchPath...}", p.convertToActualPatch)
	p.rootHandler.HandleFunc("/rest/{appName}/{components...}", p.forwardToTuta)
}

// because the nextcloud server does not forward patch requests to us
// we will receive POST requests on /patch which we then convert to the actual PATCH request
func (p *TutaProxy) convertToActualPatch(w http.ResponseWriter, r *http.Request) {
	actualPath := strings.Replace(r.URL.Path, "/patch", "", 1)
	r.URL = &url.URL{Path: actualPath}
	r.Method = "PATCH"
	p.forwardToTuta(w, r)
}

func (p *TutaProxy) forwardToTuta(w http.ResponseWriter, r *http.Request) {
	sessionID, err := r.Cookie("nc_session_id")
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}
	p.getUserProxy(sessionID.Value).ServeHTTP(w, r)
}
