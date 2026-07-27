package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v3/pkg/application"

	"sujian/backend/db"
	"sujian/backend/handlers"
	"sujian/backend/services"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	database, err := db.New()
	if err != nil {
		log.Fatal(err)
	}
	defer database.Close()

	noteService := services.NewNoteService(database.GetDB())
	noteHandler := handlers.NewNoteHandler(noteService)

	app := application.New(application.Options{
		Name:        "sujian",
		Description: "A time capsule note application",
		Services: []application.Service{
			application.NewService(noteHandler),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:            "素笺 Sujian",
		Width:            1200,
		Height:           800,
		BackgroundColour: application.NewRGB(255, 255, 255),
		URL:              "/",
		Mac: application.MacWindow{
			TitleBar: application.MacTitleBarHiddenInset,
		},
	})

	err = app.Run()
	if err != nil {
		log.Fatal(err)
	}
}
