# OP-mon Wireframes

## Start Screen

```text
+--------------------------------------------------+
|                      OP-mon                      |
|                                                  |
|                Top 3 High Scores                 |
|         1. AAA  12000  10:43                    |
|         2. BBB   9800  08:12                    |
|         3. CCC   7500  06:55                    |
|                                                  |
|                 [ Start Game ]                   |
|                                                  |
|        Move: WASD  |  Advance: O / P             |
+--------------------------------------------------+
```

## Countdown Screen

```text
+--------------------------------------------------+
| HUD: Lives 3 | Score 0 | Time 00:00              |
|--------------------------------------------------|
|                                                  |
|                     Ready?                       |
|                       3                          |
|                       2                          |
|                       1                          |
|                      Go!                         |
|                                                  |
|              Move: WASD + O / P                 |
+--------------------------------------------------+
```

## Game Screen

```text
+--------------------------------------------------+
| Lives 3 | Score 00000 | Time 00:00 | Mode: Run   |
|--------------------------------------------------|
|                                                  |
|                  Maze Board Grid                 |
|   Walls, gems, power-ups, ghosts, player token   |
|                                                  |
|                                                  |
|--------------------------------------------------|
| Move: WASD changes facing, O/P advances 1 tile   |
| [ End Game ]                                     |
+--------------------------------------------------+
```

## Game Over Screen

```text
+--------------------------------------------------+
|                    Game Over                     |
|                                                  |
|   Final Score: 14800                             |
|   Time Survived: 12:31                           |
|                                                  |
|   Leaderboard                                    |
|   1. AAA  20000                                  |
|   2. YOU  14800                                  |
|   3. CCC   7500                                  |
|                                                  |
|   [ Play Again ]   [ Back to Title ]             |
+--------------------------------------------------+
```

## HUD Elements

- Lives counter
- Score display
- Elapsed time display in `mm:ss`
- Current mode indicator:
  - `Run`
  - `Recovery`
  - `Ghost Hunter`
- Optional feedback text for pickups and hits
