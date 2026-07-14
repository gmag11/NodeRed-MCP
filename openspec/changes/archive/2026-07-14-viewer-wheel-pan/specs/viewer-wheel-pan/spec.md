## ADDED Requirements

### Requirement: Mouse wheel pans view vertically
The viewer SHALL pan the flow view vertically when the user rotates the mouse wheel up or down, instead of zooming.

#### Scenario: Wheel scroll down
- **WHEN** user scrolls the mouse wheel down while hovering over the flow viewer
- **THEN** the view pans downward by a fixed pixel increment proportional to the wheel delta

#### Scenario: Wheel scroll up
- **WHEN** user scrolls the mouse wheel up while hovering over the flow viewer
- **THEN** the view pans upward by a fixed pixel increment proportional to the wheel delta

### Requirement: Mouse wheel tilt pans view horizontally
The viewer SHALL pan the flow view horizontally when the user tilts the mouse wheel left or right.

#### Scenario: Wheel tilt right
- **WHEN** user tilts the mouse wheel to the right while hovering over the flow viewer
- **THEN** the view pans right by a fixed pixel increment proportional to the tilt delta

#### Scenario: Wheel tilt left
- **WHEN** user tilts the mouse wheel to the left while hovering over the flow viewer
- **THEN** the view pans left by a fixed pixel increment proportional to the tilt delta

### Requirement: Pinch-to-zoom and drag-to-pan remain unchanged
The viewer SHALL preserve the existing pinch-to-zoom (touch gesture) and click-and-drag pan behaviors without modification.

#### Scenario: Pinch gesture zooms
- **WHEN** user performs a two-finger pinch gesture on the flow viewer
- **THEN** the view zooms in or out according to the pinch scale

#### Scenario: Click and drag pans
- **WHEN** user clicks and drags on the flow viewer background
- **THEN** the view pans following the cursor movement

### Requirement: Ctrl+wheel zooms the view
The viewer SHALL zoom in and out when the user rotates the mouse wheel while holding the Ctrl key.

#### Scenario: Ctrl+wheel up zooms in
- **WHEN** user holds Ctrl and scrolls the mouse wheel up while hovering over the flow viewer
- **THEN** the view zooms in centered on the cursor position

#### Scenario: Ctrl+wheel down zooms out
- **WHEN** user holds Ctrl and scrolls the mouse wheel down while hovering over the flow viewer
- **THEN** the view zooms out centered on the cursor position
