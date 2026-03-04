# Persuasion Detector — Local Demo

A video transcript analyzer that highlights rhetorical/persuasion techniques during playback.

## Project Structure

```
project/
├── backend/
│   ├── main.py               # FastAPI app
│   ├── requirements.txt
│   └── data/
│       ├── labels.json        # Label registry (source of truth)
│       ├── transcripts/       # Transcript JSON files
│       │   ├── debate_001.json
│       │   └── interview_002.json
│       └── videos/            # Place your .mp4 files here
│           └── (place debate_001.mp4, interview_002.mp4 here)
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.js
        ├── App.vue
        ├── style.css
        ├── router/index.js
        ├── stores/
        │   ├── labelStore.js
        │   └── videoStore.js
        └── components/
            ├── VideoPlayer.vue
            ├── TranscriptList.vue
            ├── SegmentRow.vue
            ├── LabelLegend.vue
            └── LabelMeaningPanel.vue
        └── pages/
            ├── LandingPage.vue
            └── VideoPage.vue
```

## Setup

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

The Vite dev server proxies `/api` and `/media` to the backend automatically.

### 3. Add Videos (Optional)

Place MP4 files in `backend/data/videos/` matching the transcript names:
- `backend/data/videos/debate_001.mp4`
- `backend/data/videos/interview_002.mp4`

The app works without video files — transcript analysis is fully functional.

## Adding New Videos

1. Create a transcript JSON in `backend/data/transcripts/<video_id>.json`:

```json
{
  "video_id": "my_video",
  "segments": [
    {
      "start_time": 0.0,
      "end_time": 10.5,
      "text": "The segment text here.",
      "label": "Neutral"
    }
  ]
}
```

2. Optionally place the video at `backend/data/videos/my_video.mp4`

3. Available labels (from `data/labels.json`):
   - Neutral
   - Appeal to Emotion
   - Fear Mongering
   - Loaded Language
   - False Dichotomy
   - Ad Hominem
   - Appeal to Authority
   - Bandwagon

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/videos` | List available video IDs |
| GET | `/api/labels` | Get label registry |
| GET | `/api/transcripts/{video_id}` | Get sorted transcript |
| GET | `/media/{video_id}.mp4` | Serve video file |
| GET | `/health` | Health check |

## Features

- **Auto-scroll**: Active transcript segment scrolls into view during playback
- **Label filtering**: Toggle label chips to show/hide segment types
- **Seek on click**: Click any segment row to jump to that time
- **Meaning panel**: Shows description of the currently active rhetorical technique
- **Keyboard navigation**: Up/Down arrow keys + Enter/Space to navigate transcript
- **Binary search sync**: O(log n) time-to-segment lookup on every timeupdate event
