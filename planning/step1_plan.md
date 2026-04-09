### Step 1 — Plan

Produce a clear spec before writing code.

#### Game Concept

**Game Type:** Browser-based
**Core Idea:** Single player pac-man-like game where player navigates the labyrinth and collect points while avoiding ghosts.
**Target Audience:** Casual players, all ages

#### Game Rules (MVP)

- Player start at the bottom center position of the labyrinth.
- Player uses 2 control systems to move: Alternating keys O and P to move forward, WASD to change direction.
- Player may move freely on any non-wall tiles.
- Player earns points by collecting Gems in the labyrinth.
- Empty tiles spawns Gems periodically.
- Player has 3 lives.
- Game is over when Player loses all lives.
- Ghosts spawn from a tomb that is at the center of the labyrinth.
- A Ghost is spawned periodically.
- A maximum of 4 Ghosts can be spawned.
- Player loses a life when in contact with a Ghost.
- Player enters recovery state for 3 seconds when losing a life.
- In recovery state, Player is retains ability to move but is unable to collect gems and power-ups and is invulnerable to Ghosts.
- A Power-up is placed on each corner of the labyrinth.
- Collecting a Power-up makes the Player a Ghost hunter temporarily.
- Ghost hunter collects Ghosts when in contact.
- Ghost are worth more points.
- Each consecutive Ghost collected is worth twice of the previous Ghost.
- Ghost hunter mode expires after a duration.
- Collecting another Power-up during Ghost hunter mode resets the duration.
- Consecutive bonus resets when Ghost hunter mode ends.
- Power-Ups respawn periodically.
- Game over when Player loses all lives.

#### User Flow

1. **Start Screen** → Shows top 3 scores → Click "Start Game"
1. **Countdown Screen** → Countdown to game start (Ready?-3-2-1-Go!)
1. **Game Screen** → Player moves using button controls → Check for valid movement direction → Check for gems → Check for power-ups → Check for ghosts → Check for game over
1. **Game over Condition** → Display score → Check if score higher than top 3 scores → Option to enter initals (3 characters) if score is higher → Option to restart
1. **Restart** → Reset game state → Return to start screen or begin new game

#### UI Wireframes

**Start Screen:**

```
+------------------------------------+
|               OP-mon               |
|                                    |
| [ 1. AAA : Score : Time Survived ] |
| [ 2. AAA : Score : Time Survived ] |
| [ 3. AAA : Score : Time Survived ] |
|                                    |
|        [ Start Game Button ]       |
+------------------------------------+
```

**Countdown Screen:**

```
+------------------------------------+
| HUD: Lives | Score | Elapsed --:-- |
+------------------------------------+
|                                    |
|                                    |
|         Ready?-3-2-1-Go!           |
|                                    |
|                                    |
+------------------------------------+
|   Instructions: Player controls    |
+------------------------------------+
```

**Game Screen:**

```
+------------------------------------+
| HUD: Lives | Score | Elapsed mm:ss |
+------------------------------------+
|                                    |
| 25x17 Game Board Grid              |
| (with 1x1 wall on every even row and column) |
| (with 7x3 tomb in the center)      |
| (tomb is surrounded with walls)    |
| (tomb exit is in the center of the top wall) |
|                                    |
+------------------------------------+
|   Instructions: Player controls    |
|            [ End game ]            |
+------------------------------------+
```

**Win Screen (Modal):**

```
+------------------------------------+
|             Game Over              |
|                                    |
|   Rank 1. AAA : Score : Time       |
|   Rank 2. ___ : 10,000 : 10:43     |
|   (Enter initials)                 |
|   Rank 3. CCC : Score : Time       |
|                                    |
|  [ Play Again ]  [ Back to Title ] |
+------------------------------------+
```

#### Asset List

- **Graphics:**
  - Power-Ups
  - Gems
  - Player avatar
  - Ghost token colours/avatars
- **Audio (optional):**
  - Power-Up collected sound
  - Gem collected sound
  - Move sound (O, P)
  - Game over stinger
  - Background music
- **Fonts:** Readable sans-serif (e.g., system fonts or Google Fonts)

#### Technical Blueprint

**File Structure:**

```
.
├─ index.html
├─ script.js
├─ styler.css
└─ assets/
   ├─ images/
   └─ audio/
```

**Core Systems:**

1. **Game State Management:**
   - Player object: `{lives, pos, state, duration}`
   - Player states: 'ghostHunter', 'recovery', 'dead'
   - Game status: 'countdown', 'playing', 'gameover'
   - Power-Up object: `{id, state, cooldown}`
   - Gem object: `{id, state, cooldown}`
   - Ghost object: `{id, state, cooldown}`

2. **Board System:**
   - 425 squares (1-425)
   - Tomb layout: 7x3 grid with the parameter filled with 1x1 walls and an exit in the center of the top parameter
   - Visual layout: 25x17 grid with 1x1 walls on each even column intersecting each even row

3. **Game Loop:**
   - Move player (1 step in the facing direction per O then P keypresses)
   - Move ghosts individually based on current speed
   - Collect Gems/Power-Ups when overlapping
   - Check player state when overlapping ghosts (lose life or collect ghost based on state)
   - Respawn Gems/Power-Ups when cooldown over
   - Respawn Ghost at tomb when cooldown over

4. **Input Handling:**
   - O and P combo keys pressed to move 1 square
   - WASD keys pressed to change player direction
   - Start game button
   - End game button (when game has started)
   - Play again button (when game ends)
   - Back to Title button (when game ends)
   - Input for initials (when score is higher than any of the current top 3 score)

5. **Rendering:**
   - DOM-based board (CSS Grid)
   - Player tokens positioned absolutely or via CSS transforms
   - HUD updates (lives left, current game score, elapsed time mm:ss)
