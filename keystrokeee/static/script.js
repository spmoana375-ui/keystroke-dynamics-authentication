let keyPressTimes = {};
let currentKeyData = [];
let suspiciousCount = 0;

const inputBox = document.getElementById("typingBox");
const canvas = document.getElementById("timingChart");
const ctx = canvas.getContext("2d");

// Capture key press time
inputBox.addEventListener("keydown", function (event) {
    keyPressTimes[event.key] = Date.now();
});

// Capture key release and calculate hold time
inputBox.addEventListener("keyup", function (event) {
    let releaseTime = Date.now();
    let pressTime = keyPressTimes[event.key];

    if (pressTime) {
        let holdTime = releaseTime - pressTime;
        currentKeyData.push(holdTime);
    }
});

// Register typing pattern
async function registerPattern() {
    let username = document.getElementById("username").value.trim();

    if (!username) {
        showOutput("⚠️ Please enter username first");
        return;
    }

    if (currentKeyData.length === 0) {
        showOutput("⚠️ Please type the phrase first");
        return;
    }

    let response = await fetch("/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            pattern: currentKeyData
        })
    });

    let result = await response.json();

    showOutput("✅ " + result.message);

    drawChart(currentKeyData, currentKeyData);

    resetInput();
}

// Verify login
async function verifyPattern() {
    let username = document.getElementById("username").value.trim();

    if (!username) {
        showOutput("⚠️ Please enter username");
        return;
    }

    if (currentKeyData.length === 0) {
        showOutput("⚠️ Please type the phrase before login");
        return;
    }

    let response = await fetch(`/get_user/${username}`);
    let data = await response.json();

    if (data.error) {
        showOutput("❌ User not found");
        return;
    }

    let storedPattern = data.pattern;

    if (!storedPattern || storedPattern.length === 0) {
        showOutput("❌ No registered pattern found");
        return;
    }

    let compareLength = Math.min(
        storedPattern.length,
        currentKeyData.length
    );

    let totalDifference = 0;
    let totalTime = 0;

    for (let i = 0; i < compareLength; i++) {
        totalDifference += Math.abs(
            storedPattern[i] - currentKeyData[i]
        );

        totalTime += currentKeyData[i];
    }

    let avgDiff = totalDifference / compareLength;
    let avgSpeed = totalTime / compareLength;

    let message = "";
    let riskLevel = "";

    if (avgDiff < 20) {
        message = "✅ Login Successful";
        riskLevel = "🟢 Low Risk";
    } else if (avgDiff < 40) {
        message = "⚠️ Login Allowed";
        riskLevel = "🟡 Medium Risk";
    } else {
        suspiciousCount++;
        message = "❌ Suspicious Login";
        riskLevel = "🔴 High Risk";
    }

    // Store login attempt log
    await fetch("/log_attempt", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            status: message,
            risk: riskLevel
        })
    });

    let outputMessage = message;
    outputMessage += "<br><br>";
    outputMessage += "📊 Avg Hold Time: " + avgSpeed.toFixed(2) + " ms";
    outputMessage += "<br>";
    outputMessage += "📉 Avg Difference: " + avgDiff.toFixed(2) + " ms";
    outputMessage += "<br>";
    outputMessage += "🚨 Suspicious Attempts: " + suspiciousCount;
    outputMessage += "<br>";
    outputMessage += "🔐 Risk Level: " + riskLevel;

    showOutput(outputMessage);

    drawChart(storedPattern, currentKeyData);

    resetInput();
}

// Professional aligned chart
function drawChart(registered, current) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const chartTop = 80;
    const chartBottom = 270;
    const chartHeight = chartBottom - chartTop;
    const barWidth = 14;
    const gap = 12;
    const startX = 30;

    // Title
    ctx.font = "bold 16px Consolas";
    ctx.fillStyle = "#22d3ee";
    ctx.fillText("Keystroke Timing Comparison", 80, 25);

    // Legend
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(30, 45, 15, 15);

    ctx.fillStyle = "white";
    ctx.font = "12px Consolas";
    ctx.fillText("Registered", 50, 57);

    ctx.fillStyle = "#10b981";
    ctx.fillRect(180, 45, 15, 15);

    ctx.fillStyle = "white";
    ctx.fillText("Current Attempt", 200, 57);

    // Axis line
    ctx.beginPath();
    ctx.moveTo(20, chartBottom);
    ctx.lineTo(580, chartBottom);
    ctx.strokeStyle = "#94a3b8";
    ctx.stroke();

    let compareLength = Math.min(
        registered.length,
        current.length
    );

    for (let i = 0; i < compareLength; i++) {
        let x = startX + i * (barWidth * 2 + gap);

        let regHeight = Math.min(registered[i], chartHeight);
        let curHeight = Math.min(current[i], chartHeight);

        // Registered bar
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(
            x,
            chartBottom - regHeight,
            barWidth,
            regHeight
        );

        // Current bar
        ctx.fillStyle = "#10b981";
        ctx.fillRect(
            x + barWidth + 2,
            chartBottom - curHeight,
            barWidth,
            curHeight
        );

        // Key label
        ctx.fillStyle = "white";
        ctx.font = "10px Consolas";
        ctx.fillText(i + 1, x + 6, chartBottom + 15);
    }

    // Axis label
    ctx.font = "12px Consolas";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("Key Position", 240, 300);
}

// Output helper
function showOutput(message) {
    document.getElementById("output").innerHTML = message;
}

// Reset typing data
function resetInput() {
    currentKeyData = [];
    inputBox.value = "";
}