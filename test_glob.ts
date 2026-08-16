const files = import.meta.glob('/public/assets/**/*.{png,webp,jpg,jpeg,ogg,mp3,wav}', { as: 'url', eager: true });
console.log(files);
