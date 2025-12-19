package usb

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"runtime"
	"strings"
)

// findQuadcastRGB searches for quadcastrgb in standard locations
func findQuadcastRGB() string {
	// Standard Homebrew paths
	paths := []string{
		"/opt/homebrew/bin/quadcastrgb", // Apple Silicon
		"/usr/local/bin/quadcastrgb",    // Intel Mac
		"/opt/local/bin/quadcastrgb",    // MacPorts
	}

	// First try via PATH
	if path, err := exec.LookPath("quadcastrgb"); err == nil {
		return path
	}

	// Check standard paths
	for _, path := range paths {
		if _, err := os.Stat(path); err == nil {
			return path
		}
	}

	return ""
}

// findBrew searches for brew in standard locations
func findBrew() string {
	paths := []string{
		"/opt/homebrew/bin/brew", // Apple Silicon
		"/usr/local/bin/brew",    // Intel Mac
	}

	// First try via PATH
	if path, err := exec.LookPath("brew"); err == nil {
		return path
	}

	// Check standard paths
	for _, path := range paths {
		if _, err := os.Stat(path); err == nil {
			return path
		}
	}

	return ""
}

// CheckAndInstallDependencies checks and installs required dependencies
func CheckAndInstallDependencies() error {
	// Check if quadcastrgb is installed
	if findQuadcastRGB() != "" {
		return nil // Already installed
	}

	// Try to install
	return installQuadcastRGB()
}

// installQuadcastRGB installs quadcastrgb via Homebrew
func installQuadcastRGB() error {
	if runtime.GOOS != "darwin" {
		return fmt.Errorf("automatic installation is only supported on macOS")
	}

	// Check for Homebrew
	brewPath := findBrew()
	if brewPath == "" {
		return fmt.Errorf("Homebrew is not installed. Install it from https://brew.sh")
	}

	// Install quadcastrgb via Homebrew
	cmd := exec.Command(brewPath, "install", "quadcastrgb")
	cmd.Stdout = io.Discard
	cmd.Stderr = io.Discard
	err := cmd.Run()
	if err != nil {
		return fmt.Errorf("error installing quadcastrgb: %v", err)
	}

	// Verify successful installation
	if findQuadcastRGB() == "" {
		return fmt.Errorf("quadcastrgb not found after installation")
	}

	// quadcastrgb successfully installed
	return nil
}

// GetDependencyStatus returns the status of dependencies
func GetDependencyStatus() (bool, string) {
	// Check quadcastrgb
	quadcastPath := findQuadcastRGB()
	if quadcastPath == "" {
		// Check Homebrew
		if findBrew() == "" {
			return false, "Homebrew installation required:\ncurl -fsSL https://brew.sh | bash\n\nThen install quadcastrgb:\nbrew install quadcastrgb"
		}
		return false, "quadcastrgb installation required:\nbrew install quadcastrgb"
	}

	// Get version
	cmd := exec.Command(quadcastPath, "--version")
	cmd.Stderr = io.Discard
	output, err := cmd.Output()
	if err != nil {
		return true, fmt.Sprintf("quadcastrgb installed at %s", quadcastPath)
	}

	version := strings.TrimSpace(string(output))
	return true, fmt.Sprintf("quadcastrgb %s", version)
}
