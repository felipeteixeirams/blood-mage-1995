const fs = require('fs');

let content = fs.readFileSync('src/main.tsx', 'utf8');

const patch = `
// Monkey-patch AudioContext to prevent unhandled promise rejections from Phaser
if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const originalResume = AudioCtx.prototype.resume;
  AudioCtx.prototype.resume = function() {
    const promise = originalResume.call(this);
    if (promise && promise.catch) {
      return promise.catch((e: any) => {
        // Ignore unhandled DOMExceptions from AudioContext.resume()
      });
    }
    return promise;
  };
}
`;

if (!content.includes('AudioCtx.prototype.resume')) {
  content = content.replace(/import App from '\.\/App';/g, 'import App from \'./App\';\n' + patch);
  fs.writeFileSync('src/main.tsx', content);
}
