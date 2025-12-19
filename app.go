package main

import (
	"context"
	"fmt"
	"quadcast-ui/usb"
)

// App struct
type App struct {
	ctx    context.Context
	device *usb.Quadcast
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// shutdown is called when the app closes
func (a *App) shutdown(ctx context.Context) {
	// Cleanup on exit
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// CheckDependencies checks dependency status
func (a *App) CheckDependencies() map[string]interface{} {
	installed, message := usb.GetDependencyStatus()
	return map[string]interface{}{
		"installed": installed,
		"message":   message,
	}
}

// InstallDependencies installs required dependencies
func (a *App) InstallDependencies() error {
	return usb.CheckAndInstallDependencies()
}

// GetUSBDevices returns USB device list for debugging
func (a *App) GetUSBDevices() string {
	return usb.GetUSBDevicesList()
}

func (a *App) Connect() error {
	dev, err := usb.Open()
	if err != nil {
		return err
	}
	a.device = dev
	return nil
}

func (a *App) SetColor(r, g, b uint8) error {
	return a.device.SetColor(byte(r), byte(g), byte(b))
}

func (a *App) Off() error {
	return a.device.Off()
}

// LoadSettings loads application settings
func (a *App) LoadSettings() map[string]interface{} {
	settings, err := usb.LoadSettings()
	if err != nil {
		return map[string]interface{}{
			"error":     err.Error(),
			"lastColor": "ff0000",
		}
	}
	return map[string]interface{}{
		"lastColor": settings.LastColor,
	}
}

// SaveColorSetting saves selected color
func (a *App) SaveColorSetting(hexColor string) error {
	settings, err := usb.LoadSettings()
	if err != nil {
		settings = &usb.Settings{}
	}

	settings.LastColor = hexColor
	return usb.SaveSettings(settings)
}
