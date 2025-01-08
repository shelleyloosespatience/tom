import torch
from PIL import Image
import json
import sys
model = torch.hub.load('ultralytics/yolov5', 'custom', path='yolo_model.pt')

def detect_elements(image_path):
    results = model(image_path)
    detections = []
    for *box, conf, cls in results.xyxy[0]:
        detections.append({
            'box': [int(x) for x in box], 
            'confidence': float(conf),
            'class': int(cls)
        })
    return detections

if __name__ == "__main__":
    image_path = sys.argv[1]
    detections = detect_elements(image_path)
    print(json.dumps(detections))
