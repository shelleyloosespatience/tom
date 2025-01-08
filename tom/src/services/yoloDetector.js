const ort = require('onnxruntime-node');
const sharp = require('sharp');

class YOLODetector {
    constructor(modelPath) {
        this.modelPath = modelPath;
        this.session = null;
    }

    async loadModel() {
        this.session = await ort.InferenceSession.create(this.modelPath);
    }

    async detect(imageBuffer) {
        // Resize and normalize the image for YOLO input
        const img = await sharp(imageBuffer).resize(640, 640).raw().toBuffer();
        const tensor = new ort.Tensor('float32', new Float32Array(img), [1, 3, 640, 640]);
        const { execFile } = require('child_process');
        const path = require('path');

        async function detectElements() {
            return new Promise((resolve, reject) => {
                const pythonScript = path.join(__dirname, 'detect_yolo.py');
                const imagePath = path.join(__dirname, '../screenshots/current_screen.png');

                execFile('python3', [pythonScript, imagePath], (error, stdout, stderr) => {
                    if (error) {
                        console.error('YOLO detection failed:', stderr);
                        return reject(error);
                    }
                    try {
                        const detections = JSON.parse(stdout);
                        resolve(detections);
                    } catch (parseError) {
                        reject(parseError);
                    }
                });
            });
        }

        module.exports = { detectElements };

        // Run inference
        const results = await this.session.run({ images: tensor });
        return this.parseResults(results);
    }

    parseResults(results) {
        // Process results (e.g., bounding boxes, labels)
        const boxes = results[0].data;
        const labels = results[1].data;
        const confidences = results[2].data;

        return labels.map((label, index) => ({
            label,
            confidence: confidences[index],
            box: boxes.slice(index * 4, (index + 1) * 4),
        }));
    }
}

module.exports = YOLODetector;
