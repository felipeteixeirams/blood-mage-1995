# Pixel Lab: tile prompts

**Mestre:** [operations](README.md)
**Status:** não verificado (depende de ferramenta externa: a interface do Pixel Lab não foi conferida)
**Verificado em:** —

Prompts and field values for environment tiles and floor decals. Global settings: [pixel-lab-config.md](pixel-lab-config.md). All entries use **Character Type** `Humanoid`, **Generation Mode** `Standard` and **Detail** `Highly detailed` (the tool's required fields; the subject is a tile). Floor tiles use the flat camera and no outline. Check `src/game/assets/assetManifest.json` for the tile keys that exist.

## `tile_floor_stone` (gothic catacomb stone floor)

* **Camera View:** `Top-down (flat)`
* **Character Size:** `32px`
* **Outline:** `No outline`
* **Character Description:**
  ```text
  Seamless dark gothic stone floor tile, cracked flagstones with dried blood stains in the crevices, ancient dungeon texture, 16-bit dark fantasy ARPG background tile, tileable
  ```

## `tile_wall_catacomb` (stone wall with skulls)

* **Camera View:** `Top-down (low)`
* **Character Size:** `64px`
* **Outline:** `Selective outline`
* **Character Description:**
  ```text
  Dark gothic catacomb stone wall with embedded human skulls and bones carved into masonry, grim dark fantasy dungeon architecture, 16-bit top-down wall tile
  ```

## `tile_blood_pool` (blood pool on the floor)

* **Camera View:** `Top-down (flat)`
* **Character Size:** `48px`
* **Outline:** `No outline`
* **Character Description:**
  ```text
  Fresh pool of dark crimson blood on grey stone floor, glossy wet specular highlights reflecting dim torchlight, gothic horror top-down floor decal, 16-bit pixel art
  ```
