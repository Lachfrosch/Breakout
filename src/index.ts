import Phaser from 'phaser';
import config from './config';
import Breakout from './scenes/Breakout';

new Phaser.Game(
  Object.assign(config, {
    scene: [Breakout],
      physics: {
          default: 'arcade'
      }
  })
);
