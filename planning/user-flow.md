# OP-mon User Flow

## High-Level Flow

```text
Start Screen
  -> Countdown Screen
    -> Game Screen
      -> Play Loop
        -> Win/High Score Check or Game Over
          -> Restart / Back to Title
```

## Detailed Flow

1. The player lands on the Start Screen.
2. The Start Screen displays the current top 3 scores and a `Start Game` button.
3. The player clicks `Start Game`.
4. A short countdown appears: `Ready? 3 2 1 Go!`.
5. The Game Screen loads and gameplay begins.
6. During play, the game repeatedly checks:
   - player movement validity
   - gem collection
   - power-up collection
   - ghost collisions
   - recovery timing
   - Ghost Hunter timing
   - ghost spawning
   - gem spawning
   - game over state
7. If the player runs out of lives, the Game Over screen appears.
8. The Game Over screen shows the final score and leaderboard status.
9. If the score is high enough, the player can enter 3-character initials.
10. The player can choose to play again or return to the title screen.

## State Transitions

- `title` -> `countdown` when Start Game is pressed
- `countdown` -> `playing` when countdown completes
- `playing` -> `gameover` when lives reach 0
- `gameover` -> `title` when returning to title
- `gameover` -> `countdown` when starting a new run

## Leaderboard Flow

1. On game over, compare the final score to the current top 3 scores.
2. If the score qualifies, prompt for initials.
3. Save the score and initials.
4. Sort leaderboard entries in descending score order.
5. Show updated leaderboard on the title screen.
