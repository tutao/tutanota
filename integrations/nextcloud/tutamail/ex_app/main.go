package main

import (
	"TutamailProxy/routes"
	"flag"
	"log"
	"os"
)

func main() {
	targetHost := flag.String("targetHost", "http://localhost:9000", "target host for tutadb")
	// listenAddress := flag.String("listenAddress", "0.0.0.0:10070", "Address to listen on for new connections")
	port := os.Getenv("APP_PORT")

	if port == "" {
		port = "10070"
	}
	listenAddress := "0.0.0.0:" + port
	flag.Parse()

	server := routes.NewTutaProxy(*targetHost)
	server.RegisterExAppEssentials()
	server.RegisterExtensionApi()
	server.RegisterTutaProxy()

	log.Println("Starting TutamailProxy...")
	server.Run(listenAddress)
}
