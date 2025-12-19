package usb

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

// Settings contains application settings
type Settings struct {
	LastColor     string `json:"lastColor"`     // Last selected color in RRGGBB format
	AutoApply     bool   `json:"autoApply"`     // Automatically apply on connection
	LaunchAtLogin bool   `json:"launchAtLogin"` // Launch at system login
}

var settingsPath string

func init() {
	// Determine the path to the settings file
	homeDir, err := os.UserHomeDir()
	if err != nil {
		homeDir = "."
	}
	settingsPath = filepath.Join(homeDir, ".quadcast-ui-settings.json")
}

// LoadSettings loads settings from file
func LoadSettings() (*Settings, error) {
	// Default values
	settings := &Settings{
		LastColor:     "ff0000", // Red by default
		AutoApply:     false,
		LaunchAtLogin: false,
	}

	// Read file
	data, err := os.ReadFile(settingsPath)
	if err != nil {
		// If file doesn't exist, return default settings
		if os.IsNotExist(err) {
			return settings, nil
		}
		return nil, fmt.Errorf("error reading settings: %v", err)
	}

	// Parse JSON
	if err := json.Unmarshal(data, settings); err != nil {
		return nil, fmt.Errorf("error parsing settings: %v", err)
	}

	return settings, nil
}

// SaveSettings saves settings to file
func SaveSettings(settings *Settings) error {
	// Convert to JSON
	data, err := json.MarshalIndent(settings, "", "  ")
	if err != nil {
		return fmt.Errorf("error serializing settings: %v", err)
	}

	// Write to file
	if err := os.WriteFile(settingsPath, data, 0644); err != nil {
		return fmt.Errorf("error saving settings: %v", err)
	}

	return nil
}

// GetSettingsPath returns the path to the settings file
func GetSettingsPath() string {
	return settingsPath
}
