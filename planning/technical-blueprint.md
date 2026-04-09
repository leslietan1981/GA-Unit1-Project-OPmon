# OP-mon Technical Blueprint

## File Structure

```text
.
├─ index.html
├─ style.css
├─ script.js
└─ planning/
   ├─ step1_plan.md
   ├─ game-concept.md
   ├─ user-flow.md
   ├─ wireframes.md
   ├─ assets.md
   └─ technical-blueprint.md
```

## Implementation Approach

Use a DOM-based board rendered with CSS Grid. The game board will be built from tiles rather than canvas so the maze, tokens, and UI states are easier to inspect and style.

## Core Systems

### 1. Game State Management

Use a single state object to track:

- current screen: `title`, `countdown`, `playing`, `gameover`
- player position, facing direction, lives, and temporary mode
- score and elapsed time
- leaderboard entries
- active gems, power-ups, and ghosts
- spawn cooldowns and timers

### 2. Board System

- Board size: `25 x 17`
- Total tiles: `425`
- Maze layout based on walls placed on even rows/columns
- Center tomb for ghost spawning
- Four corner power-up spawn points
- Bottom-center player spawn point

### 3. Input Handling

- `WASD` changes direction
- `O` and `P` act as alternating movement inputs
- Buttons handle title start, restart, and end game actions
- Initials input appears only when a leaderboard score qualifies

### 4. Game Loop

Use a timed update loop that handles:

- countdown progression
- player movement validation
- ghost movement
- collision checks
- recovery timer updates
- Ghost Hunter timer updates
- spawn cooldowns for gems, power-ups, and ghosts
- score and HUD refresh
- game over detection

### 5. Collision and Scoring Rules

- Gem pickup adds points and removes the gem from the board
- Power-up pickup starts or refreshes Ghost Hunter mode
- Ghost contact while in normal state removes one life and starts recovery
- Ghost contact while in Ghost Hunter mode awards score and removes the ghost
- Consecutive ghost captures in one Ghost Hunter streak double the previous reward

### 6. Rendering

- Render the board and entity layers in the DOM
- Use CSS classes to reflect tile type and entity state
- Update the HUD and screen visibility based on game state
- Use lightweight animation classes for countdown, pickup feedback, and mode changes

## Data Structures

### Player

```text
{
  position,
  direction,
  lives,
  state,
  recoveryEndsAt,
  hunterEndsAt,
  hunterChain,
  lastMoveKey
}
```

### Entity Objects

```text
{
  id,
  position,
  active,
  respawnAt
}
```

## Persistence

- Store top 3 leaderboard entries in `localStorage`
- Restore leaderboard data on page load

## Non-Functional Goals

- Keep the game responsive on desktop and mobile widths
- Avoid heavy dependencies
- Make game state changes easy to debug through clear DOM structure and explicit state transitions
