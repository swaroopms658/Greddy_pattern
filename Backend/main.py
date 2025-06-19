from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

# Create the app first
app = FastAPI()

# Then add the middleware to it
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define your request/response models
class MatchRequest(BaseModel):
    text: str
    patterns: List[str]

class MatchResult(BaseModel):
    pattern: str
    index: int

@app.post("/match", response_model=List[MatchResult])
def match_patterns(data: MatchRequest):
    results = []
    for pattern in data.patterns:
        index = greedy_match(data.text, pattern)
        results.append(MatchResult(pattern=pattern, index=index))
    return results

def greedy_match(text: str, pattern: str) -> int:
    n, m = len(text), len(pattern)
    for i in range(n - m + 1):
        match = True
        for j in range(m):
            if text[i + j] != pattern[j]:
                match = False
                break
        if match:
            return i
    return -1
