#!/usr/bin/env python3
"""
build_beginner.py - Builds beginner.json with curated Easy problems for beginners.
"""

import json
import os
import re
import time
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_neetcode150 import fetch_problem, clean_python_starter, get_starter
from testcase_generator import generate_test_cases, parse_example_inputs

EXTRA_BEGINNER_SLUGS = [
    ("palindrome-number", "Math"),
    ("roman-to-integer", "String"),
    ("fizz-buzz", "Math"),
    ("reverse-string", "Two Pointers"),
    ("move-zeroes", "Arrays"),
    ("majority-element", "Arrays"),
    ("remove-duplicates-from-sorted-array", "Arrays"),
    ("remove-element", "Arrays"),
    ("search-insert-position", "Binary Search"),
    ("length-of-last-word", "String"),
    ("sqrtx", "Math"),
    ("merge-sorted-array", "Arrays"),
    ("power-of-two", "Bit Manipulation"),
    ("ransom-note", "String"),
    ("symmetric-tree", "Trees"),
]

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    neetcode_path = os.path.join(script_dir, "neetcode150.json")
    out_path = os.path.join(script_dir, "beginner.json")

    beginner_problems = []
    seen_ids = set()

    # 1. Grab all Easy problems from neetcode150
    if os.path.exists(neetcode_path):
        with open(neetcode_path, "r", encoding="utf-8") as f:
            all_nc = json.load(f)
            for p in all_nc:
                if p.get("difficulty") == "Easy" and p["id"] not in seen_ids:
                    beginner_problems.append(p)
                    seen_ids.add(p["id"])

    print(f"Collected {len(beginner_problems)} Easy problems from NeetCode 150.")

    # 2. Fetch extra classic beginner staples
    for slug, topic in EXTRA_BEGINNER_SLUGS:
        print(f"Fetching {slug} ...", end=" ", flush=True)
        try:
            q = fetch_problem(slug)
            if not q:
                print("SKIPPED")
                continue
            qid = int(q["questionId"])
            if qid in seen_ids:
                print(f"Already in dataset (ID: {qid})")
                continue

            meta = json.loads(q.get("metaData") or "{}")
            func_name = meta.get("name", slug.replace("-", "_"))
            params = meta.get("params", [])
            return_t = (meta.get("return") or {}).get("type", "void")
            raw_ex = q.get("exampleTestcases", "")
            examples = parse_example_inputs(raw_ex, params) if params else []

            tests = generate_test_cases(func_name, params, return_t, examples, num_tests=10)

            item = {
                "id": qid,
                "title": q["title"],
                "difficulty": "Easy",
                "topic": topic,
                "description": q.get("content") or "",
                "starterCode": {
                    "python": clean_python_starter(get_starter(q.get("codeSnippets"), "python3")),
                    "javascript": get_starter(q.get("codeSnippets"), "javascript"),
                },
                "testCases": tests,
                "hints": q.get("hints") or [],
            }
            beginner_problems.append(item)
            seen_ids.add(qid)
            print(f"SUCCESS (ID: {qid})")
        except Exception as e:
            print(f"FAILED ({e})")
        time.sleep(0.3)

    # Sort beginner problems logically: by ID or simplicity
    beginner_problems.sort(key=lambda x: x["id"])

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(beginner_problems, f, indent=2, ensure_ascii=False)

    print(f"\nDone! Saved {len(beginner_problems)} beginner problems to {out_path}")

if __name__ == "__main__":
    main()
