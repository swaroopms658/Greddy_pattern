# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MatchRequest(BaseModel):
    text: str
    patterns: List[str]
    algorithm: Optional[str] = "greedy"  # "greedy", "kmp", "boyer_moore"
    case_sensitive: Optional[bool] = True

class MatchResult(BaseModel):
    pattern: str
    index: int
    comparisons: int
    time_ms: float

@app.post("/match", response_model=List[MatchResult])
def match_patterns(data: MatchRequest):
    results = []
    text = data.text if data.case_sensitive else data.text.lower()
    
    for pattern in data.patterns:
        pattern_to_use = pattern if data.case_sensitive else pattern.lower()
        start_time = time.perf_counter()

        if data.algorithm == "kmp":
            index, comparisons = kmp_match(text, pattern_to_use)
        elif data.algorithm == "boyer_moore":
            index, comparisons = boyer_moore_match(text, pattern_to_use)
        else:
            index, comparisons = greedy_match(text, pattern_to_use)

        end_time = time.perf_counter()
        duration_ms = (end_time - start_time) * 1000

        results.append(MatchResult(
            pattern=pattern,
            index=index,
            comparisons=comparisons,
            time_ms=round(duration_ms, 3)
        ))
    return results

def greedy_match(text: str, pattern: str) -> (int, int):
    n, m = len(text), len(pattern)
    comparisons = 0
    for i in range(n - m + 1):
        match = True
        for j in range(m):
            comparisons += 1
            if text[i + j] != pattern[j]:
                match = False
                break
        if match:
            return i, comparisons
    return -1, comparisons

def kmp_match(text: str, pattern: str) -> (int, int):
    comparisons = 0

    def compute_lps(pat: str):
        nonlocal comparisons
        lps = [0] * len(pat)
        length = 0
        i = 1
        while i < len(pat):
            comparisons += 1
            if pat[i] == pat[length]:
                length += 1
                lps[i] = length
                i += 1
            else:
                if length != 0:
                    length = lps[length - 1]
                else:
                    lps[i] = 0
                    i += 1
        return lps

    lps = compute_lps(pattern)

    i = j = 0
    while i < len(text):
        comparisons += 1
        if pattern[j] == text[i]:
            i += 1
            j += 1
        if j == len(pattern):
            return i - j, comparisons
        elif i < len(text) and pattern[j] != text[i]:
            if j != 0:
                j = lps[j - 1]
            else:
                i += 1
    return -1, comparisons


def boyer_moore_match(text: str, pattern: str) -> (int, int):
    comparisons = 0
    m = len(pattern)
    n = len(text)

    if m == 0:
        return 0, comparisons

    bad_char = [-1] * 256
    for i in range(m):
        bad_char[ord(pattern[i])] = i

    s = 0
    while s <= n - m:
        j = m - 1
        while j >= 0:
            comparisons += 1
            if pattern[j] != text[s + j]:
                break
            j -= 1
        if j < 0:
            return s, comparisons
        else:
            shift = max(1, j - bad_char[ord(text[s + j])])
            s += shift
    return -1, comparisons