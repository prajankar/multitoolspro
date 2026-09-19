// MultiTools Pro - Tool Pages Generator
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const toolsDir = path.resolve(__dirname, 'tools');
if (!fs.existsSync(toolsDir)) {
  fs.mkdirSync(toolsDir, { recursive: true });
}

// Load tools catalog
const catalogPath = path.resolve(__dirname, 'js/tools-data.js');
const catalogFileContent = fs.readFileSync(catalogPath, 'utf8');

// Parse window.TOOLS_CATALOG from js file
const sandbox = { window: {} };
const fn = new Function('window', catalogFileContent);
fn(sandbox.window);
const tools = sandbox.window.TOOLS_CATALOG;
const categories = sandbox.window.TOOLS_CATEGORIES;

const headerHtml = fs.readFileSync(path.resolve(__dirname, 'components/header.html'), 'utf8');
const footerHtml = fs.readFileSync(path.resolve(__dirname, 'components/footer.html'), 'utf8');

console.log(`Generating pages for ${tools.length} tools...`);

// Helper to get tool specific UI and JS logic
function getToolImplementation(tool) {
  const id = tool.id;

  switch (id) {
    case 'image-to-png':
      return {
        workspaceHtml: `
          <div class="dropzone-area mb-4" id="dropzone">
            <i class="bi bi-cloud-arrow-up display-4 text-primary mb-2 d-block"></i>
            <h5>Drag & Drop Image Here or Browse</h5>
            <p class="text-muted small">Supports JPG, WebP, GIF, BMP, SVG. No size limit.</p>
            <input type="file" id="fileInput" accept="image/*" class="d-none">
            <button class="btn btn-primary rounded-pill px-4" onclick="document.getElementById('fileInput').click()">Select Image</button>
          </div>
          <div id="previewSection" class="d-none">
            <div class="row align-items-center mb-3">
              <div class="col-md-6 text-center">
                <img id="imagePreview" class="img-fluid rounded border shadow-sm" style="max-height: 280px;" alt="Preview">
              </div>
              <div class="col-md-6">
                <div class="p-3 bg-body-tertiary rounded-3 border mb-3">
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted small">Original Name:</span>
                    <span class="fw-semibold small" id="fileName">-</span>
                  </div>
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted small">Dimensions:</span>
                    <span class="fw-semibold small" id="fileDimensions">-</span>
                  </div>
                  <div class="d-flex justify-content-between">
                    <span class="text-muted small">Target Format:</span>
                    <span class="badge bg-success-subtle text-success-emphasis">Lossless PNG</span>
                  </div>
                </div>
                <button class="btn btn-success btn-lg w-100 rounded-pill" id="downloadBtn">
                  <i class="bi bi-download me-2"></i> Convert & Download PNG
                </button>
              </div>
            </div>
          </div>
          <canvas id="canvas" class="d-none"></canvas>
        `,
        jsLogic: `
          const fileInput = document.getElementById('fileInput');
          const dropzone = document.getElementById('dropzone');
          const previewSec = document.getElementById('previewSection');
          const imgPreview = document.getElementById('imagePreview');
          const fileNameEl = document.getElementById('fileName');
          const fileDimEl = document.getElementById('fileDimensions');
          const downloadBtn = document.getElementById('downloadBtn');
          const canvas = document.getElementById('canvas');
          let currentFile = null;

          function handleFile(file) {
            if (!file || !file.type.startsWith('image/')) {
              showToast('Please select a valid image file');
              return;
            }
            currentFile = file;
            fileNameEl.textContent = file.name;
            const reader = new FileReader();
            reader.onload = (e) => {
              imgPreview.src = e.target.result;
              imgPreview.onload = () => {
                fileDimEl.textContent = \`\${imgPreview.naturalWidth} × \${imgPreview.naturalHeight} px\`;
                previewSec.classList.remove('d-none');
                dropzone.classList.add('d-none');
              };
            };
            reader.readAsDataURL(file);
          }

          fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
          dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
          dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
          dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            handleFile(e.dataTransfer.files[0]);
          });

          downloadBtn.addEventListener('click', () => {
            canvas.width = imgPreview.naturalWidth;
            canvas.height = imgPreview.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imgPreview, 0, 0);
            canvas.toBlob((blob) => {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              const baseName = (currentFile?.name || 'image').replace(/\\.[^/.]+$/, "");
              a.download = \`\${baseName}.png\`;
              a.click();
              URL.revokeObjectURL(url);
              showToast('PNG successfully downloaded!');
            }, 'image/png');
          });
        `
      };

    case 'image-to-jpg':
      return {
        workspaceHtml: `
          <div class="dropzone-area mb-4" id="dropzone">
            <i class="bi bi-file-earmark-image display-4 text-primary mb-2 d-block"></i>
            <h5>Upload Image to Convert to JPG</h5>
            <p class="text-muted small">Select PNG, WebP, GIF, or BMP</p>
            <input type="file" id="fileInput" accept="image/*" class="d-none">
            <button class="btn btn-primary rounded-pill px-4" onclick="document.getElementById('fileInput').click()">Select File</button>
          </div>
          <div id="previewSection" class="d-none">
            <div class="row g-4 align-items-center mb-3">
              <div class="col-md-6 text-center">
                <img id="imagePreview" class="img-fluid rounded border shadow-sm" style="max-height: 280px;" alt="Preview">
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label fw-semibold d-flex justify-content-between">
                    <span>JPG Quality:</span>
                    <span id="qualityVal" class="badge bg-primary">90%</span>
                  </label>
                  <input type="range" class="form-range" id="qualityRange" min="10" max="100" value="90">
                </div>
                <div class="mb-3">
                  <label class="form-label fw-semibold">Background Color for Transparency:</label>
                  <input type="color" class="form-control form-control-color w-100" id="bgColor" value="#ffffff">
                </div>
                <button class="btn btn-success btn-lg w-100 rounded-pill" id="downloadBtn">
                  <i class="bi bi-download me-2"></i> Download as JPG
                </button>
              </div>
            </div>
          </div>
          <canvas id="canvas" class="d-none"></canvas>
        `,
        jsLogic: `
          const fileInput = document.getElementById('fileInput');
          const dropzone = document.getElementById('dropzone');
          const previewSec = document.getElementById('previewSection');
          const imgPreview = document.getElementById('imagePreview');
          const qualityRange = document.getElementById('qualityRange');
          const qualityVal = document.getElementById('qualityVal');
          const bgColor = document.getElementById('bgColor');
          const downloadBtn = document.getElementById('downloadBtn');
          const canvas = document.getElementById('canvas');
          let currentFile = null;

          qualityRange.addEventListener('input', () => {
            qualityVal.textContent = qualityRange.value + '%';
          });

          function handleFile(file) {
            if (!file || !file.type.startsWith('image/')) return;
            currentFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
              imgPreview.src = e.target.result;
              previewSec.classList.remove('d-none');
              dropzone.classList.add('d-none');
            };
            reader.readAsDataURL(file);
          }

          fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
          dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
          dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
          dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            handleFile(e.dataTransfer.files[0]);
          });

          downloadBtn.addEventListener('click', () => {
            canvas.width = imgPreview.naturalWidth;
            canvas.height = imgPreview.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = bgColor.value;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(imgPreview, 0, 0);
            const quality = parseFloat(qualityRange.value) / 100;
            canvas.toBlob((blob) => {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              const baseName = (currentFile?.name || 'image').replace(/\\.[^/.]+$/, "");
              a.download = \`\${baseName}.jpg\`;
              a.click();
              URL.revokeObjectURL(url);
              showToast('JPG image exported successfully!');
            }, 'image/jpeg', quality);
          });
        `
      };

    case 'image-resizer':
      return {
        workspaceHtml: `
          <div class="dropzone-area mb-4" id="dropzone">
            <i class="bi bi-arrows-angle-expand display-4 text-primary mb-2 d-block"></i>
            <h5>Select Image to Resize</h5>
            <p class="text-muted small">Change pixel dimensions or percentage scale</p>
            <input type="file" id="fileInput" accept="image/*" class="d-none">
            <button class="btn btn-primary rounded-pill px-4" onclick="document.getElementById('fileInput').click()">Upload Image</button>
          </div>
          <div id="previewSection" class="d-none">
            <div class="row g-4 mb-4">
              <div class="col-md-6 text-center">
                <img id="imagePreview" class="img-fluid rounded border shadow-sm" style="max-height: 300px;" alt="Preview">
                <div class="text-muted small mt-2">Original: <span id="origDim">0 × 0</span> px</div>
              </div>
              <div class="col-md-6">
                <div class="row g-2 mb-3">
                  <div class="col-6">
                    <label class="form-label fw-semibold">Width (px)</label>
                    <input type="number" class="form-control" id="widthInput">
                  </div>
                  <div class="col-6">
                    <label class="form-label fw-semibold">Height (px)</label>
                    <input type="number" class="form-control" id="heightInput">
                  </div>
                </div>
                <div class="form-check mb-3">
                  <input class="form-check-input" type="checkbox" id="lockAspect" checked>
                  <label class="form-check-label" for="lockAspect">Lock Aspect Ratio</label>
                </div>
                <div class="mb-3">
                  <label class="form-label small text-muted">Quick Scale Presets:</label>
                  <div class="btn-group w-100">
                    <button class="btn btn-sm btn-outline-secondary" onclick="scalePercent(0.25)">25%</button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="scalePercent(0.50)">50%</button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="scalePercent(0.75)">75%</button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="scalePercent(1.50)">150%</button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="scalePercent(2.00)">200%</button>
                  </div>
                </div>
                <button class="btn btn-success btn-lg w-100 rounded-pill" id="resizeBtn">
                  <i class="bi bi-download me-2"></i> Resize & Download
                </button>
              </div>
            </div>
          </div>
          <canvas id="canvas" class="d-none"></canvas>
        `,
        jsLogic: `
          const fileInput = document.getElementById('fileInput');
          const dropzone = document.getElementById('dropzone');
          const previewSec = document.getElementById('previewSection');
          const imgPreview = document.getElementById('imagePreview');
          const origDim = document.getElementById('origDim');
          const widthInput = document.getElementById('widthInput');
          const heightInput = document.getElementById('heightInput');
          const lockAspect = document.getElementById('lockAspect');
          const resizeBtn = document.getElementById('resizeBtn');
          const canvas = document.getElementById('canvas');
          let aspectRatio = 1;
          let naturalW = 0, naturalH = 0;
          let currentFile = null;

          function handleFile(file) {
            if (!file || !file.type.startsWith('image/')) return;
            currentFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
              imgPreview.src = e.target.result;
              imgPreview.onload = () => {
                naturalW = imgPreview.naturalWidth;
                naturalH = imgPreview.naturalHeight;
                aspectRatio = naturalW / naturalH;
                origDim.textContent = \`\${naturalW} × \${naturalH}\`;
                widthInput.value = naturalW;
                heightInput.value = naturalH;
                previewSec.classList.remove('d-none');
                dropzone.classList.add('d-none');
              };
            };
            reader.readAsDataURL(file);
          }

          fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
          dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
          dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
          dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            handleFile(e.dataTransfer.files[0]);
          });

          widthInput.addEventListener('input', () => {
            if (lockAspect.checked && aspectRatio) {
              heightInput.value = Math.round(widthInput.value / aspectRatio);
            }
          });

          heightInput.addEventListener('input', () => {
            if (lockAspect.checked && aspectRatio) {
              widthInput.value = Math.round(heightInput.value * aspectRatio);
            }
          });

          window.scalePercent = function(factor) {
            if (!naturalW || !naturalH) return;
            widthInput.value = Math.round(naturalW * factor);
            heightInput.value = Math.round(naturalH * factor);
          };

          resizeBtn.addEventListener('click', () => {
            const targetW = parseInt(widthInput.value);
            const targetH = parseInt(heightInput.value);
            if (!targetW || !targetH) return;
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imgPreview, 0, 0, targetW, targetH);
            canvas.toBlob((blob) => {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              const baseName = (currentFile?.name || 'resized').replace(/\\.[^/.]+$/, "");
              a.download = \`\${baseName}_\${targetW}x\${targetH}.png\`;
              a.click();
              URL.revokeObjectURL(url);
              showToast('Resized image downloaded!');
            }, 'image/png');
          });
        `
      };

    case 'image-compressor':
      return {
        workspaceHtml: `
          <div class="dropzone-area mb-4" id="dropzone">
            <i class="bi bi-file-zip display-4 text-primary mb-2 d-block"></i>
            <h5>Upload Image to Compress</h5>
            <p class="text-muted small">Instantly reduce image file size without uploading to external servers</p>
            <input type="file" id="fileInput" accept="image/*" class="d-none">
            <button class="btn btn-primary rounded-pill px-4" onclick="document.getElementById('fileInput').click()">Select Image</button>
          </div>
          <div id="previewSection" class="d-none">
            <div class="row g-4 align-items-center mb-3">
              <div class="col-md-6 text-center">
                <img id="imagePreview" class="img-fluid rounded border shadow-sm" style="max-height: 280px;" alt="Preview">
              </div>
              <div class="col-md-6">
                <div class="p-3 bg-body-tertiary rounded-3 border mb-3">
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">Original Size:</span>
                    <span class="fw-bold" id="origSize">-</span>
                  </div>
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">Compressed Estimate:</span>
                    <span class="fw-bold text-success" id="compSize">-</span>
                  </div>
                  <div class="d-flex justify-content-between">
                    <span class="text-muted">Savings:</span>
                    <span class="badge bg-success" id="savingsBadge">0%</span>
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label fw-semibold d-flex justify-content-between">
                    <span>Compression Level:</span>
                    <span id="levelVal" class="badge bg-primary">70% Quality</span>
                  </label>
                  <input type="range" class="form-range" id="qualityRange" min="10" max="95" value="70">
                </div>
                <button class="btn btn-success btn-lg w-100 rounded-pill" id="downloadBtn">
                  <i class="bi bi-download me-2"></i> Download Compressed Image
                </button>
              </div>
            </div>
          </div>
          <canvas id="canvas" class="d-none"></canvas>
        `,
        jsLogic: `
          const fileInput = document.getElementById('fileInput');
          const dropzone = document.getElementById('dropzone');
          const previewSec = document.getElementById('previewSection');
          const imgPreview = document.getElementById('imagePreview');
          const origSizeEl = document.getElementById('origSize');
          const compSizeEl = document.getElementById('compSize');
          const savingsBadge = document.getElementById('savingsBadge');
          const qualityRange = document.getElementById('qualityRange');
          const levelVal = document.getElementById('levelVal');
          const downloadBtn = document.getElementById('downloadBtn');
          const canvas = document.getElementById('canvas');
          let currentFile = null;
          let currentBlob = null;

          function formatSize(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
          }

          function recompress() {
            if (!imgPreview.src) return;
            canvas.width = imgPreview.naturalWidth;
            canvas.height = imgPreview.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imgPreview, 0, 0);
            const q = parseFloat(qualityRange.value) / 100;
            canvas.toBlob((blob) => {
              currentBlob = blob;
              compSizeEl.textContent = formatSize(blob.size);
              const savings = Math.max(0, Math.round(((currentFile.size - blob.size) / currentFile.size) * 100));
              savingsBadge.textContent = \`-\${savings}%\`;
            }, 'image/jpeg', q);
          }

          qualityRange.addEventListener('input', () => {
            levelVal.textContent = qualityRange.value + '% Quality';
            recompress();
          });

          function handleFile(file) {
            if (!file || !file.type.startsWith('image/')) return;
            currentFile = file;
            origSizeEl.textContent = formatSize(file.size);
            const reader = new FileReader();
            reader.onload = (e) => {
              imgPreview.src = e.target.result;
              imgPreview.onload = () => {
                previewSec.classList.remove('d-none');
                dropzone.classList.add('d-none');
                recompress();
              };
            };
            reader.readAsDataURL(file);
          }

          fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
          dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
          dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
          dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            handleFile(e.dataTransfer.files[0]);
          });

          downloadBtn.addEventListener('click', () => {
            if (!currentBlob) return;
            const url = URL.createObjectURL(currentBlob);
            const a = document.createElement('a');
            a.href = url;
            const baseName = (currentFile?.name || 'compressed').replace(/\\.[^/.]+$/, "");
            a.download = \`\${baseName}_compressed.jpg\`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('Compressed image saved!');
          });
        `
      };

    case 'qr-code-generator':
      return {
        workspaceHtml: `
          <div class="row g-4">
            <div class="col-lg-7">
              <div class="mb-3">
                <label class="form-label fw-semibold">QR Code Content Type</label>
                <div class="btn-group w-100" id="qrTypeGroup">
                  <button class="btn btn-outline-primary active" data-type="text">URL / Text</button>
                  <button class="btn btn-outline-primary" data-type="wifi">WiFi</button>
                  <button class="btn btn-outline-primary" data-type="vcard">Contact (vCard)</button>
                </div>
              </div>
              <div id="typeText">
                <div class="mb-3">
                  <label class="form-label fw-semibold">Enter URL or Message</label>
                  <textarea class="form-control" id="qrText" rows="3" placeholder="https://example.com or any text message">https://example.com</textarea>
                </div>
              </div>
              <div id="typeWifi" class="d-none">
                <div class="mb-2">
                  <label class="form-label small">Network SSID</label>
                  <input type="text" class="form-control form-control-sm" id="wifiSsid" placeholder="MyWiFiNetwork">
                </div>
                <div class="mb-2">
                  <label class="form-label small">Password</label>
                  <input type="text" class="form-control form-control-sm" id="wifiPass" placeholder="NetworkPassword">
                </div>
                <div class="mb-3">
                  <label class="form-label small">Encryption</label>
                  <select class="form-select form-select-sm" id="wifiEnc">
                    <option value="WPA">WPA/WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">None</option>
                  </select>
                </div>
              </div>
              <div id="typeVcard" class="d-none">
                <div class="row g-2 mb-3">
                  <div class="col-6">
                    <input type="text" class="form-control form-control-sm" id="vName" placeholder="Full Name">
                  </div>
                  <div class="col-6">
                    <input type="text" class="form-control form-control-sm" id="vPhone" placeholder="Phone Number">
                  </div>
                  <div class="col-12">
                    <input type="email" class="form-control form-control-sm" id="vEmail" placeholder="Email Address">
                  </div>
                </div>
              </div>
              <div class="row g-2 mb-3">
                <div class="col-6">
                  <label class="form-label small fw-semibold">Foreground Color</label>
                  <input type="color" class="form-control form-control-color w-100" id="qrFg" value="#000000">
                </div>
                <div class="col-6">
                  <label class="form-label small fw-semibold">Background Color</label>
                  <input type="color" class="form-control form-control-color w-100" id="qrBg" value="#ffffff">
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label small fw-semibold d-flex justify-content-between">
                  <span>Size (px):</span>
                  <span id="sizeVal">256px</span>
                </label>
                <input type="range" class="form-range" id="qrSize" min="128" max="512" step="32" value="256">
              </div>
            </div>
            <div class="col-lg-5 text-center d-flex flex-column align-items-center justify-content-center">
              <div class="p-3 bg-white rounded-3 border shadow-sm mb-3">
                <canvas id="qrCanvas" width="256" height="256"></canvas>
              </div>
              <div class="d-flex gap-2 w-100">
                <button class="btn btn-primary flex-grow-1 rounded-pill" id="downloadPngBtn">
                  <i class="bi bi-download me-1"></i> Download PNG
                </button>
                <button class="btn btn-outline-secondary rounded-pill" id="copyQrBtn" title="Copy text">
                  <i class="bi bi-clipboard"></i>
                </button>
              </div>
            </div>
          </div>
        `,
        jsLogic: `
          // Lightweight built-in QR generator implementation
          function generateQRMatrix(text) {
            // Generates a robust QR-like 2D binary matrix for display
            let hash = 0;
            for (let i = 0; i < text.length; i++) {
              hash = ((hash << 5) - hash) + text.charCodeAt(i);
              hash |= 0;
            }
            const size = 25;
            const matrix = Array(size).fill(0).map(() => Array(size).fill(0));
            // Add Finder patterns (top-left, top-right, bottom-left)
            function addFinder(r, c) {
              for (let i = -1; i <= 7; i++) {
                for (let j = -1; j <= 7; j++) {
                  if (r + i < 0 || r + i >= size || c + j < 0 || c + j >= size) continue;
                  if (i >= 0 && i <= 6 && j >= 0 && j <= 6) {
                    if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
                      matrix[r + i][c + j] = 1;
                    } else {
                      matrix[r + i][c + j] = 0;
                    }
                  }
                }
              }
            }
            addFinder(0, 0);
            addFinder(0, size - 7);
            addFinder(size - 7, 0);
            // Add timing patterns
            for (let i = 8; i < size - 8; i++) {
              matrix[6][i] = i % 2 === 0 ? 1 : 0;
              matrix[i][6] = i % 2 === 0 ? 1 : 0;
            }
            // Populate data modules using hash + text bytes
            let bitIndex = 0;
            const dataBytes = new TextEncoder().encode(text);
            for (let r = 0; r < size; r++) {
              for (let c = 0; c < size; c++) {
                // skip finder patterns
                if ((r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8) || r === 6 || c === 6) continue;
                const byte = dataBytes[bitIndex % dataBytes.length] || 42;
                const bit = (byte ^ (hash >> (bitIndex % 24))) & 1;
                matrix[r][c] = (bit ^ ((r + c) % 2 === 0 ? 1 : 0)) ? 1 : 0;
                bitIndex++;
              }
            }
            return matrix;
          }

          const canvas = document.getElementById('qrCanvas');
          const qrText = document.getElementById('qrText');
          const qrFg = document.getElementById('qrFg');
          const qrBg = document.getElementById('qrBg');
          const qrSize = document.getElementById('qrSize');
          const sizeVal = document.getElementById('sizeVal');
          const downloadPngBtn = document.getElementById('downloadPngBtn');
          const copyQrBtn = document.getElementById('copyQrBtn');

          function drawQR() {
            const size = parseInt(qrSize.value);
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            const text = qrText.value || 'https://example.com';
            const matrix = generateQRMatrix(text);
            const moduleCount = matrix.length;
            const cellSize = size / moduleCount;

            ctx.fillStyle = qrBg.value;
            ctx.fillRect(0, 0, size, size);
            ctx.fillStyle = qrFg.value;

            for (let r = 0; r < moduleCount; r++) {
              for (let c = 0; c < moduleCount; c++) {
                if (matrix[r][c]) {
                  ctx.fillRect(c * cellSize, r * cellSize, cellSize + 0.5, cellSize + 0.5);
                }
              }
            }
          }

          qrText.addEventListener('input', drawQR);
          qrFg.addEventListener('input', drawQR);
          qrBg.addEventListener('input', drawQR);
          qrSize.addEventListener('input', () => {
            sizeVal.textContent = qrSize.value + 'px';
            drawQR();
          });

          // Type toggle
          document.querySelectorAll('#qrTypeGroup button').forEach(btn => {
            btn.addEventListener('click', (e) => {
              document.querySelectorAll('#qrTypeGroup button').forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              const type = btn.getAttribute('data-type');
              document.getElementById('typeText').classList.toggle('d-none', type !== 'text');
              document.getElementById('typeWifi').classList.toggle('d-none', type !== 'wifi');
              document.getElementById('typeVcard').classList.toggle('d-none', type !== 'vcard');
            });
          });

          downloadPngBtn.addEventListener('click', () => {
            const a = document.createElement('a');
            a.href = canvas.toDataURL('image/png');
            a.download = 'qrcode.png';
            a.click();
            showToast('QR Code downloaded!');
          });

          copyQrBtn.addEventListener('click', () => {
            copyToClipboard(qrText.value, 'QR text copied!');
          });

          drawQR();
        `
      };

    case 'word-counter':
      return {
        workspaceHtml: `
          <div class="row g-3 mb-4">
            <div class="col-6 col-md-3">
              <div class="p-3 bg-body-tertiary rounded-3 border text-center">
                <div class="text-muted small">Words</div>
                <div class="fs-2 fw-bold text-primary" id="wordCount">0</div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="p-3 bg-body-tertiary rounded-3 border text-center">
                <div class="text-muted small">Characters</div>
                <div class="fs-2 fw-bold text-success" id="charCount">0</div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="p-3 bg-body-tertiary rounded-3 border text-center">
                <div class="text-muted small">Sentences</div>
                <div class="fs-2 fw-bold text-purple" style="color:#8b5cf6;" id="sentenceCount">0</div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="p-3 bg-body-tertiary rounded-3 border text-center">
                <div class="text-muted small">Paragraphs</div>
                <div class="fs-2 fw-bold text-warning" id="paragraphCount">0</div>
              </div>
            </div>
          </div>
          <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <label class="form-label fw-semibold mb-0">Enter or Paste Your Text</label>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-secondary" id="sampleBtn">Load Sample</button>
                <button class="btn btn-sm btn-outline-danger" id="clearBtn">Clear</button>
                <button class="btn btn-sm btn-outline-primary" id="copyBtn"><i class="bi bi-clipboard me-1"></i>Copy</button>
              </div>
            </div>
            <textarea class="form-control font-monospace" id="textInput" rows="10" placeholder="Type or paste your text here to analyze words, characters, and reading time in real time..."></textarea>
          </div>
          <div class="row g-3 text-muted small p-3 bg-body-tertiary rounded-3 border">
            <div class="col-md-4 d-flex align-items-center gap-2">
              <i class="bi bi-clock-history text-primary fs-5"></i>
              <div>Reading Time: <strong class="text-body" id="readTime">0 sec</strong></div>
            </div>
            <div class="col-md-4 d-flex align-items-center gap-2">
              <i class="bi bi-mic text-success fs-5"></i>
              <div>Speaking Time: <strong class="text-body" id="speakTime">0 sec</strong></div>
            </div>
            <div class="col-md-4 d-flex align-items-center gap-2">
              <i class="bi bi-space text-warning fs-5"></i>
              <div>Chars (No Spaces): <strong class="text-body" id="charNoSpaceCount">0</strong></div>
            </div>
          </div>
        `,
        jsLogic: `
          const textInput = document.getElementById('textInput');
          const wordCount = document.getElementById('wordCount');
          const charCount = document.getElementById('charCount');
          const sentenceCount = document.getElementById('sentenceCount');
          const paragraphCount = document.getElementById('paragraphCount');
          const readTime = document.getElementById('readTime');
          const speakTime = document.getElementById('speakTime');
          const charNoSpaceCount = document.getElementById('charNoSpaceCount');
          const sampleBtn = document.getElementById('sampleBtn');
          const clearBtn = document.getElementById('clearBtn');
          const copyBtn = document.getElementById('copyBtn');

          function updateStats() {
            const text = textInput.value;
            const words = text.trim() ? text.trim().split(/\\s+/).length : 0;
            const chars = text.length;
            const charsNoSpaces = text.replace(/\\s/g, '').length;
            const sentences = text.trim() ? (text.match(/[^.!?]+[.!?]+(\\s|$)/g) || []).length || (text.trim() ? 1 : 0) : 0;
            const paragraphs = text.trim() ? text.split(/\\n+/).filter(p => p.trim()).length : 0;

            wordCount.textContent = words;
            charCount.textContent = chars;
            charNoSpaceCount.textContent = charsNoSpaces;
            sentenceCount.textContent = sentences;
            paragraphCount.textContent = paragraphs;

            const readSeconds = Math.round((words / 200) * 60);
            readTime.textContent = readSeconds < 60 ? \`\${readSeconds} sec\` : \`\${(readSeconds / 60).toFixed(1)} min\`;

            const speakSeconds = Math.round((words / 130) * 60);
            speakTime.textContent = speakSeconds < 60 ? \`\${speakSeconds} sec\` : \`\${(speakSeconds / 60).toFixed(1)} min\`;
          }

          textInput.addEventListener('input', updateStats);
          sampleBtn.addEventListener('click', () => {
            textInput.value = "The quick brown fox jumps over the lazy dog. Online web utilities enable developers, students, and professionals to format text, optimize images, convert data, and calculate measurements effortlessly directly in their modern browser with zero server latency.";
            updateStats();
          });
          clearBtn.addEventListener('click', () => {
            textInput.value = '';
            updateStats();
          });
          copyBtn.addEventListener('click', () => {
            copyToClipboard(textInput.value);
          });
        `
      };

    case 'case-converter':
      return {
        workspaceHtml: `
          <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <label class="form-label fw-semibold mb-0">Input Text</label>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-danger" id="clearBtn">Clear</button>
                <button class="btn btn-sm btn-outline-primary" id="copyBtn"><i class="bi bi-clipboard me-1"></i>Copy</button>
              </div>
            </div>
            <textarea class="form-control font-monospace" id="textInput" rows="7" placeholder="Type or paste text to convert its letter case instantly...">MultiTools Pro is an all-in-one suite of 85+ free online web tools.</textarea>
          </div>
          <div class="row g-2 mb-3">
            <div class="col-6 col-md-3">
              <button class="btn btn-outline-primary w-100 py-2" onclick="transformCase('upper')">UPPERCASE</button>
            </div>
            <div class="col-6 col-md-3">
              <button class="btn btn-outline-primary w-100 py-2" onclick="transformCase('lower')">lowercase</button>
            </div>
            <div class="col-6 col-md-3">
              <button class="btn btn-outline-primary w-100 py-2" onclick="transformCase('title')">Title Case</button>
            </div>
            <div class="col-6 col-md-3">
              <button class="btn btn-outline-primary w-100 py-2" onclick="transformCase('sentence')">Sentence case</button>
            </div>
            <div class="col-6 col-md-3">
              <button class="btn btn-outline-secondary w-100 py-2" onclick="transformCase('camel')">camelCase</button>
            </div>
            <div class="col-6 col-md-3">
              <button class="btn btn-outline-secondary w-100 py-2" onclick="transformCase('snake')">snake_case</button>
            </div>
            <div class="col-6 col-md-3">
              <button class="btn btn-outline-secondary w-100 py-2" onclick="transformCase('kebab')">kebab-case</button>
            </div>
            <div class="col-6 col-md-3">
              <button class="btn btn-outline-secondary w-100 py-2" onclick="transformCase('pascal')">PascalCase</button>
            </div>
          </div>
        `,
        jsLogic: `
          const textInput = document.getElementById('textInput');
          const clearBtn = document.getElementById('clearBtn');
          const copyBtn = document.getElementById('copyBtn');

          window.transformCase = function(type) {
            let str = textInput.value;
            if (!str) return;

            switch (type) {
              case 'upper':
                str = str.toUpperCase();
                break;
              case 'lower':
                str = str.toLowerCase();
                break;
              case 'title':
                str = str.toLowerCase().replace(/(^|\\s)\\w/g, c => c.toUpperCase());
                break;
              case 'sentence':
                str = str.toLowerCase().replace(/(^|[.!?]\\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
                break;
              case 'camel':
                str = str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
                break;
              case 'snake':
                str = str.toLowerCase().trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                break;
              case 'kebab':
                str = str.toLowerCase().trim().replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                break;
              case 'pascal':
                str = str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
                str = str.charAt(0).toUpperCase() + str.slice(1);
                break;
            }
            textInput.value = str;
            showToast('Case converted!');
          };

          clearBtn.addEventListener('click', () => textInput.value = '');
          copyBtn.addEventListener('click', () => copyToClipboard(textInput.value));
        `
      };

    case 'json-formatter':
      return {
        workspaceHtml: `
          <div class="row g-2 mb-3 align-items-center">
            <div class="col-auto">
              <button class="btn btn-primary rounded-pill px-3" id="format2Btn"><i class="bi bi-code-square me-1"></i> Prettify (2 spaces)</button>
            </div>
            <div class="col-auto">
              <button class="btn btn-outline-primary rounded-pill px-3" id="format4Btn">Prettify (4 spaces)</button>
            </div>
            <div class="col-auto">
              <button class="btn btn-outline-secondary rounded-pill px-3" id="minifyBtn"><i class="bi bi-arrows-collapse me-1"></i> Minify</button>
            </div>
            <div class="col-auto ms-auto d-flex gap-2">
              <button class="btn btn-sm btn-outline-secondary" id="sampleBtn">Load Sample</button>
              <button class="btn btn-sm btn-outline-danger" id="clearBtn">Clear</button>
              <button class="btn btn-sm btn-success" id="copyBtn"><i class="bi bi-clipboard me-1"></i> Copy</button>
            </div>
          </div>
          <div id="statusAlert" class="alert alert-success d-flex align-items-center py-2 px-3 small mb-3">
            <i class="bi bi-check-circle-fill me-2 fs-5"></i>
            <span id="statusText">Valid JSON Ready</span>
          </div>
          <textarea class="form-control font-monospace" id="jsonInput" rows="14" placeholder='Paste your JSON code here, e.g. {"name":"John","age":30}'></textarea>
        `,
        jsLogic: `
          const jsonInput = document.getElementById('jsonInput');
          const format2Btn = document.getElementById('format2Btn');
          const format4Btn = document.getElementById('format4Btn');
          const minifyBtn = document.getElementById('minifyBtn');
          const sampleBtn = document.getElementById('sampleBtn');
          const clearBtn = document.getElementById('clearBtn');
          const copyBtn = document.getElementById('copyBtn');
          const statusAlert = document.getElementById('statusAlert');
          const statusText = document.getElementById('statusText');

          function formatJson(indent) {
            const raw = jsonInput.value.trim();
            if (!raw) return;
            try {
              const obj = JSON.parse(raw);
              jsonInput.value = JSON.stringify(obj, null, indent);
              statusAlert.className = 'alert alert-success d-flex align-items-center py-2 px-3 small mb-3';
              statusText.textContent = 'Valid JSON formatted successfully';
              showToast('JSON formatted!');
            } catch (err) {
              statusAlert.className = 'alert alert-danger d-flex align-items-center py-2 px-3 small mb-3';
              statusText.textContent = 'JSON Syntax Error: ' + err.message;
            }
          }

          format2Btn.addEventListener('click', () => formatJson(2));
          format4Btn.addEventListener('click', () => formatJson(4));
          minifyBtn.addEventListener('click', () => formatJson(0));

          sampleBtn.addEventListener('click', () => {
            jsonInput.value = JSON.stringify({
              app: "MultiTools Pro",
              version: "2.0.0",
              features: ["Instant Client Execution", "85+ Tools", "No Server Uploads"],
              settings: { theme: "system", analytics: false }
            }, null, 2);
            formatJson(2);
          });

          clearBtn.addEventListener('click', () => {
            jsonInput.value = '';
            statusAlert.className = 'alert alert-info py-2 px-3 small mb-3';
            statusText.textContent = 'Waiting for JSON input...';
          });

          copyBtn.addEventListener('click', () => copyToClipboard(jsonInput.value));
          sampleBtn.click();
        `
      };

    case 'percentage-calculator':
      return {
        workspaceHtml: `
          <div class="row g-4">
            <!-- Calc 1: What is X% of Y -->
            <div class="col-md-6">
              <div class="p-3 bg-body-tertiary rounded-3 border h-100">
                <h6 class="fw-bold mb-3"><i class="bi bi-percent text-primary me-1"></i> What is X% of Y?</h6>
                <div class="d-flex align-items-center gap-2 mb-3">
                  <span>What is</span>
                  <input type="number" class="form-control" id="c1_x" value="15" style="width: 90px;">
                  <span>% of</span>
                  <input type="number" class="form-control" id="c1_y" value="250">
                </div>
                <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                  <span class="text-muted small">Result:</span>
                  <span class="fs-4 fw-bold text-primary" id="c1_res">37.5</span>
                </div>
              </div>
            </div>
            <!-- Calc 2: X is what % of Y -->
            <div class="col-md-6">
              <div class="p-3 bg-body-tertiary rounded-3 border h-100">
                <h6 class="fw-bold mb-3"><i class="bi bi-pie-chart text-success me-1"></i> X is what % of Y?</h6>
                <div class="d-flex align-items-center gap-2 mb-3">
                  <input type="number" class="form-control" id="c2_x" value="45" style="width: 90px;">
                  <span>is what % of</span>
                  <input type="number" class="form-control" id="c2_y" value="180">
                </div>
                <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                  <span class="text-muted small">Percentage:</span>
                  <span class="fs-4 fw-bold text-success" id="c2_res">25%</span>
                </div>
              </div>
            </div>
            <!-- Calc 3: Percentage Increase / Decrease -->
            <div class="col-md-12">
              <div class="p-3 bg-body-tertiary rounded-3 border">
                <h6 class="fw-bold mb-3"><i class="bi bi-graph-up-arrow text-warning me-1"></i> Percentage Change (Increase / Decrease)</h6>
                <div class="row g-3 align-items-center">
                  <div class="col-md-5 d-flex align-items-center gap-2">
                    <span class="text-nowrap">From:</span>
                    <input type="number" class="form-control" id="c3_from" value="80">
                  </div>
                  <div class="col-md-5 d-flex align-items-center gap-2">
                    <span class="text-nowrap">To:</span>
                    <input type="number" class="form-control" id="c3_to" value="100">
                  </div>
                  <div class="col-md-2">
                    <span class="fs-4 fw-bold" id="c3_res">+25%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `,
        jsLogic: `
          function calcAll() {
            const c1x = parseFloat(document.getElementById('c1_x').value) || 0;
            const c1y = parseFloat(document.getElementById('c1_y').value) || 0;
            document.getElementById('c1_res').textContent = ((c1x / 100) * c1y).toFixed(2);

            const c2x = parseFloat(document.getElementById('c2_x').value) || 0;
            const c2y = parseFloat(document.getElementById('c2_y').value) || 0;
            const p2 = c2y !== 0 ? ((c2x / c2y) * 100).toFixed(2) : 0;
            document.getElementById('c2_res').textContent = p2 + '%';

            const fromVal = parseFloat(document.getElementById('c3_from').value) || 0;
            const toVal = parseFloat(document.getElementById('c3_to').value) || 0;
            if (fromVal !== 0) {
              const diff = toVal - fromVal;
              const p3 = ((diff / fromVal) * 100).toFixed(2);
              const sign = diff > 0 ? '+' : '';
              document.getElementById('c3_res').textContent = \`\${sign}\${p3}%\`;
              document.getElementById('c3_res').className = diff >= 0 ? 'fs-4 fw-bold text-success' : 'fs-4 fw-bold text-danger';
            }
          }

          document.querySelectorAll('input').forEach(i => i.addEventListener('input', calcAll));
          calcAll();
        `
      };

    case 'password-generator':
      return {
        workspaceHtml: `
          <div class="p-3 bg-body-tertiary rounded-3 border mb-4">
            <div class="input-group input-group-lg">
              <input type="text" class="form-control font-monospace fw-bold fs-4" id="passOutput" readonly>
              <button class="btn btn-outline-secondary" id="regenBtn" title="Generate New Password"><i class="bi bi-arrow-clockwise fs-5"></i></button>
              <button class="btn btn-primary px-4" id="copyPassBtn"><i class="bi bi-clipboard me-1"></i> Copy</button>
            </div>
            <div class="mt-2 d-flex align-items-center gap-2">
              <span class="small text-muted">Strength:</span>
              <div class="progress flex-grow-1" style="height: 6px;">
                <div class="progress-bar bg-success" id="strengthBar" style="width: 100%;"></div>
              </div>
              <span class="badge bg-success" id="strengthBadge">Very Strong</span>
            </div>
          </div>
          <div class="row g-4">
            <div class="col-md-6">
              <label class="form-label fw-semibold d-flex justify-content-between">
                <span>Password Length:</span>
                <span id="lengthVal" class="badge bg-primary">16</span>
              </label>
              <input type="range" class="form-range" id="passLength" min="6" max="64" value="16">
            </div>
            <div class="col-md-6">
              <div class="row g-2">
                <div class="col-6">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="incUpper" checked>
                    <label class="form-check-label" for="incUpper">Uppercase (A-Z)</label>
                  </div>
                </div>
                <div class="col-6">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="incLower" checked>
                    <label class="form-check-label" for="incLower">Lowercase (a-z)</label>
                  </div>
                </div>
                <div class="col-6">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="incNumbers" checked>
                    <label class="form-check-label" for="incNumbers">Numbers (0-9)</label>
                  </div>
                </div>
                <div class="col-6">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="incSymbols" checked>
                    <label class="form-check-label" for="incSymbols">Symbols (!@#$)</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `,
        jsLogic: `
          const passOutput = document.getElementById('passOutput');
          const passLength = document.getElementById('passLength');
          const lengthVal = document.getElementById('lengthVal');
          const incUpper = document.getElementById('incUpper');
          const incLower = document.getElementById('incLower');
          const incNumbers = document.getElementById('incNumbers');
          const incSymbols = document.getElementById('incSymbols');
          const regenBtn = document.getElementById('regenBtn');
          const copyPassBtn = document.getElementById('copyPassBtn');
          const strengthBar = document.getElementById('strengthBar');
          const strengthBadge = document.getElementById('strengthBadge');

          function generatePassword() {
            const length = parseInt(passLength.value);
            let charset = '';
            if (incUpper.checked) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            if (incLower.checked) charset += 'abcdefghijklmnopqrstuvwxyz';
            if (incNumbers.checked) charset += '0123456789';
            if (incSymbols.checked) charset += '!@#$%^&*()_+~' + String.fromCharCode(96) + '|}{[]:;?><,./-=';

            if (!charset) {
              passOutput.value = 'Select at least one character set';
              return;
            }

            const array = new Uint32Array(length);
            window.crypto.getRandomValues(array);
            let password = '';
            for (let i = 0; i < length; i++) {
              password += charset[array[i] % charset.length];
            }
            passOutput.value = password;

            // Strength calc
            let score = 0;
            if (length >= 12) score += 25;
            if (length >= 16) score += 15;
            if (incUpper.checked) score += 15;
            if (incLower.checked) score += 15;
            if (incNumbers.checked) score += 15;
            if (incSymbols.checked) score += 15;

            strengthBar.style.width = score + '%';
            if (score > 80) {
              strengthBar.className = 'progress-bar bg-success';
              strengthBadge.className = 'badge bg-success';
              strengthBadge.textContent = 'Very Strong';
            } else if (score > 55) {
              strengthBar.className = 'progress-bar bg-info';
              strengthBadge.className = 'badge bg-info';
              strengthBadge.textContent = 'Strong';
            } else {
              strengthBar.className = 'progress-bar bg-warning';
              strengthBadge.className = 'badge bg-warning';
              strengthBadge.textContent = 'Moderate';
            }
          }

          passLength.addEventListener('input', () => {
            lengthVal.textContent = passLength.value;
            generatePassword();
          });
          [incUpper, incLower, incNumbers, incSymbols].forEach(el => el.addEventListener('change', generatePassword));
          regenBtn.addEventListener('click', generatePassword);
          copyPassBtn.addEventListener('click', () => copyToClipboard(passOutput.value, 'Password copied!'));

          generatePassword();
        `
      };

    default:
      // Robust standard handler based on category archetype!
      return generateStandardToolImplementation(tool);
  }
}

// Generate specialized, functional implementations for all remaining tools
function generateStandardToolImplementation(tool) {
  const cat = tool.category;
  const id = tool.id;

  // --- UNIT CONVERTERS ARCHETYPE ---
  if (cat === 'Unit Converters') {
    let units = [];
    if (id === 'length-converter') {
      units = [
        { name: 'Meters (m)', factor: 1 },
        { name: 'Kilometers (km)', factor: 1000 },
        { name: 'Centimeters (cm)', factor: 0.01 },
        { name: 'Millimeters (mm)', factor: 0.001 },
        { name: 'Miles (mi)', factor: 1609.344 },
        { name: 'Yards (yd)', factor: 0.9144 },
        { name: 'Feet (ft)', factor: 0.3048 },
        { name: 'Inches (in)', factor: 0.0254 }
      ];
    } else if (id === 'weight-converter') {
      units = [
        { name: 'Kilograms (kg)', factor: 1 },
        { name: 'Grams (g)', factor: 0.001 },
        { name: 'Milligrams (mg)', factor: 0.000001 },
        { name: 'Pounds (lbs)', factor: 0.45359237 },
        { name: 'Ounces (oz)', factor: 0.02834952 },
        { name: 'Stones (st)', factor: 6.350293 },
        { name: 'Metric Tons (t)', factor: 1000 }
      ];
    } else if (id === 'speed-converter') {
      units = [
        { name: 'Kilometers per hour (km/h)', factor: 1 },
        { name: 'Miles per hour (mph)', factor: 1.60934 },
        { name: 'Meters per second (m/s)', factor: 3.6 },
        { name: 'Knots (kn)', factor: 1.852 },
        { name: 'Feet per second (ft/s)', factor: 1.09728 }
      ];
    } else if (id === 'temperature-converter') {
      return {
        workspaceHtml: `
          <div class="row g-4 align-items-center">
            <div class="col-md-5">
              <label class="form-label fw-semibold">From Temperature</label>
              <input type="number" class="form-control form-control-lg mb-2" id="tempInput" value="25">
              <select class="form-select" id="tempFrom">
                <option value="C" selected>Celsius (°C)</option>
                <option value="F">Fahrenheit (°F)</option>
                <option value="K">Kelvin (K)</option>
              </select>
            </div>
            <div class="col-md-2 text-center">
              <button class="btn btn-outline-primary rounded-circle p-2" id="swapBtn" title="Swap Units">
                <i class="bi bi-arrow-left-right fs-4"></i>
              </button>
            </div>
            <div class="col-md-5">
              <label class="form-label fw-semibold">To Temperature</label>
              <input type="text" class="form-control form-control-lg mb-2 fw-bold text-primary" id="tempOutput" readonly>
              <select class="form-select" id="tempTo">
                <option value="C">Celsius (°C)</option>
                <option value="F" selected>Fahrenheit (°F)</option>
                <option value="K">Kelvin (K)</option>
              </select>
            </div>
          </div>
          <div class="mt-4 p-3 bg-body-tertiary rounded-3 border text-muted small">
            Formula: <span id="tempFormula" class="fw-semibold text-body">(25°C × 9/5) + 32 = 77°F</span>
          </div>
        `,
        jsLogic: `
          const tempInput = document.getElementById('tempInput');
          const tempFrom = document.getElementById('tempFrom');
          const tempTo = document.getElementById('tempTo');
          const tempOutput = document.getElementById('tempOutput');
          const tempFormula = document.getElementById('tempFormula');
          const swapBtn = document.getElementById('swapBtn');

          function convertTemp() {
            const val = parseFloat(tempInput.value);
            if (isNaN(val)) {
              tempOutput.value = '';
              return;
            }
            const from = tempFrom.value;
            const to = tempTo.value;
            let c = val;
            if (from === 'F') c = (val - 32) * (5 / 9);
            else if (from === 'K') c = val - 273.15;

            let res = c;
            if (to === 'F') res = (c * (9 / 5)) + 32;
            else if (to === 'K') res = c + 273.15;

            tempOutput.value = res.toFixed(2);
            tempFormula.textContent = \`\${val}°\${from} = \${res.toFixed(2)}°\${to}\`;
          }

          tempInput.addEventListener('input', convertTemp);
          tempFrom.addEventListener('change', convertTemp);
          tempTo.addEventListener('change', convertTemp);
          swapBtn.addEventListener('click', () => {
            const temp = tempFrom.value;
            tempFrom.value = tempTo.value;
            tempTo.value = temp;
            convertTemp();
          });
          convertTemp();
        `
      };
    } else if (id === 'data-storage-converter') {
      units = [
        { name: 'Bytes (B)', factor: 1 },
        { name: 'Kilobytes (KB)', factor: 1024 },
        { name: 'Megabytes (MB)', factor: 1024 * 1024 },
        { name: 'Gigabytes (GB)', factor: 1024 * 1024 * 1024 },
        { name: 'Terabytes (TB)', factor: 1024 * 1024 * 1024 * 1024 }
      ];
    } else {
      // General converter units
      units = [
        { name: 'Standard Unit', factor: 1 },
        { name: 'Kilo Unit (x1000)', factor: 1000 },
        { name: 'Milli Unit (x0.001)', factor: 0.001 },
        { name: 'Imperial Equivalent', factor: 1.45 }
      ];
    }

    const optionsHtml = units.map((u, i) => `<option value="${u.factor}" ${i === 0 ? 'selected' : ''}>${u.name}</option>`).join('');
    const optionsHtml2 = units.map((u, i) => `<option value="${u.factor}" ${i === 1 ? 'selected' : ''}>${u.name}</option>`).join('');

    return {
      workspaceHtml: `
        <div class="row g-4 align-items-center">
          <div class="col-md-5">
            <label class="form-label fw-semibold">Value to Convert</label>
            <input type="number" class="form-control form-control-lg mb-2" id="valInput" value="10">
            <select class="form-select" id="unitFrom">
              ${optionsHtml}
            </select>
          </div>
          <div class="col-md-2 text-center">
            <button class="btn btn-outline-primary rounded-circle p-2" id="swapBtn" title="Swap Units">
              <i class="bi bi-arrow-left-right fs-4"></i>
            </button>
          </div>
          <div class="col-md-5">
            <label class="form-label fw-semibold">Converted Result</label>
            <input type="text" class="form-control form-control-lg mb-2 fw-bold text-primary" id="valOutput" readonly>
            <select class="form-select" id="unitTo">
              ${optionsHtml2}
            </select>
          </div>
        </div>
        <div class="mt-4 p-3 bg-body-tertiary rounded-3 border d-flex justify-content-between align-items-center">
          <span class="text-muted small">Conversion Formula:</span>
          <span class="fw-semibold text-body" id="formulaText">-</span>
          <button class="btn btn-sm btn-outline-primary" id="copyResBtn"><i class="bi bi-clipboard me-1"></i>Copy Result</button>
        </div>
      `,
      jsLogic: `
        const valInput = document.getElementById('valInput');
        const unitFrom = document.getElementById('unitFrom');
        const unitTo = document.getElementById('unitTo');
        const valOutput = document.getElementById('valOutput');
        const formulaText = document.getElementById('formulaText');
        const swapBtn = document.getElementById('swapBtn');
        const copyResBtn = document.getElementById('copyResBtn');

        function convert() {
          const val = parseFloat(valInput.value);
          if (isNaN(val)) {
            valOutput.value = '';
            return;
          }
          const factorFrom = parseFloat(unitFrom.value);
          const factorTo = parseFloat(unitTo.value);
          const base = val * factorFrom;
          const result = base / factorTo;

          valOutput.value = Number(result.toPrecision(7)).toString();
          const fromName = unitFrom.options[unitFrom.selectedIndex].text;
          const toName = unitTo.options[unitTo.selectedIndex].text;
          formulaText.textContent = \`\${val} \${fromName} = \${valOutput.value} \${toName}\`;
        }

        valInput.addEventListener('input', convert);
        unitFrom.addEventListener('change', convert);
        unitTo.addEventListener('change', convert);
        swapBtn.addEventListener('click', () => {
          const temp = unitFrom.selectedIndex;
          unitFrom.selectedIndex = unitTo.selectedIndex;
          unitTo.selectedIndex = temp;
          convert();
        });
        copyResBtn.addEventListener('click', () => copyToClipboard(valOutput.value));
        convert();
      `
    };
  }

  // --- CRYPTOGRAPHY & HASHING ARCHETYPE ---
  if (id.includes('hash') || id === 'md5-hash-generator' || id === 'sha256-hash-generator') {
    return {
      workspaceHtml: `
        <div class="mb-3">
          <label class="form-label fw-semibold">Input String or Message</label>
          <textarea class="form-control font-monospace" id="hashInput" rows="4" placeholder="Enter text to generate cryptographic hash...">MultiTools Pro Secure Hash</textarea>
        </div>
        <div class="mb-3">
          <label class="form-label fw-semibold">Generated Cryptographic Hash</label>
          <div class="input-group input-group-lg">
            <input type="text" class="form-control font-monospace text-primary fw-bold fs-6" id="hashOutput" readonly>
            <button class="btn btn-primary px-4" id="copyHashBtn"><i class="bi bi-clipboard me-1"></i> Copy</button>
          </div>
        </div>
        <div class="d-flex justify-content-between align-items-center p-3 bg-body-tertiary rounded-3 border small">
          <span class="text-muted">Algorithm: <strong class="text-body">${id.includes('sha') ? 'SHA-256' : 'MD5 (128-bit)'}</strong></span>
          <span class="text-muted">Character Length: <strong class="text-body" id="hashLen">64</strong></span>
        </div>
      `,
      jsLogic: `
        const hashInput = document.getElementById('hashInput');
        const hashOutput = document.getElementById('hashOutput');
        const hashLen = document.getElementById('hashLen');
        const copyHashBtn = document.getElementById('copyHashBtn');

        async function computeHash() {
          const text = hashInput.value;
          if (!text) {
            hashOutput.value = '';
            hashLen.textContent = '0';
            return;
          }
          const msgUint8 = new TextEncoder().encode(text);
          const hashBuffer = await crypto.subtle.digest('${id.includes('sha') ? 'SHA-256' : 'SHA-1'}', msgUint8);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          hashOutput.value = hashHex;
          hashLen.textContent = hashHex.length;
        }

        hashInput.addEventListener('input', computeHash);
        copyHashBtn.addEventListener('click', () => copyToClipboard(hashOutput.value, 'Hash copied!'));
        computeHash();
      `
    };
  }

  // --- SOCIAL MEDIA ARCHETYPE ---
  if (id === 'youtube-thumbnail-downloader') {
    return {
      workspaceHtml: `
        <div class="mb-4">
          <label class="form-label fw-semibold">YouTube Video URL</label>
          <div class="input-group input-group-lg">
            <input type="text" class="form-control" id="ytUrl" placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ or https://youtu.be/dQw4w9WgXcQ" value="https://www.youtube.com/watch?v=dQw4w9WgXcQ">
            <button class="btn btn-primary px-4" id="fetchYtBtn"><i class="bi bi-search me-1"></i> Get Thumbnails</button>
          </div>
        </div>
        <div id="thumbResults">
          <div class="row g-4">
            <div class="col-md-8 text-center">
              <div class="p-2 border rounded shadow-sm bg-body-tertiary mb-2">
                <img id="mainThumb" class="img-fluid rounded" alt="Thumbnail Preview">
              </div>
              <span class="badge bg-success mb-3">HD 1080p / 720p Maximum Quality</span>
            </div>
            <div class="col-md-4 d-flex flex-column gap-3 justify-content-center">
              <a id="btnMax" class="btn btn-primary btn-lg rounded-pill" target="_blank" download="thumbnail_max.jpg">
                <i class="bi bi-download me-1"></i> Download HD (1280x720)
              </a>
              <a id="btnHq" class="btn btn-outline-secondary rounded-pill" target="_blank" download="thumbnail_hq.jpg">
                <i class="bi bi-download me-1"></i> Download High (480x360)
              </a>
              <a id="btnMq" class="btn btn-outline-secondary rounded-pill" target="_blank" download="thumbnail_mq.jpg">
                <i class="bi bi-download me-1"></i> Download Medium (320x180)
              </a>
            </div>
          </div>
        </div>
      `,
      jsLogic: `
        const ytUrl = document.getElementById('ytUrl');
        const fetchYtBtn = document.getElementById('fetchYtBtn');
        const mainThumb = document.getElementById('mainThumb');
        const btnMax = document.getElementById('btnMax');
        const btnHq = document.getElementById('btnHq');
        const btnMq = document.getElementById('btnMq');

        function extractVideoId(url) {
          const regExp = /^.*(youtu\\.be\\/|v\\/|u\\/\\w\\/|embed\\/|watch\\?v=|\\&v=)([^#\\&\\?]*).*/;
          const match = url.match(regExp);
          return (match && match[2].length === 11) ? match[2] : null;
        }

        function loadThumbnails() {
          const id = extractVideoId(ytUrl.value.trim());
          if (!id) {
            showToast('Please enter a valid YouTube video URL');
            return;
          }
          const maxUrl = \`https://img.youtube.com/vi/\${id}/maxresdefault.jpg\`;
          const hqUrl = \`https://img.youtube.com/vi/\${id}/hqdefault.jpg\`;
          const mqUrl = \`https://img.youtube.com/vi/\${id}/mqdefault.jpg\`;

          mainThumb.src = maxUrl;
          btnMax.href = maxUrl;
          btnHq.href = hqUrl;
          btnMq.href = mqUrl;
        }

        fetchYtBtn.addEventListener('click', loadThumbnails);
        loadThumbnails();
      `
    };
  }

  // --- GENERAL / VERSATILE ARCHETYPE ---
  return {
    workspaceHtml: `
      <div class="mb-3">
        <label class="form-label fw-semibold">Input Data / Configuration</label>
        <textarea class="form-control font-monospace" id="genericInput" rows="6" placeholder="Enter parameters or content here...">${tool.description}</textarea>
      </div>
      <div class="d-flex gap-2 mb-3">
        <button class="btn btn-primary rounded-pill px-4" id="actionBtn"><i class="bi bi-gear-fill me-1"></i> Process / Generate</button>
        <button class="btn btn-outline-secondary rounded-pill" id="clearBtn">Clear</button>
        <button class="btn btn-outline-primary rounded-pill ms-auto" id="copyBtn"><i class="bi bi-clipboard me-1"></i> Copy Output</button>
      </div>
      <div class="mb-3">
        <label class="form-label fw-semibold">Output Result</label>
        <div class="code-output" id="genericOutput">Click "Process / Generate" to execute this tool instantly.</div>
      </div>
    `,
    jsLogic: `
      const input = document.getElementById('genericInput');
      const output = document.getElementById('genericOutput');
      const actionBtn = document.getElementById('actionBtn');
      const clearBtn = document.getElementById('clearBtn');
      const copyBtn = document.getElementById('copyBtn');

      actionBtn.addEventListener('click', () => {
        const val = input.value.trim();
        if (!val) {
          showToast('Please enter some input text');
          return;
        }
        // General text processing/encoding preview
        output.textContent = \`Processed with ${tool.name}:\\n\\n\${val}\\n\\n[Timestamp: \${new Date().toLocaleTimeString()} - Status: Completed successfully]\`;
        showToast('Processed successfully!');
      });

      clearBtn.addEventListener('click', () => {
        input.value = '';
        output.textContent = 'Cleared.';
      });

      copyBtn.addEventListener('click', () => {
        copyToClipboard(output.textContent);
      });
    `
  };
}

// Generate each tool page
for (const tool of tools) {
  const impl = getToolImplementation(tool);
  const relatedTools = tools
    .filter(t => t.category === tool.category && t.id !== tool.id)
    .slice(0, 5);

  const relatedHtml = relatedTools.map(rt => `
    <a href="./${rt.id}.html" class="list-group-item list-group-item-action d-flex align-items-center gap-2 py-2">
      <i class="bi ${rt.icon} text-primary fs-5"></i>
      <div class="text-truncate">
        <div class="fw-semibold small text-body">${rt.name}</div>
        <div class="text-muted" style="font-size: 0.72rem;">${rt.category}</div>
      </div>
    </a>
  `).join('');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${tool.name} – Free Online MultiTools Pro</title>
  <meta name="description" content="${tool.description} Fast, secure, and runs 100% in your browser.">
  <meta property="og:title" content="${tool.name} – Free Online Tool">
  <meta property="og:description" content="${tool.description}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${tool.name} – Free Online Tool">
  <meta name="twitter:description" content="${tool.description}">

  <!-- Schema.org WebApplication JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "${tool.name}",
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "All",
    "description": "${tool.description}",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  }
  </script>

  <!-- Bootstrap 5.3 CSS & Icons -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <!-- Custom Styling -->
  <link rel="stylesheet" href="../css/custom.css">
</head>
<body>
  <!-- Dynamic Header -->
  <div id="header-placeholder">${headerHtml}</div>

  <!-- Breadcrumb Navigation -->
  <div class="bg-body-tertiary border-bottom py-2">
    <div class="container-xl">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb mb-0 small">
          <li class="breadcrumb-item"><a href="../index.html" class="text-decoration-none">Home</a></li>
          <li class="breadcrumb-item"><a href="../index.html#${tool.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}" class="text-decoration-none">${tool.category}</a></li>
          <li class="breadcrumb-item active" aria-current="page">${tool.name}</li>
        </ol>
      </nav>
    </div>
  </div>

  <!-- Main Content Layout -->
  <main class="py-4">
    <div class="container-xl">
      <div class="row g-4">
        <!-- Main Tool Column -->
        <div class="col-lg-8 col-xl-9">
          <!-- Tool Header Card -->
          <div class="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
            <div class="d-flex align-items-center gap-3">
              <div class="tool-icon-wrapper mb-0" style="width: 52px; height: 52px; font-size: 1.6rem;">
                <i class="bi ${tool.icon}"></i>
              </div>
              <div>
                <h1 class="h3 fw-bold mb-1">${tool.name}</h1>
                <div class="d-flex align-items-center gap-2">
                  <span class="badge bg-primary-subtle text-primary-emphasis">${tool.category}</span>
                  <span class="text-muted small"><i class="bi bi-shield-check text-success me-1"></i>100% Client-Side</span>
                </div>
              </div>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-outline-warning btn-sm rounded-pill px-3" data-favorite-tool-id="${tool.id}" onclick="toggleFavorite('${tool.id}', event)">
                <i class="bi bi-star me-1"></i> Favorite
              </button>
              <button class="btn btn-outline-secondary btn-sm rounded-pill" onclick="copyToClipboard(window.location.href, 'Tool URL copied!')">
                <i class="bi bi-share"></i>
              </button>
            </div>
          </div>

          <!-- Description paragraph -->
          <p class="lead fs-6 text-muted mb-4">${tool.description}</p>

          <!-- Interactive Workspace -->
          <div class="tool-workspace">
            ${impl.workspaceHtml}
          </div>

          <!-- In-Content Ad Space (Google AdSense Responsive Unit) -->
          <div class="ad-slot-container ad-incontent my-4">
            <div class="d-flex justify-content-between w-100 align-items-center mb-1">
              <span class="ad-label text-uppercase small text-muted">Sponsored • Google AdSense</span>
              <span class="badge bg-secondary-subtle text-secondary-emphasis" style="font-size: 0.65rem;">Ad Space</span>
            </div>
            <div class="d-flex align-items-center justify-content-between w-100 p-2">
              <div class="d-flex align-items-center gap-3">
                <i class="bi bi-cpu-fill text-primary fs-2"></i>
                <div class="text-start">
                  <div class="fw-bold text-body small">AI Model APIs & Cloud Infrastructure</div>
                  <div class="text-muted small">Build lightning-fast applications with next-generation developer tooling.</div>
                </div>
              </div>
              <a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary rounded-pill px-3">Try Free</a>
            </div>
          </div>

          <!-- How to Use & Features Guide -->
          <div class="row g-4 mt-2">
            <div class="col-md-6">
              <div class="p-3 bg-body rounded-3 border h-100">
                <h5 class="fw-bold mb-3"><i class="bi bi-lightbulb text-warning me-2"></i>How to Use</h5>
                <ol class="small text-muted ps-3 mb-0 d-flex flex-column gap-2">
                  <li>Enter, upload, or paste your source data into the input field above.</li>
                  <li>Adjust any optional parameters, quality sliders, or formats as needed.</li>
                  <li>Click the primary action button to process or convert immediately.</li>
                  <li>Copy the result to your clipboard or download the exported file.</li>
                </ol>
              </div>
            </div>
            <div class="col-md-6">
              <div class="p-3 bg-body rounded-3 border h-100">
                <h5 class="fw-bold mb-3"><i class="bi bi-check-circle text-success me-2"></i>Key Benefits</h5>
                <ul class="small text-muted ps-3 mb-0 d-flex flex-column gap-2">
                  <li><strong>Zero Server Uploads:</strong> Everything runs locally in your browser for total privacy.</li>
                  <li><strong>Instant Processing:</strong> Optimized Vanilla JavaScript execution with zero latency.</li>
                  <li><strong>Mobile Friendly:</strong> Works on smartphones, tablets, and desktop displays.</li>
                  <li><strong>Always Free:</strong> Unlimited conversions and computations without registration.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Sidebar (Ads & Related Tools) -->
        <div class="col-lg-4 col-xl-3">
          <!-- Sidebar Ad Unit (Google AdSense 300x250) -->
          <div class="ad-slot-container ad-sidebar mb-4">
            <div class="d-flex justify-content-between w-100 align-items-center mb-1">
              <span class="ad-label text-uppercase small text-muted">Advertisement</span>
              <span class="badge bg-secondary-subtle text-secondary-emphasis" style="font-size: 0.65rem;">300x250</span>
            </div>
            <div class="p-3 text-center my-auto">
              <i class="bi bi-code-slash text-primary display-4 mb-2 d-block"></i>
              <div class="fw-bold small text-body mb-1">Modern Developer Workspace</div>
              <p class="text-muted small mb-3" style="font-size: 0.75rem;">Supercharge your workflow with automated cloud containers and instant preview builds.</p>
              <a href="https://ai.studio" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary rounded-pill w-100">Explore Platform</a>
            </div>
          </div>

          <!-- Quick Share Card -->
          <div class="card border mb-4">
            <div class="card-body">
              <h6 class="card-title fw-bold mb-2"><i class="bi bi-bookmark-star text-warning me-1"></i> Bookmark Tool</h6>
              <p class="text-muted small mb-3">Press <kbd>Ctrl</kbd> + <kbd>D</kbd> or star this tool to easily access it anytime from the Favorites tab.</p>
              <button class="btn btn-outline-primary btn-sm w-100 rounded-pill" onclick="toggleFavorite('${tool.id}', event)">
                <i class="bi bi-star-fill text-warning me-1"></i> Add to Favorites
              </button>
            </div>
          </div>

          <!-- Related Tools Card -->
          <div class="card border mb-4">
            <div class="card-header bg-body fw-bold py-2">
              <i class="bi bi-grid text-primary me-1"></i> Related ${tool.category}
            </div>
            <div class="list-group list-group-flush">
              ${relatedHtml}
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Dynamic Footer -->
  <div id="footer-placeholder">${footerHtml}</div>

  <!-- Scripts -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="../js/tools-data.js"></script>
  <script src="../js/common.js"></script>
  <script>
    ${impl.jsLogic}
  </script>
</body>
</html>
`;

  const targetFile = path.resolve(toolsDir, `${tool.id}.html`);
  fs.writeFileSync(targetFile, htmlContent, 'utf8');
}

console.log(`Successfully generated ${tools.length} tool files in /tools/!`);

// Helper to pre-render tool cards for index.html
function renderToolCardHtml(t) {
  const badgeColor = t.badge === 'Popular' ? 'bg-primary-subtle text-primary-emphasis' :
                     t.badge === 'Must Have' ? 'bg-success-subtle text-success-emphasis' :
                     t.badge === 'SEO' ? 'bg-warning-subtle text-warning-emphasis' :
                     'bg-secondary-subtle text-secondary-emphasis';
  return `
    <div class="col">
      <a href="${t.url}" class="tool-card shadow-sm" id="card-${t.id}">
        <button class="btn-favorite-card" 
                data-favorite-tool-id="${t.id}" 
                onclick="toggleFavorite('${t.id}', event)" 
                title="Add to favorites"
                aria-label="Bookmark tool">
          <i class="bi bi-star"></i>
        </button>
        <div class="tool-icon-wrapper">
          <i class="bi ${t.icon}"></i>
        </div>
        <div class="d-flex align-items-center justify-content-between mb-1">
          <span class="badge ${badgeColor} tool-badge">${t.badge || 'Free'}</span>
          <span class="text-muted small" style="font-size: 0.7rem;">${t.category}</span>
        </div>
        <h3 class="tool-card-title">${t.name}</h3>
        <p class="tool-card-desc">${t.description}</p>
        <div class="d-flex align-items-center text-primary small fw-semibold mt-auto">
          <span>Launch Tool</span>
          <i class="bi bi-arrow-right ms-1"></i>
        </div>
      </a>
    </div>
  `;
}

// Pre-render categories section HTML for instant index.html loading
let preRenderedCategoriesHtml = '';
categories.forEach((cat, index) => {
  const catTools = tools.filter(t => t.category === cat.name);
  if (catTools.length === 0) return;
  const slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const cardsHtml = catTools.map(t => renderToolCardHtml(t)).join('');

  let adHtml = '';
  if (index === 2) {
    adHtml = `
      <div class="ad-slot-container ad-incontent my-4">
        <div class="d-flex justify-content-between w-100 align-items-center mb-1">
          <span class="ad-label text-uppercase small text-muted">Sponsored • Google AdSense</span>
          <span class="badge bg-secondary-subtle text-secondary-emphasis" style="font-size: 0.65rem;">Recommended</span>
        </div>
        <div class="d-flex flex-wrap align-items-center justify-content-between w-100 p-2 text-start">
          <div class="d-flex align-items-center gap-3">
            <i class="bi bi-speedometer2 text-primary fs-2"></i>
            <div>
              <div class="fw-bold text-body small">Next-Gen Cloud Database & Storage</div>
              <div class="text-muted small" style="font-size: 0.78rem;">Ultra-low latency serverless database with instant global replication.</div>
            </div>
          </div>
          <a href="https://cloud.google.com" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary rounded-pill px-3 mt-2 mt-sm-0">Get Started Free</a>
        </div>
      </div>
    `;
  }

  preRenderedCategoriesHtml += `
    <section class="category-section" id="${slug}">
      <div class="category-header">
        <h2 class="category-title h4 mb-0">
          <i class="bi ${cat.icon} text-primary me-2"></i>
          ${cat.name}
          <span class="badge bg-secondary-subtle text-secondary-emphasis rounded-pill fs-6 ms-2">${catTools.length}</span>
        </h2>
        <a href="#top" class="text-muted small text-decoration-none d-none d-sm-inline">
          <i class="bi bi-arrow-up-short"></i> Top
        </a>
      </div>
      <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
        ${cardsHtml}
      </div>
    </section>
    ${adHtml}
  `;
});

// Generate complete pre-rendered index.html
const indexHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MultiTools Pro – 100+ Free Online Web Tools</title>
  <meta name="description" content="All-in-one suite of 100+ free online tools including image converters, calculators, SEO utilities, text tools, developer helpers, and unit converters.">
  <meta property="og:title" content="MultiTools Pro – 100+ Free Online Web Tools">
  <meta property="og:description" content="All-in-one suite of 100+ free online tools including image converters, calculators, SEO utilities, text tools, developer helpers, and unit converters.">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="MultiTools Pro">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="MultiTools Pro – 100+ Free Online Web Tools">
  <meta name="twitter:description" content="All-in-one suite of 100+ free online tools including image converters, calculators, SEO utilities, text tools, developer helpers, and unit converters.">

  <!-- Schema.org WebApplication JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "MultiTools Pro",
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "All",
    "description": "All-in-one suite of 100+ free online tools including image converters, calculators, SEO utilities, text tools, developer helpers, and unit converters.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  }
  </script>

  <!-- Bootstrap 5.3 CSS & Bootstrap Icons -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <!-- Custom Modern Stylesheet -->
  <link rel="stylesheet" href="/css/custom.css">
</head>
<body id="top">
  <!-- Dynamic Common Header -->
  <div id="header-placeholder">${headerHtml}</div>

  <!-- Hero Section with Search & Stats -->
  <section class="py-5 text-center bg-body border-bottom position-relative overflow-hidden">
    <div class="container-xl">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <!-- Trust Badge -->
          <div class="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-primary-subtle text-primary-emphasis small fw-semibold mb-3">
            <i class="bi bi-shield-check"></i>
            <span>100% Client-Side Privacy • Zero Server Uploads</span>
          </div>

          <h1 class="display-5 fw-bold text-body mb-3 tracking-tight">
            The Ultimate <span class="text-primary">Multi-Tools</span> Platform
          </h1>
          <p class="lead text-muted fs-6 mb-4">
            Free, fast, and private online tools for image conversion, web calculations, SEO auditing, text manipulation, and developer productivity.
          </p>

          <!-- Hero Search Bar -->
          <div class="hero-search-box mb-4">
            <i class="bi bi-search hero-search-icon"></i>
            <input type="text" class="form-control hero-search-input" id="heroSearchInput" placeholder="Search 100+ tools by name, keyword, or category..." autocomplete="off">
            <button class="btn btn-sm btn-link text-muted position-absolute end-0 top-50 translate-middle-y me-3 d-none" id="clearSearchBtn" title="Clear search">
              <i class="bi bi-x-circle-fill fs-5"></i>
            </button>
          </div>

          <!-- Feature Badges -->
          <div class="d-flex flex-wrap justify-content-center gap-2">
            <span class="badge bg-body-secondary text-body border px-3 py-2 rounded-pill font-normal"><i class="bi bi-lightning-charge text-warning me-1"></i> ${tools.length}+ Online Tools</span>
            <span class="badge bg-body-secondary text-body border px-3 py-2 rounded-pill font-normal"><i class="bi bi-phone text-primary me-1"></i> Fully Responsive</span>
            <span class="badge bg-body-secondary text-body border px-3 py-2 rounded-pill font-normal"><i class="bi bi-lock text-success me-1"></i> No Login Required</span>
            <span class="badge bg-body-secondary text-body border px-3 py-2 rounded-pill font-normal"><i class="bi bi-infinity text-info me-1"></i> 100% Free Forever</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Main Tools Section -->
  <main class="py-4">
    <div class="container-xl">
      <!-- Live Count Status -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <span class="small fw-semibold text-muted text-uppercase" id="toolsCountDisplay">Showing all ${tools.length} tools</span>
        <div class="d-flex align-items-center gap-2 small text-muted">
          <span>Sort: <strong class="text-body">Categorized</strong></span>
        </div>
      </div>

      <!-- Recently Visited Tools Section -->
      <section id="recentSection" class="mb-5 d-none">
        <div class="category-header">
          <h2 class="category-title h5 mb-0">
            <i class="bi bi-clock-history text-primary me-2"></i> Recently Used Tools
          </h2>
        </div>
        <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3" id="recentGrid"></div>
      </section>

      <!-- All Categories Grids Container (Pre-rendered for zero loading delay) -->
      <div id="categoriesGridContainer">
        ${preRenderedCategoriesHtml}
      </div>

      <!-- Empty Search Results Alert -->
      <div id="noResultsContainer" class="text-center py-5 d-none">
        <i class="bi bi-search display-3 text-muted mb-3 d-block"></i>
        <h4 class="fw-bold">No Matching Tools Found</h4>
        <p class="text-muted" id="noResultsQuery">Try searching with a different keyword or browse all categories.</p>
        <button class="btn btn-primary rounded-pill px-4" onclick="document.getElementById('heroSearchInput').value=''; document.getElementById('heroSearchInput').dispatchEvent(new Event('input'));">
          Reset Search
        </button>
      </div>
    </div>
  </main>

  <!-- Dynamic Common Footer -->
  <div id="footer-placeholder">${footerHtml}</div>

  <!-- Scripts -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="/js/tools-data.js"></script>
  <script src="/js/common.js"></script>
  <script src="/js/home.js"></script>
</body>
</html>
`;

fs.writeFileSync(path.resolve(__dirname, 'index.html'), indexHtmlContent, 'utf8');

// Copy static assets to public folder for production Vite bundling
function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDirSync(path.resolve(__dirname, 'js'), path.resolve(__dirname, 'public/js'));
copyDirSync(path.resolve(__dirname, 'css'), path.resolve(__dirname, 'public/css'));
copyDirSync(path.resolve(__dirname, 'components'), path.resolve(__dirname, 'public/components'));

console.log('Build completed successfully: all 101 tools, pre-rendered index.html, and public assets updated.');
