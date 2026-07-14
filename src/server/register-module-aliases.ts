/* eslint-disable @typescript-eslint/no-require-imports */
import path from 'path';

const moduleAlias = require('module-alias');

moduleAlias.addAlias('@server', __dirname);
moduleAlias.addAlias('@common', path.join(__dirname, '../common'));
