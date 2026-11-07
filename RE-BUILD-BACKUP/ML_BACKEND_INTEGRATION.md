# RE:BUILD ML ↔ Backend integration

## Flow

1. Register a building: `POST /api/buildings` (JWT required).
2. Analyze images: `POST /api/buildings/:id/analyze` (JWT + multipart form).
3. Node backend forwards each image to FastAPI `POST /detect`.
4. Node sends each image in multipart field `file` and sends `material_conditions` as a JSON string.
5. FastAPI results are combined and saved to the building document in MongoDB.

## Backend environment

Set these in `server/.env` (never commit the real `.env`):

```env
ML_SERVICE_URL=http://127.0.0.1:8000
ML_SERVICE_TIMEOUT_MS=120000
```

For a hosted ML service, set `ML_SERVICE_URL` to its HTTPS base URL, without `/detect` at the end.

## Request from frontend to Node backend

`POST /api/buildings/:id/analyze` with `Authorization: Bearer <JWT>` and multipart fields:

- `images`: one to five JPG, PNG or WEBP files (Node forwards each file separately)
- `material_conditions`: JSON string, e.g. `{"concrete":{"condition":"damaged","contamination":"high"}}`

Allowed condition values: `intact`, `damaged`, `mixed`. Allowed contamination values: `low`, `high`. Omitted material entries use the ML service's defaults.

## FastAPI contract used by Node

`POST {ML_SERVICE_URL}/detect` multipart fields:

- `file`: one image
- `material_conditions`: JSON string

The response must include `success: true`, `detections` (array), and `material_analysis` (object). The backend stores the material-wise summary and per-image responses.

## Model weights

`best.pt` is intentionally excluded from Git. The ML runtime must have the trained weights mounted/copied into its deployment environment, and `MODEL_PATH` must point to that file. Do not commit model weights or secrets.

## Important scope boundary

Current ML output includes detections, confidence, visible image area, condition/contamination inputs, and rule-based recovery recommendations. It does **not** calculate kg/tonne quantities, recovery percentages, CO2 savings or circularity scores. This integration leaves those values uncalculated instead of deriving unsupported estimates.

## Local smoke test

- Start FastAPI on port `8000` and confirm `/health` reports `mock_mode: false` when testing the trained model.
- Start Node backend on port `5000` with a valid MongoDB connection and `ML_SERVICE_URL`.
- Log into the frontend, register a building, select it in AI material detection, choose one or more images, and run analysis.
- Confirm the response is saved by refreshing the building list or opening `GET /api/buildings/:id`.
