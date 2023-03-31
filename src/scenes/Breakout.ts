import Phaser from 'phaser';


export default class Demo extends Phaser.Scene {
    private ball: Phaser.Physics.Arcade.Image & { body: Phaser.Physics.Arcade.Body } | undefined;
    private paddle: Phaser.Physics.Arcade.Sprite & { body: Phaser.Physics.Arcade.Body } | undefined;
    private bricks: Phaser.Physics.Arcade.StaticGroup | undefined;

    constructor() {
        super('Breakout');
    }

    preload() {
        this.load.image('logo', 'assets/phaser3-logo.png');
        this.load.atlas('assets', 'assets/breakout.png', 'assets/breakout.json');
        this.load.spritesheet('paddle', 'assets/paddle.png', {frameWidth: 104, frameHeight: 24});
    }

    create() {
        //  Enable world bounds, but disable the floor
        this.physics.world.setBoundsCollision(true, true, true, false);

        //  Create the bricks in a 10x6 grid
        this.bricks = this.physics.add.staticGroup({
            key: 'assets',
            //frame: ['brown.png', 'grey.png', 'purple.png', 'blue.png', 'light_blue.png', 'dark_green.png', 'green.png', 'yellow.png', 'orange.png', "red.png"],
            frame: ['brown.png'],
            frameQuantity: 10,
            gridAlign: {width: 10, height: 10, cellWidth: 64, cellHeight: 32, x: 112, y: 50}
        });

        this.ball = this.physics.add.image(400, 700, 'assets', 'knuddel.png').setCollideWorldBounds(true).setBounce(1);
        this.ball.setData('onPaddle', true);

        this.paddle = this.physics.add.sprite(400, 750, 'assets', 'paddle.png').setImmovable();

        this.anims.create({
            key: 'default',
            frames: this.anims.generateFrameNumbers('paddle', {start: 0, end: 2}),
            frameRate: 10,
            repeat: -1
        });

        this.paddle.anims.play('default', true);

        //  Our colliders
        this.physics.add.collider(this.ball, this.bricks, hitBrick, undefined, this);
        this.physics.add.collider(this.ball, this.paddle, hitPaddle, undefined, this);

        //  Input events
        this.input.on('pointermove', function (this: Demo, pointer: any) {

            if (this.paddle != undefined) {
                //  Keep the paddle within the game
                this.paddle.x = Phaser.Math.Clamp(pointer.x, 52, 748);

                if (this.ball != undefined) {
                    if (this.ball.getData('onPaddle')) {
                        this.ball.x = this.paddle.x;
                    }
                }
            }


        }, this);

        this.input.on('pointerup', function (this: Demo) {
            if (this.ball != undefined) {
                if (this.ball.getData('onPaddle')) {
                    this.ball.setVelocity(-75, -300);
                    this.ball.setData('onPaddle', false);
                }
            }


        }, this);

        function hitBrick(this: Demo, ball: any, brick: any): ArcadePhysicsCallback | undefined {
            brick.disableBody(true, true);

            if (this.bricks != undefined) {
                if (this.bricks.countActive() === 0 && this.paddle != undefined) {
                    this.resetLevel();
                }
            }

            return undefined;
        }

        function hitPaddle(ball: any, paddle: any): void {
            var diff = 0;

            if (ball.x < paddle.x) {
                //  Ball is on the left-hand side of the paddle
                diff = paddle.x - ball.x;
                ball.setVelocityX(-10 * diff);
            } else if (ball.x > paddle.x) {
                //  Ball is on the right-hand side of the paddle
                diff = ball.x - paddle.x;
                ball.setVelocityX(10 * diff);
            } else {
                //  Ball is perfectly in the middle
                //  Add a little random X to stop it bouncing straight up!
                ball.setVelocityX(2 + Math.random() * 8);
            }
        }
    }

    resetLevel(): void {
        this.resetBall();
        if (this.bricks != undefined) {
            this.bricks.children.each(function (brick) {

                (brick as Phaser.Physics.Arcade.Sprite).enableBody(false, 0, 0, true, true);

            });
        }
    }

    resetBall(): void {
        if (this.ball != undefined && this.paddle != undefined) {
            this.ball.setVelocity(0);
            this.ball.setPosition(this.paddle.x, 700);
            this.ball.setData('onPaddle', true);
        }
    }

    update(): void {
        if (this.ball != undefined) {
            if (this.ball.y > 800) {
                this.resetBall();
            }
        }

    }
}
