package usb

import (
	"fmt"
	"io"
	"os/exec"
	"runtime"
	"strings"
)

// Supported VendorID and ProductID
var (
	// VendorIDs
	VendorIDKingston = "0951" // HyperX/Kingston
	VendorIDHP       = "03f0" // HP (some revisions)

	// ProductIDs for different QuadCast versions
	SupportedProductIDs = []string{
		"171f", // QuadCast S
		"16d8", // QuadCast S (another revision)
		"16c1", // QuadCast (original)
		"0f8b", // DuoCast
		"028c", // QuadCast S (HP)
		"048c", // QuadCast S (HP)
		"068c", // QuadCast S (HP)
		"098c", // DuoCast (HP)
	}
)

type Quadcast struct {
	connected      bool
	quadcastrgbCmd string
}

func Open() (*Quadcast, error) {
	// Check for quadcastrgb utility
	quadcastrgbPath := findQuadcastRGB()
	if quadcastrgbPath == "" {
		return nil, fmt.Errorf("quadcastrgb utility not found. Install it via Homebrew:\nbrew install quadcastrgb\n\nOr download from: https://github.com/Ors1mer/QuadcastRGB")
	}

	// Check for device presence
	if err := checkDevice(); err != nil {
		return nil, err
	}

	return &Quadcast{
		connected:      true,
		quadcastrgbCmd: quadcastrgbPath,
	}, nil
}

func (q *Quadcast) Close() {
	q.connected = false
}

func checkDevice() error {
	switch runtime.GOOS {
	case "darwin":
		// First try ioreg (more reliable)
		cmd := exec.Command("ioreg", "-p", "IOUSB", "-w0", "-l")
		cmd.Stderr = io.Discard
		output, err := cmd.Output()

		if err != nil {
			// If ioreg doesn't work, try system_profiler
			cmd = exec.Command("system_profiler", "SPUSBDataType", "-detailLevel", "full")
			cmd.Stderr = io.Discard
			output, err = cmd.Output()
			if err != nil {
				return fmt.Errorf("failed to check USB devices: %v", err)
			}
		}

		outputStr := strings.ToLower(string(output))

		// Search by name
		if strings.Contains(outputStr, "hyperx") &&
			(strings.Contains(outputStr, "quadcast") || strings.Contains(outputStr, "duocast")) {
			return nil
		}

		// Search by Vendor ID
		if strings.Contains(outputStr, VendorIDKingston) || strings.Contains(outputStr, VendorIDHP) {
			// Check Product ID
			for _, pid := range SupportedProductIDs {
				if strings.Contains(outputStr, pid) {
					return nil
				}
			}
		}

		return fmt.Errorf("QuadCast device not found. Connect the microphone to the computer and make sure it's turned on")

	case "windows":
		return fmt.Errorf("Windows is not yet supported")

	case "linux":
		cmd := exec.Command("lsusb")
		cmd.Stderr = io.Discard
		output, err := cmd.Output()
		if err != nil {
			return fmt.Errorf("failed to check USB devices: %v", err)
		}

		outputStr := strings.ToLower(string(output))

		// Check Vendor IDs
		if strings.Contains(outputStr, VendorIDKingston) || strings.Contains(outputStr, VendorIDHP) {
			return nil
		}

		return fmt.Errorf("QuadCast device not found")

	default:
		return fmt.Errorf("platform %s is not supported", runtime.GOOS)
	}
}

// GetUSBDevicesList returns list of all USB devices for debugging
func GetUSBDevicesList() string {
	switch runtime.GOOS {
	case "darwin":
		// Try ioreg
		cmd := exec.Command("ioreg", "-p", "IOUSB", "-w0", "-l")
		cmd.Stderr = io.Discard
		output, err := cmd.Output()
		if err != nil {
			// Try system_profiler
			cmd = exec.Command("system_profiler", "SPUSBDataType")
			cmd.Stderr = io.Discard
			output, err = cmd.Output()
			if err != nil {
				return fmt.Sprintf("Error getting USB device list: %v", err)
			}
		}
		return string(output)

	case "linux":
		cmd := exec.Command("lsusb", "-v")
		cmd.Stderr = io.Discard
		output, err := cmd.Output()
		if err != nil {
			return fmt.Sprintf("Error getting USB device list: %v", err)
		}
		return string(output)

	default:
		return "Unsupported platform"
	}
}
