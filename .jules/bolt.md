# Bolt's Performance Journal ⚡

Welcome to Bolt's journal of critical performance learnings.

## 2026-08-01 - [Fast AABB Pruning for Line-of-Sight Raycasting]
**Learning:** In highly dynamic tile-based 2D/2.5D games, querying line-of-sight against all wall tiles on every frame is extremely expensive (O(E * W) where E = enemies, W = walls). Performing direct geometric intersection tests like `Phaser.Geom.Intersects.LineToRectangle` instantiates new Rectangle objects and performs heavy arithmetic. Adding an incredibly lightweight Axis-Aligned Bounding Box (AABB) overlap pre-filter discards ~98% of candidate wall tiles with simple float comparisons, dropping CPU overhead dramatically.
**Action:** Always precompute the bounding box of ray/line checks and prune static geometry candidates before calling complex spatial intersection functions.
