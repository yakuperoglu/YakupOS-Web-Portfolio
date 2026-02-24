/* ═══════════════════════════════════════════════
   PAINT.EXE — Drawing Application
   ═══════════════════════════════════════════════ */

(function () {
    'use strict';

    const canvas = document.getElementById('paint-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // State
    let painting = false;
    let tool = 'brush'; // brush, eraser, line, rect, circle, fill
    let color = '#7c5cfc';
    let size = 4;
    let lastX = 0, lastY = 0;
    let shapeStartX = 0, shapeStartY = 0;
    let snapshot = null; // For shape preview

    // Initialize canvas white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Undo stack
    const undoStack = [];
    const maxUndo = 20;
    saveState();

    function saveState() {
        if (undoStack.length >= maxUndo) undoStack.shift();
        undoStack.push(canvas.toDataURL());
    }

    function undo() {
        if (undoStack.length <= 1) return;
        undoStack.pop();
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = undoStack[undoStack.length - 1];
    }

    // Get coordinates relative to canvas
    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    function startPaint(e) {
        painting = true;
        const pos = getPos(e);
        lastX = pos.x;
        lastY = pos.y;

        if (tool === 'line' || tool === 'rect' || tool === 'circle') {
            shapeStartX = pos.x;
            shapeStartY = pos.y;
            snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }

        if (tool === 'fill') {
            floodFill(Math.floor(pos.x), Math.floor(pos.y), color);
            saveState();
            painting = false;
        }
    }

    function paint(e) {
        if (!painting) return;
        e.preventDefault();
        const pos = getPos(e);

        if (tool === 'brush' || tool === 'eraser') {
            ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
            ctx.lineWidth = tool === 'eraser' ? size * 3 : size;
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            lastX = pos.x;
            lastY = pos.y;
        } else if (tool === 'line') {
            ctx.putImageData(snapshot, 0, 0);
            ctx.strokeStyle = color;
            ctx.lineWidth = size;
            ctx.beginPath();
            ctx.moveTo(shapeStartX, shapeStartY);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        } else if (tool === 'rect') {
            ctx.putImageData(snapshot, 0, 0);
            ctx.strokeStyle = color;
            ctx.lineWidth = size;
            ctx.strokeRect(shapeStartX, shapeStartY, pos.x - shapeStartX, pos.y - shapeStartY);
        } else if (tool === 'circle') {
            ctx.putImageData(snapshot, 0, 0);
            ctx.strokeStyle = color;
            ctx.lineWidth = size;
            const rx = Math.abs(pos.x - shapeStartX) / 2;
            const ry = Math.abs(pos.y - shapeStartY) / 2;
            const cx = shapeStartX + (pos.x - shapeStartX) / 2;
            const cy = shapeStartY + (pos.y - shapeStartY) / 2;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        updateStatus(pos);
    }

    function stopPaint() {
        if (painting) {
            saveState();
        }
        painting = false;
    }

    // Flood fill
    function floodFill(startX, startY, fillColor) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const w = canvas.width;
        const h = canvas.height;

        // Parse fill color
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.fillStyle = fillColor;
        tempCtx.fillRect(0, 0, 1, 1);
        const fillRGB = tempCtx.getImageData(0, 0, 1, 1).data;

        const idx = (startY * w + startX) * 4;
        const targetR = data[idx], targetG = data[idx + 1], targetB = data[idx + 2];

        if (targetR === fillRGB[0] && targetG === fillRGB[1] && targetB === fillRGB[2]) return;

        const stack = [[startX, startY]];
        const tolerance = 30;

        function matches(i) {
            return Math.abs(data[i] - targetR) <= tolerance &&
                Math.abs(data[i + 1] - targetG) <= tolerance &&
                Math.abs(data[i + 2] - targetB) <= tolerance;
        }

        while (stack.length) {
            const [x, y] = stack.pop();
            const i = (y * w + x) * 4;
            if (x < 0 || x >= w || y < 0 || y >= h) continue;
            if (!matches(i)) continue;

            data[i] = fillRGB[0];
            data[i + 1] = fillRGB[1];
            data[i + 2] = fillRGB[2];
            data[i + 3] = 255;

            stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }

        ctx.putImageData(imageData, 0, 0);
    }

    // Update status bar
    function updateStatus(pos) {
        const statusEl = document.getElementById('paint-status-pos');
        if (statusEl && pos) {
            statusEl.textContent = `${Math.round(pos.x)}, ${Math.round(pos.y)}`;
        }
    }

    // Canvas events
    canvas.addEventListener('mousedown', startPaint);
    canvas.addEventListener('mousemove', paint);
    canvas.addEventListener('mouseup', stopPaint);
    canvas.addEventListener('mouseleave', stopPaint);
    canvas.addEventListener('touchstart', startPaint, { passive: false });
    canvas.addEventListener('touchmove', paint, { passive: false });
    canvas.addEventListener('touchend', stopPaint);

    canvas.addEventListener('mousemove', (e) => updateStatus(getPos(e)));

    // Tool buttons
    document.querySelectorAll('.paint-tool[data-tool]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.paint-tool[data-tool]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            tool = btn.dataset.tool;
            const toolNameEl = document.getElementById('paint-status-tool');
            if (toolNameEl) toolNameEl.textContent = tool.charAt(0).toUpperCase() + tool.slice(1);
        });
    });

    // Color swatches
    document.querySelectorAll('.paint-color-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
            document.querySelectorAll('.paint-color-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            color = swatch.dataset.color;
        });
    });

    // Size slider
    const sizeSlider = document.getElementById('paint-size');
    if (sizeSlider) {
        sizeSlider.addEventListener('input', () => {
            size = parseInt(sizeSlider.value);
        });
    }

    // Undo button
    const undoBtn = document.getElementById('paint-undo');
    if (undoBtn) undoBtn.addEventListener('click', undo);

    // Clear button
    const clearBtn = document.getElementById('paint-clear');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            saveState();
        });
    }

    // Download button
    const downloadBtn = document.getElementById('paint-download');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = 'yakupos-drawing.png';
            link.href = canvas.toDataURL();
            link.click();
        });
    }
})();
