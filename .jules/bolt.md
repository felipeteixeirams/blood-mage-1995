# Bolt's Performance Journal ⚡

Welcome to Bolt's journal of critical performance learnings.

## 2026-08-02 - [Retaining Accurate Wall-Collision Details in Combat State Pruning]
**Learning:** When attempting to prune line-of-sight/raycast calculations for active entities, we cannot simply default `hasWallBetween` to `true` or bypass checks for active combat states (combat, frenzy, flee). Doing so breaks target acquisition, projectile collisions, and movement behaviors, leading to a critical gameplay logic regression (e.g. enemies behaving as if blocked by a wall in open space). Raycast/LOS pruning must only be applied to passive states (idle, patrol, investigating) and based on maximum vision distances, while active combat states must retain 100% accurate real-time wall collision details.
**Action:** When optimizing spatial/LOS checks, apply pruning aggressively to out-of-range or passive entities, but ensure that any combat/active behavior state retains full and correct raycast checks to prevent wall-hacking or AI breakages.

## 2026-08-01 - [Fast AABB Pruning for Line-of-Sight Raycasting]
**Learning:** In highly dynamic tile-based 2D/2.5D games, querying line-of-sight against all wall tiles on every frame is extremely expensive (O(E * W) where E = enemies, W = walls). Performing direct geometric intersection tests like `Phaser.Geom.Intersects.LineToRectangle` instantiates new Rectangle objects and performs heavy arithmetic. Adding an incredibly lightweight Axis-Aligned Bounding Box (AABB) overlap pre-filter discards ~98% of candidate wall tiles with simple float comparisons, dropping CPU overhead dramatically.
**Action:** Always precompute the bounding box of ray/line checks and prune static geometry candidates before calling complex spatial intersection functions.

## 2025-02-15 - Optimizing Raycasting in Tilemap-based Games
**Learning:** In Phaser 3, executing geometric line-of-sight checks (like `Phaser.Geom.Intersects.LineToRectangle`) against large groups of wall sprites/elements for every active enemy on every single frame creates a massive performance bottleneck. Not only is the intersection calculation itself CPU-intensive, but instantiating new `Phaser.Geom.Rectangle` objects inside loops creates huge heap churn, leading to frequent garbage collection spikes and micro-stutters.
Additionally, updating FOV/LOS when enemies are far away from the player, or when they are already in a state where FOV is irrelevant (e.g. actively in combat, frenzy, or fleeing), wasted unnecessary CPU cycles.
**Action:** Always pre-allocate reusable geometric helper objects (such as `cachedLine` and `cachedRect`) to avoid runtime GC overhead. Before running expensive geometric checks, apply a fast bounding box (AABB) overlap pruning phase to quickly discard distant objects. Finally, only evaluate LOS / raycast checks when an entity's current AI state actually requires FOV, and they are within maximum perception distance.
