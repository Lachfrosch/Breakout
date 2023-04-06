import Phaser from 'phaser';


export default class Demo extends Phaser.Scene {
    private ball!: Phaser.Physics.Arcade.Image & { body: Phaser.Physics.Arcade.Body };
    private paddle!: Phaser.Physics.Arcade.Sprite & { body: Phaser.Physics.Arcade.Body };
    private bricks!: Phaser.Physics.Arcade.StaticGroup;
    private text!: Phaser.GameObjects.Text;
    private combo: number = 0;
    private sfxHitBrick!: Phaser.Sound.BaseSound;
    private sfxHitBounds!: Phaser.Sound.BaseSound;
    private sfxHitPaddle!: Phaser.Sound.BaseSound;
    private sfxLostLife!: Phaser.Sound.BaseSound;
    private sfxGameOver!: Phaser.Sound.BaseSound;

    constructor() {
        super('Breakout');
    }

    preload() {
        //Load all Assets in Preload
        this.load.image('logo', 'assets/phaser3-logo.png');
        this.load.atlas('assets', 'assets/breakout.png', 'assets/breakout.json');
        this.load.spritesheet('paddle', 'assets/paddle.png', {frameWidth: 104, frameHeight: 24});
        this.load.audio('sfxHitBrick', ['assets/HitBrick.mp3']);
        this.load.audio('sfxHitBounds', ['assets/HitBounds.mp3']);
        this.load.audio('sfxHitPaddle', ['assets/HitPaddle.mp3']);
        this.load.audio('sfxLostLife', ['assets/LostLife.mp3']);
        this.load.audio('sfxGameOver', ['assets/GameOver.mp3']);
    }

    create() {
        //Using the Scene Data Plugin we can store data on a Scene level
        this.data.set('lives', 3);
        this.data.set('level', 1);
        this.data.set('score', 0);

        //Set the Location and Size of Text
        this.text = this.add.text(50, 750, '', {font: '16px Courier', color: '#00ff00'});

        //Set the Sounds to play when the ball hits a Brick / Bounds / Paddle / Player lost Life / Game is Over
        this.sfxHitBrick = this.sound.add('sfxHitBrick');
        this.sfxHitBounds = this.sound.add('sfxHitBounds');
        this.sfxHitPaddle = this.sound.add('sfxHitPaddle');
        this.sfxLostLife = this.sound.add('sfxLostLife');
        this.sfxGameOver = this.sound.add('sfxGameOver');

        //Enable world bounds, but disable the floor so ball bounces back
        this.physics.world.setBoundsCollision(true, true, true, false);

        let canvasWidth = this.sys.canvas.width;

        let rowCount: number = 10;
        let colCount: number = 10;
        //Create the bricks in a grid
        this.bricks = this.physics.add.staticGroup({
            key: 'assets',
            //frame: ['brown.png', 'grey.png', 'purple.png', 'blue.png', 'light_blue.png', 'dark_green.png', 'green.png', 'yellow.png', 'orange.png', "red.png"],
            frame: getFrames(rowCount),
            frameQuantity: colCount,
            gridAlign: {
                width: colCount,
                height: rowCount,
                cellWidth: 64,
                cellHeight: 32,
                x: ((canvasWidth - (colCount * 64)) / 2) + 32,
                y: 50
            }
        });

        //Create the paddle
        this.paddle = this.physics.add.sprite(canvasWidth / 2, 700, 'assets', 'paddle.png').setImmovable();

        //Create the ball
        this.ball = this.physics.add.image(canvasWidth / 2, this.paddle.y - 50, 'assets', 'knuddel.png').setCollideWorldBounds(true).setBounce(1);
        this.ball.setData('onPaddle', true);

        //Create the Animation for the paddle
        this.anims.create({
            key: 'default',
            frames: this.anims.generateFrameNumbers('paddle', {start: 0, end: 2}),
            frameRate: 10,
            repeat: -1
        });

        //Make paddle use that Animation
        this.paddle.anims.play('default', true);

        //Create colliders
        this.physics.add.collider(this.ball, this.bricks, hitBrick, undefined, this);
        this.physics.add.collider(this.ball, this.paddle, hitPaddle, undefined, this);

        //Input events
        this.input.on('pointermove', function (this: Demo, pointer: any) {
            //Keep the paddle within the game
            this.paddle.x = Phaser.Math.Clamp(pointer.x, this.paddle.width / 2, canvasWidth - (this.paddle.width / 2));

            if (this.ball.getData('onPaddle')) {
                this.ball.x = this.paddle.x;
            }
        }, this);

        //Start the Ball on Mouseclick
        this.input.on('pointerup', function (this: Demo) {
            if (this.ball.getData('onPaddle')) {
                let leftOrRight = Math.random() < 0.5 ? -1 : 1; //Randomly decide to Initially go left or right
                this.ball.setVelocity(Math.random() * leftOrRight * 100, -300); // Randomly decide the Angle
                this.ball.setData('onPaddle', false);
            }
        }, this);

        function getFrames(rowCount: number): string[] {
            //This function will generate the Frames for the Rainbow-effect!
            let result: string[] = new Array(0);
            while (rowCount > result.length) {
                switch (result.length % 10) {
                    case 0:
                        result.push('brown.png');
                        break;
                    case 1:
                        result.push('grey.png');
                        break;
                    case 2:
                        result.push('purple.png');
                        break;
                    case 3:
                        result.push('blue.png');
                        break;
                    case 4:
                        result.push('light_blue.png');
                        break;
                    case 5:
                        result.push('dark_green.png');
                        break;
                    case 6:
                        result.push('green.png');
                        break;
                    case 7:
                        result.push('yellow.png');
                        break;
                    case 8:
                        result.push('orange.png');
                        break;
                    case 9:
                        result.push('red.png');
                        break;
                }
            }
            return result;
        }

        function hitBrick(this: Demo, ball: any, brick: any): ArcadePhysicsCallback | undefined {
            this.sfxHitBrick.play();
            brick.disableBody(true, true); //Hide the hit brick
            let score = this.data.get('score');
            this.data.set('score', score + Math.round(100 * (1 + (this.combo / 10)))); //Give 10% Bonus per brick in a row
            this.combo++;

            //Check if bricks are remaining
            if (this.bricks.countActive() === 0) {
                //Reset if all bricks are cleared
                this.resetLevel();
            }
            return undefined;
        }

        function hitPaddle(this: Demo, ball: any, paddle: any): void {
            this.sfxHitPaddle.play();
            //Reset Combo
            this.combo = 0;

            let diff = 0;
            if (ball.x < paddle.x) {
                // Ball is on the left-hand side of the paddle
                diff = paddle.x - ball.x;
                ball.setVelocityX(-10 * diff);
            } else if (ball.x > paddle.x) {
                // Ball is on the right-hand side of the paddle
                diff = ball.x - paddle.x;
                ball.setVelocityX(10 * diff);
            } else {
                //Ball is perfectly in the middle
                //Add a little random X to stop it bouncing straight up!
                let leftOrRight = Math.random() < 0.5 ? -1 : 1; //Randomly decide to go left or right
                ball.setVelocity(Math.random() * leftOrRight * 10, -300); // Randomly decide the Angle (less sharp than at the initial game start)
            }
        }
    }

    resetLevel(): void {
        this.resetBall();
        this.bricks.children.each(function (brick) {
            //Show all Bricks again
            (brick as Phaser.Physics.Arcade.Sprite).enableBody(false, 0, 0, true, true);
        });
    }

    resetBall(): void {
        this.ball.setVelocity(0);
        this.ball.setPosition(this.paddle.x, this.paddle.y - 50);
        this.ball.setData('onPaddle', true);
    }

    update(): void {
        this.text.setText([
            'Level: ' + this.data.get('level'),
            'Lives: ' + this.data.get('lives'),
            'Score: ' + this.data.get('score')
        ]);
        if (this.ball.body.onCeiling() || this.ball.body.onWall()) {
            this.sfxHitBounds.play();
        }

        if (this.ball.y > this.paddle.y) {
            //If ball is under paddle
            let lives: number = this.data.get('lives')

            if (lives > 0) {
                this.sfxLostLife.play();
                this.data.set('lives', lives - 1)
                this.resetBall();
            } else {
                this.sfxGameOver.play();
                this.data.set('lives', 3);
                this.data.set('score', 0);
                this.resetLevel()
            }
        }
    }
}
