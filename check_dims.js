import { fileURLToPath } from 'url';
import fs from 'fs';
import { sizeOf } from 'image-size';

// Quick check using standard Buffer loading to get dimensions
const imgBuffer = fs.readFileSync('public/assets/sprites/player/bloodmage.png');
// We need to use image-size but maybe we don't have it installed
