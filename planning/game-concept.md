# OP-mon Game Concept Overview

## Title

OP-mon

## Genre

Single-player browser arcade game with maze navigation, resource collection, and ghost-avoidance/combat.

## Core Idea

The player moves through a 25x17 labyrinth, collecting gems for points while avoiding ghosts. Power-ups temporarily switch the player into Ghost Hunter mode, allowing ghosts to be collected for escalating bonus points. The game ends when all lives are lost.

## Goal

Score as many points as possible by collecting gems, surviving ghosts, and chaining ghost captures during Power-Up mode.

## Primary Rules

- The player starts at the bottom-center of the maze.
- Movement uses two control layers:
  - `WASD` changes facing direction.
  - `O` and `P` are alternating move inputs that advance the player one tile in the current facing direction.
- The player can move only onto non-wall tiles.
- Gems spawn on empty tiles over time and are worth points when collected.
- Power-ups spawn in the four corners and grant temporary Ghost Hunter mode.
- Ghosts spawn from the center tomb and roam the maze.
- The player has 3 lives.
- Contact with a ghost removes a life unless the player is in Ghost Hunter mode.
- After losing a life, the player enters a 3-second recovery state.
- While recovering, the player can still move but cannot collect gems or power-ups and cannot be hurt by ghosts.
- Ghost Hunter mode lets the player collect ghosts for bonus points.
- Each consecutive ghost captured in a single Ghost Hunter streak is worth double the previous capture.
- Power-up collection refreshes the Ghost Hunter timer.
- The streak bonus resets when Ghost Hunter mode ends.

## Win/Lose Condition

- The game is primarily score-driven and survival-based.
- The session ends when the player loses all lives.
- Final score is compared against the top 3 recorded scores for the title screen leaderboard.

## Design Intent

The game should feel fast, readable, and slightly chaotic. The maze layout creates spatial pressure, while the alternating key movement system adds a rhythm-based control challenge that makes movement feel deliberate instead of free-form.
