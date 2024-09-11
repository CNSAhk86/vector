const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let angle1 = 0;
let angle2 = 0;
let vectorLength1 = 50;
let vectorLength2 = 50;
const minVectorLength = 50;
const lengthChangeSpeed = 150;
let objectMoving = false;
let objectPos = { x: 80, y: 85 };
let velocity = { x: 0, y: 0 };

const objectRadius = 27;
const bounceFactor = -0.7;
const friction = 0.93;
const maxSpeedMultiplier = 3;

// 상단 그룹 장애물
const upperMazeWalls = [
    { x: 300, y: 350, width: 20, height: 170, visible: false },
    { x: 600, y: 350, width: 20, height: 170, visible: false },
    { x: 900, y: 350, width: 20, height: 170, visible: false },
    { x: 1200, y: 350, width: 20, height: 170, visible: false },
];

// 하단 그룹 장애물
const lowerMazeWalls = [
    { x: 150, y: 530, width: 20, height: 170, visible: true },
    { x: 450, y: 530, width: 20, height: 170, visible: true },
    { x: 750, y: 530, width: 20, height: 170, visible: true },
    { x: 1050, y: 530, width: 20, height: 170, visible: true },
];

// 고정된 미로 장애물
const fixedMazeWalls = [
    { x: 0, y: 170, width: 1360, height: 20, visible: true },
    { x: 200, y: 340, width: 1360, height: 20, visible: true },
    { x: 0, y: 510, width: 1360, height: 20, visible: true },

    { x: 300, y: 90, width: 20, height: 100, visible: true },
    { x: 600, y: -20, width: 20, height: 100, visible: true },
    { x: 900, y: 90, width: 20, height: 100, visible: true },

    { x: 450, y: 170, width: 20, height: 80, visible: true },
    { x: 750, y: 270, width: 20, height: 80, visible: true },
    { x: 1050, y: 170, width: 20, height: 80, visible: true },
];

const goalPos = { x: canvas.width - 1460, y: canvas.height - 80 };
const goalRadius = 35;

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
            handleFailure('미로에 닿았습니다.');
            return;
        }

        if (checkCollisionWithGoal()) {
            handleSuccess('골인 지점에 도착했습니다!');
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
        title: '성공!',
        text: `${message}`,
        icon: 'success',
        confirmButtonText: '재시작'
    }).then(() => {
        resetGame();
    });
}

function handleFailure(message) {
    Swal.fire({
        title: '실패!',
        text: `${message}`,
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
        objectPos.x = 80;
        objectPos.y = 85;
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