const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const baseWidth = 1366;
const baseHeight = 768;
const scaleX = canvas.width / baseWidth;
const scaleY = canvas.height / baseHeight;

let angle1 = 0;
let angle2 = 0;
let vectorLength1 = 50;
let vectorLength2 = 50;
const minVectorLength = 50;
const lengthChangeSpeed = 150;
let objectMoving = false;
let objectPos = { x: 80 * scaleX, y: 85 * scaleY };
let velocity = { x: 0, y: 0 };

const objectRadius = 27 * scaleX; 
const bounceFactor = -0.7;
const friction = 0.93;
const maxSpeedMultiplier = 3;

const upperMazeWalls = [
    { x: 300 * scaleX, y: 400 * scaleY, width: 20 * scaleX, height: 200 * scaleY, visible: false },
    { x: 600 * scaleX, y: 400 * scaleY, width: 20 * scaleX, height: 200 * scaleY, visible: false },
    { x: 900 * scaleX, y: 400 * scaleY, width: 20 * scaleX, height: 200 * scaleY, visible: false },
    { x: 1200 * scaleX, y: 400 * scaleY, width: 20 * scaleX, height: 200 * scaleY, visible: false },
];

const lowerMazeWalls = [
    { x: 150 * scaleX, y: 600 * scaleY, width: 20 * scaleX, height: 170 * scaleY, visible: true },
    { x: 450 * scaleX, y: 600 * scaleY, width: 20 * scaleX, height: 170 * scaleY, visible: true },
    { x: 750 * scaleX, y: 600 * scaleY, width: 20 * scaleX, height: 170 * scaleY, visible: true },
    { x: 1050 * scaleX, y: 600 * scaleY, width: 20 * scaleX, height: 170 * scaleY, visible: true },
];

const fixedMazeWalls = [
    { x: 0, y: 200 * scaleY, width: 1220 * scaleX, height: 20 * scaleY, visible: true },
    { x: 200 * scaleX, y: 400 * scaleY, width: 1360 * scaleX, height: 20 * scaleY, visible: true },
    { x: 0, y: 600 * scaleY, width: 1220 * scaleX, height: 20 * scaleY, visible: true },

    { x: 300 * scaleX, y: 100 * scaleY, width: 20 * scaleX, height: 100 * scaleY, visible: true },
    { x: 600 * scaleX, y: -10 * scaleY, width: 20 * scaleX, height: 100 * scaleY, visible: true },
    { x: 900 * scaleX, y: 100 * scaleY, width: 20 * scaleX, height: 100 * scaleY, visible: true },

    { x: 450 * scaleX, y: 200 * scaleY, width: 20 * scaleX, height: 80 * scaleY, visible: true },
    { x: 750 * scaleX, y: 340 * scaleY, width: 20 * scaleX, height: 80 * scaleY, visible: true },
    { x: 1050 * scaleX, y: 200 * scaleY, width: 20 * scaleX, height: 80 * scaleY, visible: true },
];

const goalPos = { x: canvas.width - 1300 * scaleX, y: canvas.height - 80 * scaleY };
const goalRadius = 27 * scaleX;

let randomizingAngle1 = true;
let randomizingLength1 = false;
let randomizingAngle2 = false;
let randomizingLength2 = false;
let allStepsCompleted = false;

let showingUpperWalls = true;
setInterval(() => {
    if (showingUpperWalls) {
        upperMazeWalls.forEach(wall => wall.visible = true);
        lowerMazeWalls.forEach(wall => wall.visible = false);
    } else {
        upperMazeWalls.forEach(wall => wall.visible = false);
        lowerMazeWalls.forEach(wall => wall.visible = true);
    }
    showingUpperWalls = !showingUpperWalls;
    draw();
}, 1000);

function updateRandomAngles() {
    if (randomizingAngle1) {
        angle1 += 0.02;
        if (angle1 > Math.PI * 2) angle1 -= Math.PI * 2;
    } else if (randomizingAngle2) {
        angle2 += 0.02;
        if (angle2 > Math.PI * 2) angle2 -= Math.PI * 2;
    }
    draw();
    if (!allStepsCompleted) requestAnimationFrame(updateRandomAngles);
}

function updateRandomLengths() {
    if (randomizingLength1) {
        vectorLength1 = minVectorLength + Math.abs(Math.sin(Date.now() * 0.002)) * lengthChangeSpeed;
    } else if (randomizingLength2) {
        vectorLength2 = minVectorLength + Math.abs(Math.sin(Date.now() * 0.002)) * lengthChangeSpeed;
    }
    draw();
    if (!allStepsCompleted) requestAnimationFrame(updateRandomLengths);
}

canvas.addEventListener('mousedown', () => {
    if (randomizingAngle1) {
        randomizingAngle1 = false;
        randomizingLength1 = true;
        requestAnimationFrame(updateRandomLengths);
    } else if (randomizingLength1) {
        randomizingLength1 = false;
        randomizingAngle2 = true;
        requestAnimationFrame(updateRandomAngles);
    } else if (randomizingAngle2) {
        randomizingAngle2 = false;
        randomizingLength2 = true;
        requestAnimationFrame(updateRandomLengths);
    } else if (randomizingLength2) {
        randomizingLength2 = false;
        allStepsCompleted = true;
        calculateAndMoveObject();
    }
});

function calculateAndMoveObject() {
    const resultForce = calculateResultantForce();
    const speedMultiplier = Math.min(resultForce.magnitude / 100, maxSpeedMultiplier);
    velocity.x = resultForce.magnitude * Math.cos(resultForce.angle) / 25 * speedMultiplier;
    velocity.y = resultForce.magnitude * Math.sin(resultForce.angle) / 25 * speedMultiplier;
    objectMoving = true;
    moveObject();
}

function moveObject() {
    if (objectMoving) {
        objectPos.x += velocity.x;
        objectPos.y += velocity.y;

        if (objectPos.x - objectRadius < 0 || objectPos.x + objectRadius > canvas.width) {
            velocity.x *= bounceFactor;
            objectPos.x = objectPos.x - objectRadius < 0 ? objectRadius : canvas.width - objectRadius;
        }
        if (objectPos.y - objectRadius < 0 || objectPos.y + objectRadius > canvas.height) {
            velocity.y *= bounceFactor;
            objectPos.y = objectPos.y - objectRadius < 0 ? objectRadius : canvas.height - objectRadius;
        }

        if (checkCollisionWithMaze()) {
            handleFailure();
            return;
        }

        if (checkCollisionWithGoal()) {
            handleSuccess('진짜 어떻게 하신거죠..? ㄷㄷ');
            return;
        }

        velocity.x *= friction;
        velocity.y *= friction;

        if (Math.abs(velocity.x) < 0.1 && Math.abs(velocity.y) < 0.1) {
            objectMoving = false;
            resetObjectPosition(false);
        }

        draw();
        requestAnimationFrame(moveObject);
    }
}

function checkCollisionWithMaze() {
    const allMazeWalls = [...upperMazeWalls, ...lowerMazeWalls, ...fixedMazeWalls];
    return allMazeWalls.some(wall => {
        return wall.visible &&
               objectPos.x + objectRadius > wall.x &&
               objectPos.x - objectRadius < wall.x + wall.width &&
               objectPos.y + objectRadius > wall.y &&
               objectPos.y - objectRadius < wall.y + wall.height;
    });
}

function checkCollisionWithGoal() {
    const distance = Math.hypot(objectPos.x - goalPos.x, objectPos.y - goalPos.y);
    return distance < goalRadius + objectRadius;
}

function handleSuccess(message) {
    Swal.fire({
        title: '탈출 성공!',
        text: `${message}`,
        icon: 'success',
        confirmButtonText: '재시작'
    }).then(() => {
        resetGame();
    });
}

function handleFailure() {
    const failureMessages = [
        '아 이걸 죽으시네요 ㅋㅋㅋ',
        '와... 이걸 못 피하시네...',
        '역시 쉽지 않죠? 😏',
        '태초마을로 가는 티켓입니다!',
        '이게 진짜 실화인가요? 😅',
    ];

    const failureDetails = [
        '조금만 더 노력하세요! 될진 모르겠지만 ㅋㅋ',
        '이렇게 끝내긴 아쉽죠? 다시 도전!',
        '이세계에서 탈출 실패... 😢',
        '엌ㅋㅋ 태초마을 ㅋㅋㅋㅋ',
        '한 번 더 가보시죠!',
    ];

    const randomMessage = failureMessages[Math.floor(Math.random() * failureMessages.length)];
    const randomDetail = failureDetails[Math.floor(Math.random() * failureDetails.length)];

    Swal.fire({
        title: randomMessage,
        text: `${randomDetail}`,
        icon: 'error',
        confirmButtonText: '다시 시도'
    }).then(() => {
        resetObjectPosition();
    });
}


function resetGame() {
    resetObjectPosition();
}

function calculateResultantForce() {
    const forceX = Math.cos(angle1) * vectorLength1 + Math.cos(angle2) * vectorLength2;
    const forceY = Math.sin(angle1) * vectorLength1 + Math.sin(angle2) * vectorLength2;
    const magnitude = Math.sqrt(forceX * forceX + forceY * forceY);
    const angle = Math.atan2(forceY, forceX);
    return { magnitude, angle };
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMaze();
    drawGoal();
    drawArrow(angle1, vectorLength1, '#0000ff', 7, randomizingAngle1 || randomizingLength1);
    drawArrow(angle2, vectorLength2, '#ff0000', 7, randomizingAngle2 || randomizingLength2);

    if (allStepsCompleted) {
        const resultForce = calculateResultantForce();
        drawArrow(resultForce.angle, resultForce.magnitude, '#00ff00', 10, false);
    }
    ctx.beginPath();
    ctx.arc(objectPos.x, objectPos.y, objectRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();
}

function drawMaze() {
    ctx.fillStyle = 'gray';
    [...upperMazeWalls, ...lowerMazeWalls, ...fixedMazeWalls].forEach(wall => {
        if (wall.visible) {
            ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        }
    });
}

function drawGoal() {
    ctx.beginPath();
    ctx.arc(goalPos.x, goalPos.y, goalRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'green';
    ctx.fill();
}

function drawArrow(angle, length, color, thickness = 5, isActive) {
    const vx = length * Math.cos(angle);
    const vy = length * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(objectPos.x, objectPos.y);
    ctx.lineTo(objectPos.x + vx, objectPos.y + vy);
    ctx.strokeStyle = isActive ? color : `${color}66`;
    ctx.lineWidth = thickness;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(objectPos.x + vx, objectPos.y + vy, 10, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
}

function resetObjectPosition(resetToStart = true) {
    if (resetToStart) {
        objectPos.x = 80 * scaleX;
        objectPos.y = 85 * scaleY;
    }
    velocity.x = 0;
    velocity.y = 0;
    vectorLength1 = minVectorLength;
    vectorLength2 = minVectorLength;
    allStepsCompleted = false;
    randomizingAngle1 = true;
    draw();
    requestAnimationFrame(updateRandomAngles);
}

draw();
requestAnimationFrame(updateRandomAngles);
