package routes

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
)

func (p *TutaProxy) RegisterExAppEssentials() {
	p.rootHandler.HandleFunc("GET /heartbeat", p.heartbeatHandler)
	p.rootHandler.HandleFunc("PUT /enable", p.enableHandler)
}

func (p *TutaProxy) heartbeatHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(map[string]string{"status": "ok"}); err != nil {
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
		var body struct {
			UserId string `json:"userId"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			log.Printf("Warning: could not parse enable request body: %v", err)
		}

		client := NewNextcloudClientFromEnv()
		iconUrl := os.Getenv("NEXTCLOUD_URL") + "/apps/tutamail/img/tuta.svg"
		if err := client.RegisterTopMenu("tutamail", "Tuta Mail", iconUrl, false, body.UserId); err != nil {
			log.Printf("Failed to register top menu: %v", err)
			http.Error(w, "Failed to register top menu", http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(map[string]string{"status": "ok"}); err != nil {
		log.Fatalln(err)
	}
}
