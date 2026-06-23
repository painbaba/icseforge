const fs = require('fs');
const path = require('path');

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    if (fs.lstatSync(path.join(from, element)).isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    } else {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    }
  });
}

try {
  const buildDir = path.join(__dirname, '../.next');
  const publicDir = path.join(__dirname, '../public');

  // Copy static to standalone/.next/static
  copyFolderSync(path.join(buildDir, 'static'), path.join(buildDir, 'standalone/.next/static'));
  // Copy public to standalone/public
  copyFolderSync(publicDir, path.join(buildDir, 'standalone/public'));

  console.log('Standalone assets copied successfully!');
} catch (err) {
  console.error('Error copying standalone assets:', err);
  process.exit(1);
}
