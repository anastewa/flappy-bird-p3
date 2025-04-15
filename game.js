import { Pipe } from "./pipe.js";
import { loadImage } from "./utils.js";
import { Bird } from "./birds.js";
import { checkCollision } from "./collission.js";

export class Game {
    SPEED = 3; // элементы будут двигаться на 3 пикселя за кадр
    DISTANCE_BETWEEN_PIPES = 450 // каждые 450 пикселей будет появляться новая труба
    frameCount = 0; // счетчик кадров
    score = 0; // счетчик очков
    gameOver = false; // флаг окончания игры

    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");

        // определяем высоту и ширину холста под экран
        const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        const width = window.visualViewport ? Math.min(window.visualViewport.width, height * 0.6) : Math.min(window.innerWidth, height * 0.6);
        this.canvas.height = 900;
        this.canvas.width = 900 * width / height;

        this.BG_IMG = new Image(); // фон
        this.pipes = [new Pipe(this.canvas)]; // создаём массив с одной трубой
        this.bird = new Bird(this.canvas); // создаём птичку
    }

    async loadAssets() {
        this.BG_IMG = new Image();
        this.BG_IMG.src = "./assets/bg.png"; // путь к изображению фона
        console.log('Загружаю фон...');
        
        await Bird.preloadImage(); // загружаем картинку птички

        // загружаем фон и возвращаем promise
        return new Promise((resolve, reject) => {
            this.BG_IMG.onload = () => {
                console.log('Фон загружен');
                resolve();
            };
            this.BG_IMG.onerror = (err) => {
                console.log('Ошибка загрузки фона', err);
                reject("Не удалось загрузить фон");
            };
        });
    }

    start() {
        // обрабатываем нажатия клавиш
        window.addEventListener("keydown", (e) => {
            if (e.code === "Space") {
                this.bird.flap(); // птичка прыгает
            } else if (e.code === "KeyR" && this.gameOver) {
                this.restart(); // если игра окончена и нажата R — перезапускаем
            }
        });

        // запускаем цикл отрисовки игры
        this.intervalId = setInterval(() => this.draw(), 10);
    }

    stop() {
        clearInterval(this.intervalId); // останавливаем интервал

        this.gameOver = true; // ставим флаг окончания игры

        // рисуем затемнённый экран и сообщение о конце игры
        this.ctx.fillStyle = "rgba(198, 213, 33, 0.5)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "white";
        this.ctx.font = "20px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText("Game Over. Нажми R чтобы начать заново", this.canvas.width / 2, this.canvas.height / 2);
    }

    restart() {
        this.gameOver = false; // сбрасываем флаг окончания
        this.frameCount = 0; // обнуляем кадры
        this.score = 0; // обнуляем очки
        this.pipes = [new Pipe(this.canvas)]; // создаём новую трубу
        this.bird = new Bird(this.canvas); // создаём новую птичку

        // запускаем игру заново
        this.intervalId = setInterval(() => this.draw(), 10);
    }

    draw() {
        // рисуем фон
        this.ctx.drawImage(this.BG_IMG, 0, 0, this.canvas.width, this.canvas.height);

        // если прошёл нужный интервал — добавляем новую трубу
        if (this.frameCount * this.SPEED > this.DISTANCE_BETWEEN_PIPES) {
            this.pipes.push(new Pipe(this.canvas));
            this.frameCount = 0;
        }

        this.updatePipes(); // двигаем и обновляем трубы
        this.bird.update(); // двигаем птичку

        // проверяем столкновение птички с трубами
        if (checkCollision(this.bird, this.pipes)) this.stop();

        // если труба пройдена — увеличиваем счёт
        this.pipes.forEach(pipe => {
            if (pipe.x + pipe.width < this.bird.x && !pipe.passed) {
                this.score++;
                pipe.passed = true;
            }
        });

        // рисуем счёт
        this.ctx.fillStyle = "yellow";
        this.ctx.font = "50px Arial";
        this.ctx.fillText("Score: " + this.score, 20, 40);

        this.frameCount++; // увеличиваем счётчик кадров
    }

    updatePipes() {
        // обновляем положение всех труб
        for (let i = 0; i < this.pipes.length; i++) {
            this.pipes[i].update(this.SPEED);
        }

        // удаляем трубы, которые вышли за экран
        this.pipes = this.pipes.filter(pipe => pipe.x + pipe.width > 0);
    }
}
