package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/updater"
	"github.com/wailsapp/wails/v3/pkg/updater/providers/github"

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

	// 自动更新：app.Updater 由 application.New 创建，这里对其初始化并指向
	// 本项目的 GitHub Releases。SujianAssetMatcher 负责按平台挑选可安装的
	// 资产（darwin zip / windows 便携 exe / linux AppImage）。UpdateService
	// 经生成的绑定向前端暴露 Check / DownloadAndInstall / Restart。
	if gh, err := github.New(github.Config{
		Repository:   "sayhia/sujian",
		AssetMatcher: services.SujianAssetMatcher,
	}); err == nil {
		_ = app.Updater.Init(updater.Config{
			CurrentVersion: services.Version,
			Providers:      []updater.Provider{gh},
		})
		app.RegisterService(application.NewService(services.NewUpdateService(app.Updater)))
	}

	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
