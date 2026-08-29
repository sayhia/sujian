package services

// Version 是应用版本号，用于界面展示与更新检查。发布时由构建注入：
//
//	-ldflags "-X sujian/backend/services.Version=<semver>"
//
// 本地/开发构建为 "dev"，发布构建携带打 tag 时的版本号（由
// release workflow 通过 Taskfile 的 VERSION 变量传入）。
var Version = "dev"
