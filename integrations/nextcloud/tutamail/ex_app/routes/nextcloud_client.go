package routes

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

type NextcloudClient struct {
	nextcloudUrl string
	appId        string
	appVersion   string
	secret       string
}

func NewNextcloudClientFromEnv() *NextcloudClient {
	return &NextcloudClient{
		nextcloudUrl: os.Getenv("NEXTCLOUD_URL"),
		appId:        os.Getenv("APP_ID"),
		appVersion:   os.Getenv("APP_VERSION"),
		secret:       os.Getenv("APP_SECRET"),
	}
}

func (c *NextcloudClient) authHeader(userId string) string {
	mac := hmac.New(sha256.New, []byte(c.secret))
	mac.Write([]byte(userId))
	digest := hex.EncodeToString(mac.Sum(nil))
	return base64.StdEncoding.EncodeToString([]byte(userId + ":" + digest))
}

func (c *NextcloudClient) ocsPost(path string, payload map[string]interface{}, userId string) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", c.nextcloudUrl+path, bytes.NewReader(body))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("EX-APP-ID", c.appId)
	req.Header.Set("EX-APP-VERSION", c.appVersion)
	req.Header.Set("AUTHORIZATION-APP-API", c.authHeader(userId))
	req.Header.Set("OCS-APIREQUEST", "true")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("OCS POST %s returned status %d", path, resp.StatusCode)
	}
	return nil
}

func (c *NextcloudClient) RegisterTopMenu(name, displayName, icon string, adminRequired bool, userId string) error {
	return c.ocsPost("/ocs/v1.php/apps/app_api/api/v1/ui/top-menu", map[string]interface{}{
		"name":          name,
		"displayName":   displayName,
		"icon":          icon,
		"adminRequired": adminRequired,
	}, userId)
}
