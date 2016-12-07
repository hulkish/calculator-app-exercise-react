process.env.NODE_ENV = 'production';

require('dotenv').config({silent: true});

import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import pathExists from 'path-exists';
import filesize from 'filesize';
import { sync as gzipSize } from 'gzip-size';
import webpack from 'webpack';
import config from '../config/webpack.config.prod';
import paths from '../config/paths';
import checkRequiredFiles from 'react-dev-utils/checkRequiredFiles';
import recursive from 'recursive-readdir';
import stripAnsi from 'strip-ansi';

const useYarn = pathExists.sync(paths.yarnLockFile);

if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
  process.exit(1);
}

function removeFileNameHash(fileName) {
  return fileName
    .replace(paths.appBuild, '')
    .replace(/\/?(.*)(\.\w+)(\.js|\.css)/, (match, p1, p2, p3) => p1 + p3);
}

function getDifferenceLabel(currentSize, previousSize) {
  const FIFTY_KILOBYTES = 1024 * 50;
  const difference = currentSize - previousSize;
  const fileSize = !Number.isNaN(difference) ? filesize(difference) : 0;
  if (difference >= FIFTY_KILOBYTES) {
    return chalk.red('+' + fileSize);
  } else if (difference < FIFTY_KILOBYTES && difference > 0) {
    return chalk.yellow('+' + fileSize);
  } else if (difference < 0) {
    return chalk.green(fileSize);
  } else {
    return '';
  }
}

recursive(paths.appBuild, (err, fileNames) => {
  const previousSizeMap = (fileNames || [])
    .filter(fileName => /\.(js|css)$/.test(fileName))
    .reduce((memo, fileName) => {
      const contents = fs.readFileSync(fileName);
      const key = removeFileNameHash(fileName);
      memo[key] = gzipSize(contents);
      return memo;
    }, {});

  fs.emptyDirSync(paths.appBuild);

  build(previousSizeMap);

  copyPublicFolder();
});

function printFileSizes(stats, previousSizeMap) {
  const assets = stats.toJson().assets
    .filter(asset => /\.(js|css)$/.test(asset.name))
    .map(asset => {
      const fileContents = fs.readFileSync(paths.appBuild + '/' + asset.name);
      const size = gzipSize(fileContents);
      const previousSize = previousSizeMap[removeFileNameHash(asset.name)];
      const difference = getDifferenceLabel(size, previousSize);
      return {
        folder: path.join('build', path.dirname(asset.name)),
        name: path.basename(asset.name),
        size,
        sizeLabel: filesize(size) + (difference ? ' (' + difference + ')' : '')
      };
    });
  assets.sort((a, b) => b.size - a.size);
  const longestSizeLabelLength = Math.max.apply(null,
    assets.map(a => stripAnsi(a.sizeLabel).length)
  );
  assets.forEach(asset => {
    let sizeLabel = asset.sizeLabel;
    const sizeLength = stripAnsi(sizeLabel).length;
    if (sizeLength < longestSizeLabelLength) {
      const rightPadding = ' '.repeat(longestSizeLabelLength - sizeLength);
      sizeLabel += rightPadding;
    }
    console.log(
      '  ' + sizeLabel +
      '  ' + chalk.dim(asset.folder + path.sep) + chalk.cyan(asset.name)
    );
  });
}

function printErrors(summary, errors) {
  console.log(chalk.red(summary));
  console.log();
  errors.forEach(err => {
    console.log(err.message || err);
    console.log();
  });
}

function build(previousSizeMap) {
  console.log('Creating an optimized production build...');
  webpack(config).run((err, stats) => {
    if (err) {
      printErrors('Failed to compile.', [err]);
      process.exit(1);
    }

    if (stats.compilation.errors.length) {
      printErrors('Failed to compile.', stats.compilation.errors);
      process.exit(1);
    }

    if (process.env.CI && stats.compilation.warnings.length) {
     printErrors('Failed to compile.', stats.compilation.warnings);
     process.exit(1);
   }

    console.log(chalk.green('Compiled successfully.'));
    console.log();

    console.log('File sizes after gzip:');
    console.log();
    printFileSizes(stats, previousSizeMap);
    console.log();

    const openCommand = process.platform === 'win32' ? 'start' : 'open';
    const homepagePath = require(paths.appPackageJson).homepage;
    const publicPath = config.output.publicPath;
    if (homepagePath && homepagePath.indexOf('.github.io/') !== -1) {
      console.log('The project was built assuming it is hosted at ' + chalk.green(publicPath) + '.');
      console.log('You can control this with the ' + chalk.green('homepage') + ' field in your '  + chalk.cyan('package.json') + '.');
      console.log();
      console.log('The ' + chalk.cyan('build') + ' folder is ready to be deployed.');
      console.log('To publish it at ' + chalk.green(homepagePath) + ', run:');
      console.log();
      if (useYarn) {
        console.log('  ' + chalk.cyan('yarn') +  ' add --dev gh-pages');
      } else {
        console.log('  ' + chalk.cyan('npm') +  ' install --save-dev gh-pages');
      }
      console.log();
      console.log('Add the following script in your ' + chalk.cyan('package.json') + '.');
      console.log();
      console.log('    ' + chalk.yellow('"scripts"') + ': {');
      console.log('      ' + chalk.yellow('"deploy"') + ': ' + chalk.yellow('"npm run build&&gh-pages -d build"'));
      console.log('    }');
      console.log();
      console.log('Then run:');
      console.log();
      console.log('  ' + chalk.cyan(useYarn ? 'yarn' : 'npm') +  ' run deploy');
      console.log();
    } else if (publicPath !== '/') {
      console.log('The project was built assuming it is hosted at ' + chalk.green(publicPath) + '.');
      console.log('You can control this with the ' + chalk.green('homepage') + ' field in your '  + chalk.cyan('package.json') + '.');
      console.log();
      console.log('The ' + chalk.cyan('build') + ' folder is ready to be deployed.');
      console.log();
    } else {
      console.log('The project was built assuming it is hosted at the server root.');
      if (homepagePath) {
        console.log('You can control this with the ' + chalk.green('homepage') + ' field in your '  + chalk.cyan('package.json') + '.');
        console.log();
      } else {
        console.log('To override this, specify the ' + chalk.green('homepage') + ' in your '  + chalk.cyan('package.json') + '.');
        console.log('For example, add this to build it for GitHub Pages:')
        console.log();
        console.log();
      }
      console.log('The ' + chalk.cyan('build') + ' folder is ready to be deployed.');
      console.log('You may also serve it locally with a static server:')
      console.log();
      if (useYarn) {
        console.log('  ' + chalk.cyan('yarn') +  ' global add pushstate-server');
      } else {
        console.log('  ' + chalk.cyan('npm') +  ' install -g pushstate-server');
      }
      console.log('  ' + chalk.cyan('pushstate-server') + ' build');
      console.log();
    }
  });
}

function copyPublicFolder() {
  fs.copySync(paths.appPublic, paths.appBuild, {
    dereference: true,
    filter: file => file !== paths.appHtml
  });
}
