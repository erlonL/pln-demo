from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, field_validator, model_validator
from typing import List, Optional
import json
import os
import re

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")
TRANSCRIPTS_DIR = os.path.join(DATA_DIR, "transcripts")
VIDEOS_DIR = os.path.join(DATA_DIR, "videos")
LABELS_FILE = os.path.join(DATA_DIR, "labels.json")

app = FastAPI(title="Transcript Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Label loading (cached) ---
_labels_cache: Optional[dict] = None

def load_labels() -> dict:
    global _labels_cache
    if _labels_cache is None:
        with open(LABELS_FILE) as f:
            _labels_cache = json.load(f)
    return _labels_cache

def get_allowed_label_names() -> set:
    return {l["name"] for l in load_labels()["labels"]}

# --- Pydantic models ---
class Segment(BaseModel):
    start_time: float
    end_time: float
    text: str
    label: str

    @field_validator("start_time")
    @classmethod
    def start_non_negative(cls, v):
        if v < 0:
            raise ValueError("start_time must be >= 0")
        return v

    @model_validator(mode="after")
    def end_after_start(self):
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be > start_time")
        return self

class Transcript(BaseModel):
    video_id: str
    segments: List[Segment]

class LabelMeta(BaseModel):
    name: str
    color: str
    meaning: str

class LabelsResponse(BaseModel):
    labels: List[LabelMeta]

class VideoInfo(BaseModel):
    video_id: str
    title: str

class VideosResponse(BaseModel):
    videos: List[VideoInfo]

# --- Helpers ---
def _video_id_to_title(video_id: str) -> str:
    return re.sub(r"[_-]", " ", video_id).title()

def get_available_video_ids() -> List[str]:
    ids = set()
    if os.path.isdir(TRANSCRIPTS_DIR):
        for fname in os.listdir(TRANSCRIPTS_DIR):
            if fname.endswith(".json"):
                ids.add(fname[:-5])
    if os.path.isdir(VIDEOS_DIR):
        for fname in os.listdir(VIDEOS_DIR):
            if fname.endswith(".mp4"):
                ids.add(fname[:-4])
    return sorted(ids)

# --- Routes ---
@app.get("/api/labels", response_model=LabelsResponse)
def get_labels():
    return load_labels()

@app.get("/api/videos", response_model=VideosResponse)
def get_videos():
    ids = get_available_video_ids()
    videos = [VideoInfo(video_id=vid, title=_video_id_to_title(vid)) for vid in ids]
    return VideosResponse(videos=videos)

@app.get("/api/transcripts/{video_id}")
def get_transcript(video_id: str):
    path = os.path.join(TRANSCRIPTS_DIR, f"{video_id}.json")
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail={"error": "transcript_not_found"})

    try:
        with open(path) as f:
            raw = json.load(f)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=422, detail={"error": "invalid_transcript", "details": [str(e)]})

    allowed_labels = get_allowed_label_names()

    # Validate labels
    errors = []
    for i, seg in enumerate(raw.get("segments", [])):
        if seg.get("label") not in allowed_labels:
            errors.append(f"Segment {i}: unknown label '{seg.get('label')}'")

    if errors:
        raise HTTPException(status_code=422, detail={"error": "invalid_transcript", "details": errors})

    try:
        transcript = Transcript(**raw)
    except Exception as e:
        raise HTTPException(status_code=422, detail={"error": "invalid_transcript", "details": [str(e)]})

    # Sort by start_time server-side
    sorted_segments = sorted(transcript.segments, key=lambda s: s.start_time)

    return {
        "video_id": transcript.video_id,
        "segments": [s.model_dump() for s in sorted_segments]
    }

@app.get("/api/transcripts/{video_id}/exists")
def transcript_exists(video_id: str):
    path = os.path.join(TRANSCRIPTS_DIR, f"{video_id}.json")
    return {"exists": os.path.isfile(path)}

# Serve MP4 files
@app.get("/media/{video_id}.mp4")
def get_video(video_id: str):
    path = os.path.join(VIDEOS_DIR, f"{video_id}.mp4")
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail={"error": "video_not_found"})
    return FileResponse(path, media_type="video/mp4")

# Health
@app.get("/health")
def health():
    return {"status": "ok"}
