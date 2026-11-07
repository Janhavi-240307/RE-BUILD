
# RE:BUILD ML Service

AI-powered construction material detection using
FastAPI, YOLOv8 and OpenCV.

## Supported materials

- Concrete
- Brick
- Steel
- Wood
- Glass
- Tiles

## Installation

```bash
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Install:

```bash
pip install -r requirements.txt
```

Copy `.env.example` to `.env`.

## Run API

```bash
uvicorn main:app --reload --port 8000
```

## API documentation

http://localhost:8000/docs

## Health check

http://localhost:8000/health

## Training

```bash
python train.py --data path/to/data.yaml
```

Training runs for 30 epochs.

Best weights are saved in:

runs/detect/rebuild-materials/weights/best.pt
