package routes

import (
	"encoding/json"
	"log"
	"net/http"
)

func (p *TutaProxy) RegisterExAppEssentials() {
	p.rootHandler.HandleFunc("GET /heartbeat", p.heartbeatHandler)
	p.rootHandler.HandleFunc("PUT /enable", p.enableHandler)
}

func (p *TutaProxy) heartbeatHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	response := map[string]string{"status": "ok"}
	err := json.NewEncoder(w).Encode(response)
	if err != nil {
		log.Fatalln(err)
	}
}

func (p *TutaProxy) enableHandler(w http.ResponseWriter, r *http.Request) {
	enabledFlagParam := r.URL.Query().Get("enabled")
	isEnabled := enabledFlagParam == "1"
	isDisabled := enabledFlagParam == "0"
	if !isEnabled && !isDisabled {
		http.Error(w, "Invalid value for enabled query param", http.StatusBadRequest)
		return
	}

	if isEnabled {
		// noop
	} else {
		// noop
	}

	w.Header().Set("Content-Type", "application/json")
	response := map[string]string{"status": "ok"}
	err := json.NewEncoder(w).Encode(response)
	if err != nil {
		log.Fatalln(err)
	}
}
