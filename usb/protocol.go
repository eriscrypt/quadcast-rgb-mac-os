package usb

import (
	"fmt"
	"io"
	"os/exec"
)

// SetColor sets the microphone LED color via quadcastrgb
func (q *Quadcast) SetColor(r, g, b byte) error {
	if !q.connected {
		return fmt.Errorf("device not connected")
	}

	// First, stop all previous quadcastrgb processes
	stopCmd := exec.Command("killall", "quadcastrgb")
	stopCmd.Stdout = io.Discard
	stopCmd.Stderr = io.Discard
	_ = stopCmd.Run() // Ignore error if process is not running

	// Convert RGB to hex
	hexColor := fmt.Sprintf("%02x%02x%02x", r, g, b)

	// Call quadcastrgb solid RRGGBB
	cmd := exec.Command(q.quadcastrgbCmd, "solid", hexColor)
	cmd.Stdout = io.Discard
	cmd.Stderr = io.Discard
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("error setting color: %v", err)
	}

	// Color set successfully
	return nil
}

// Off turns off the LED (by stopping the quadcastrgb process)
func (q *Quadcast) Off() error {
	if !q.connected {
		return fmt.Errorf("device not connected")
	}

	// Kill the quadcastrgb process if it's running
	cmd := exec.Command("killall", "quadcastrgb")
	cmd.Stdout = io.Discard
	cmd.Stderr = io.Discard
	_ = cmd.Run() // Ignore error if process is not running

	// LED turned off
	return nil
}
