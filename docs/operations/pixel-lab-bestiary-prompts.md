# Pixel Lab: bestiary prompts

**Mestre:** [operations](README.md)
**Status:** não verificado
**Verificado em:** —
**Método:** não verificado
**Fonte:** —

Nota de verificação: depende de ferramenta externa: a interface do Pixel Lab não foi conferida.

Prompts and field values for the 11 enemies and bosses. Global settings: [pixel-lab-config.md](pixel-lab-config.md). All entries use **Camera View** `Top-down (low)` and **Detail** `Highly detailed` unless noted. Keys are the `spr_*` entries of `src/game/assets/assetManifest.json`; cell sizes there can differ from the generation size below.

### 1. `spr_skeleton` (Skeleton Warrior)
* `Humanoid` · `Pro` or `Standard` · `48px` · `Selective outline` (or `Default Black outline`)
  ```text
  Undead skeleton warrior, yellowed bone ribcage, glowing hollow eye sockets, rusted iron kettle helm, wielding a notched chipped broadsword and a battered dark wooden round shield, 16-bit retro dark fantasy pixel art, grimdark aesthetic, clean outline, transparent background
  ```

### 2. `spr_cultist` (Cultist Acolyte)
* `Humanoid` · `Pro` or `Standard` · `48px` · `Selective outline` (or `Default Black outline`)
  ```text
  Sinister dark occult cultist acolyte, deep purple tattered hooded robe with gold runic trim along hem, eerie glowing green eyes under dark hood, holding an open cursed grimoire with faint purple sparks, 16-bit gothic pixel art, clean outlines, transparent background
  ```

### 3. `spr_hound` (Hell Hound)
* `Quadruped` (must be quadruped) · `Pro` (8 rotations) · `48px` · `Default Black outline` (or `Selective outline`)
  ```text
  Demonic hellhound beast, muscular quadrupedal predator with exposed bloody sinew, black fur with bone ridge plates on back, glowing red ember eyes, ferocious snarling maw with dripping fangs, 16-bit retro ARPG pixel art, clean silhouette, transparent background
  ```

### 4. `spr_golem` (Flesh Golem)
* `Humanoid` · `Pro` or `Standard` · `64px` (large) · `Selective outline` (or `Default Black outline`)
  ```text
  Massive hulking flesh golem, bulky stitched muscular brute made of patchwork dead flesh, iron staples and neck bolts, single giant glowing red eye in center of forehead, hunched menacing silhouette, 16-bit grimdark ARPG pixel art, transparent background
  ```

### 5. `spr_specter` (Blood Specter)
* `Humanoid` · `Standard` or `Pro` · `48px` · `Selective outline`
  ```text
  Floating ethereal blood specter phantom, translucent spectral apparition draped in swirling crimson mist, shrieking open skull face, vaporous clawed hands, glowing red ghostly core, 16-bit dark fantasy pixel art, transparent background
  ```

### 6. `spr_boss` (Necro Lord, sovereign boss)
* `Humanoid` · `Pro` (8 rotations) · `64px` (maximum) · `Default Black outline` (or `Selective outline`)
  ```text
  Imposing Necro Lord boss, heavy spiked obsidian plate armor with tarnished gold filigree, horned iron skull helmet with fiery red eye slits, wielding a massive dark runic greatsword, tattered black cape, 16-bit 1995 gothic ARPG boss, transparent background
  ```

### 7. `spr_zombie_shambler` (Rotting Zombie)
* `Humanoid` · `Pro` or `Standard` · `48px` · `Selective outline`
  ```text
  Rotting zombie shambler, decayed grey-green skin, exposed bone ribcage, torn peasant brown rags, dragging one foot, outstretched decayed hands, dead milky eyes, 16-bit dark fantasy pixel art, clean outlines, transparent background
  ```

### 8. `spr_vampire_stalker` (Vampire Stalker)
* `Humanoid` · `Pro` (8 rotations) · `48px` · `Selective outline`
  ```text
  Agile vampire assassin stalker, black gothic frock coat with high stiff scarlet collar, pale skin, sharp white fangs, dual wielding curved blood daggers, low combat crouch, 16-bit Castlevania style pixel art, transparent background
  ```

### 9. `spr_werewolf_lycan` (Werewolf)
* `Humanoid` · `Pro` (8 rotations) · `48px` or `64px` · `Selective outline` (or `Default Black outline`)
  ```text
  Ferocious dark brown furred werewolf, muscular digitigrade beast standing on hind legs, razor-sharp claws, snarling open wolf snout dripping saliva, glowing yellow feral eyes, 16-bit retro gothic pixel art, transparent background
  ```

### 10. `spr_bat_swarm` (Vampire Bat)
* `Humanoid` (or `Quadruped`) · `Standard` · `24px` or `32px` · `Highly detailed` (or `Low detail` at 24px) · `Default Black outline`
  ```text
  Giant demonic vampire bat flying, spread dark purple leathery wings, sharp fangs, glowing red eyes, 16-bit retro arcade pixel art, clean pixel cluster, transparent background
  ```

### 11. `spr_gore_abomination` (Flesh and Pustule Abomination)
* `Humanoid` · `Standard` or `Pro` · `64px` (maximum) · `Selective outline`
  ```text
  Grotesque pulsating gore abomination, massive blob of mutated flesh with multiple gnashing bloody mouths, leaking green bile pustules, writhing tentacles, 16-bit Lovecraftian grimdark pixel art, transparent background
  ```
