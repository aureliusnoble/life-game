# The behaviour library: a verdict for each

Made by `node design/checks/mech/verdicts.js` from the results kept in this folder. Do not edit by hand. The four tests and what they mean are in `design/mechanics.md`, section 3. A verdict names the first test a behaviour fails.

| Source | Behaviours | Pass | Cannot be written | Do not fit | Do not do it | Do not pay | Gaps in the notation |
|---|---|---|---|---|---|---|---|
| Tested recipes (`neural-blocks.md`, section 11) | 5 | 3 | 0 | 0 | 1 | 1 | 0 |
| **All** | **5** | **3** | 0 | 0 | 1 | 1 | 0 |

## Tested recipes (`neural-blocks.md`, section 11)

3 of 5 pass.

| Behaviour | Verdict | Instincts and moods | Its count | The plainer versions | Notes |
|---|---|---|---|---|---|
| Torn between food and fear | **Does not do it** | 4 and 0 | 2.6 bites eaten in 1500 beats | 6.1 no fear; 0 always moves away |  |
| Remembering a place | Passes | 5 and 1 | 10.8 bites eaten in 2000 beats | 4.1 no memory |  |
| Pack hunt on big prey | **Does not pay** | 8 and 2 | 5.2 hunters still alive when the prey is dead, of 8 (none if it never is) | 7.7 attack on sight; 0.1 brave, but no call |  |
| Flocking | Passes | 4 and 0 | 400 beats on which all eight are within 45 of their middle, of the last 400 | 0 wandering only; 87.9 gathering, but each going its own way |  |
| Flashing in time | Passes | 2 and 1 | 89.7 beats on which all four are lit together, of the last 300 | 26.9 no hurrying |  |

