#!/usr/bin/env python3
"""
build_neetcode150.py - Builds neetcode150.json by reusing existing blind75.json
and fetching the remaining ~75 NeetCode 150 problems from LeetCode.
"""

import json
import time
import re
import os
import urllib.request
import urllib.error
from testcase_generator import generate_test_cases, parse_example_inputs

LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql"
QUERY = """
query getProblem($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionId
    title
    difficulty
    content
    codeSnippets {
      lang
      langSlug
      code
    }
    exampleTestcases
    metaData
    hints
  }
}
"""

NEETCODE_150_CONFIG = [
    # Arrays & Hashing
    ("contains-duplicate", "Arrays"),
    ("valid-anagram", "String"),
    ("two-sum", "Arrays"),
    ("group-anagrams", "Arrays"),
    ("top-k-frequent-elements", "Heap"),
    ("product-of-array-except-self", "Arrays"),
    ("valid-sudoku", "Matrix"),
    ("encode-and-decode-strings", "String"),
    ("longest-consecutive-sequence", "Arrays"),

    # Two Pointers
    ("valid-palindrome", "String"),
    ("two-sum-ii-input-array-is-sorted", "Arrays"),
    ("3sum", "Arrays"),
    ("container-with-most-water", "Arrays"),
    ("trapping-rain-water", "Arrays"),

    # Sliding Window
    ("best-time-to-buy-and-sell-stock", "Sliding Window"),
    ("longest-substring-without-repeating-characters", "Sliding Window"),
    ("longest-repeating-character-replacement", "Sliding Window"),
    ("permutation-in-string", "Sliding Window"),
    ("minimum-window-substring", "Sliding Window"),
    ("sliding-window-maximum", "Sliding Window"),

    # Stack
    ("valid-parentheses", "String"),
    ("min-stack", "Stack"),
    ("evaluate-reverse-polish-notation", "Stack"),
    ("generate-parentheses", "Stack"),
    ("daily-temperatures", "Stack"),
    ("car-fleet", "Stack"),
    ("largest-rectangle-in-histogram", "Stack"),

    # Binary Search
    ("binary-search", "Binary Search"),
    ("search-a-2d-matrix", "Binary Search"),
    ("koko-eating-bananas", "Binary Search"),
    ("find-minimum-in-rotated-sorted-array", "Binary Search"),
    ("search-in-rotated-sorted-array", "Binary Search"),
    ("time-based-key-value-store", "Binary Search"),
    ("median-of-two-sorted-arrays", "Binary Search"),

    # Linked List
    ("reverse-linked-list", "Linked List"),
    ("merge-two-sorted-lists", "Linked List"),
    ("reorder-list", "Linked List"),
    ("remove-nth-node-from-end-of-list", "Linked List"),
    ("copy-list-with-random-pointer", "Linked List"),
    ("add-two-numbers", "Linked List"),
    ("linked-list-cycle", "Linked List"),
    ("find-the-duplicate-number", "Linked List"),
    ("lru-cache", "Linked List"),
    ("merge-k-sorted-lists", "Linked List"),
    ("reverse-nodes-in-k-group", "Linked List"),

    # Trees
    ("invert-binary-tree", "Trees"),
    ("maximum-depth-of-binary-tree", "Trees"),
    ("diameter-of-binary-tree", "Trees"),
    ("balanced-binary-tree", "Trees"),
    ("same-tree", "Trees"),
    ("subtree-of-another-tree", "Trees"),
    ("lowest-common-ancestor-of-a-binary-search-tree", "Trees"),
    ("binary-tree-level-order-traversal", "Trees"),
    ("binary-tree-right-side-view", "Trees"),
    ("count-good-nodes-in-binary-tree", "Trees"),
    ("validate-binary-search-tree", "Trees"),
    ("kth-smallest-element-in-a-bst", "Trees"),
    ("construct-binary-tree-from-preorder-and-inorder-traversal", "Trees"),
    ("binary-tree-maximum-path-sum", "Trees"),
    ("serialize-and-deserialize-binary-tree", "Trees"),

    # Tries
    ("implement-trie-prefix-tree", "Trie"),
    ("design-add-and-search-words-data-structure", "Trie"),
    ("word-search-ii", "Trie"),

    # Heap / Priority Queue
    ("kth-largest-element-in-a-stream", "Heap"),
    ("last-stone-weight", "Heap"),
    ("k-closest-points-to-origin", "Heap"),
    ("kth-largest-element-in-an-array", "Heap"),
    ("task-scheduler", "Heap"),
    ("design-twitter", "Heap"),
    ("find-median-from-data-stream", "Heap"),

    # Backtracking
    ("subsets", "Backtracking"),
    ("combination-sum", "Backtracking"),
    ("permutations", "Backtracking"),
    ("subsets-ii", "Backtracking"),
    ("combination-sum-ii", "Backtracking"),
    ("word-search", "Backtracking"),
    ("palindrome-partitioning", "Backtracking"),
    ("letter-combinations-of-a-phone-number", "Backtracking"),
    ("n-queens", "Backtracking"),

    # Graphs
    ("number-of-islands", "Graphs"),
    ("clone-graph", "Graphs"),
    ("max-area-of-island", "Graphs"),
    ("pacific-atlantic-water-flow", "Graphs"),
    ("surrounded-regions", "Graphs"),
    ("rotting-oranges", "Graphs"),
    ("walls-and-gates", "Graphs"),
    ("course-schedule", "Graphs"),
    ("course-schedule-ii", "Graphs"),
    ("redundant-connection", "Graphs"),
    ("number-of-connected-components-in-an-undirected-graph", "Graphs"),
    ("graph-valid-tree", "Graphs"),
    ("word-ladder", "Graphs"),

    # Advanced Graphs
    ("reconstruct-itinerary", "Graphs"),
    ("min-cost-to-connect-all-points", "Graphs"),
    ("network-delay-time", "Graphs"),
    ("swim-in-rising-water", "Graphs"),
    ("alien-dictionary", "Graphs"),
    ("cheapest-flights-within-k-stops", "Graphs"),

    # 1-D Dynamic Programming
    ("climbing-stairs", "Dynamic Programming"),
    ("min-cost-climbing-stairs", "Dynamic Programming"),
    ("house-robber", "Dynamic Programming"),
    ("house-robber-ii", "Dynamic Programming"),
    ("longest-palindromic-substring", "Dynamic Programming"),
    ("palindromic-substrings", "Dynamic Programming"),
    ("decode-ways", "Dynamic Programming"),
    ("coin-change", "Dynamic Programming"),
    ("maximum-product-subarray", "Dynamic Programming"),
    ("word-break", "Dynamic Programming"),
    ("longest-increasing-subsequence", "Dynamic Programming"),
    ("partition-equal-subset-sum", "Dynamic Programming"),

    # 2-D Dynamic Programming
    ("unique-paths", "Dynamic Programming"),
    ("longest-common-subsequence", "Dynamic Programming"),
    ("best-time-to-buy-and-sell-stock-with-cooldown", "Dynamic Programming"),
    ("coin-change-ii", "Dynamic Programming"),
    ("target-sum", "Dynamic Programming"),
    ("interleaving-string", "Dynamic Programming"),
    ("longest-increasing-path-in-a-matrix", "Dynamic Programming"),
    ("distinct-subsequences", "Dynamic Programming"),
    ("edit-distance", "Dynamic Programming"),
    ("burst-balloons", "Dynamic Programming"),
    ("regular-expression-matching", "Dynamic Programming"),

    # Greedy
    ("maximum-subarray", "Greedy"),
    ("jump-game", "Greedy"),
    ("jump-game-ii", "Greedy"),
    ("gas-station", "Greedy"),
    ("hand-of-straights", "Greedy"),
    ("merge-triplets-to-form-target-triplet", "Greedy"),
    ("partition-labels", "Greedy"),
    ("valid-parenthesis-string", "Greedy"),

    # Intervals
    ("insert-interval", "Intervals"),
    ("merge-intervals", "Intervals"),
    ("non-overlapping-intervals", "Intervals"),
    ("meeting-rooms", "Intervals"),
    ("meeting-rooms-ii", "Intervals"),
    ("minimum-interval-to-include-each-query", "Intervals"),

    # Math & Geometry
    ("rotate-image", "Matrix"),
    ("spiral-matrix", "Matrix"),
    ("set-matrix-zeroes", "Matrix"),
    ("happy-number", "Math"),
    ("plus-one", "Math"),
    ("powx-n", "Math"),
    ("multiply-strings", "Math"),
    ("detect-squares", "Matrix"),

    # Bit Manipulation
    ("single-number", "Bit Manipulation"),
    ("number-of-1-bits", "Bit Manipulation"),
    ("counting-bits", "Bit Manipulation"),
    ("reverse-bits", "Bit Manipulation"),
    ("missing-number", "Bit Manipulation"),
    ("sum-of-two-integers", "Bit Manipulation"),
    ("reverse-integer", "Bit Manipulation"),
]

def clean_python_starter(code: str) -> str:
    """Strip 'class Solution:' wrapper and remove 'self' so functions are standalone."""
    if not code:
        return ""
    lines = code.splitlines()
    result = []
    inside_class = False
    for line in lines:
        if re.match(r'\s*class Solution\s*:', line):
            inside_class = True
            continue
        if inside_class and line.startswith('    '):
            line = line[4:]
        line = re.sub(r'\(self,\s*', '(', line)
        line = re.sub(r'\(self\)', '()', line)
        result.append(line)
    return '\n'.join(result).strip()

def fetch_problem(slug: str):
    payload = json.dumps({"query": QUERY, "variables": {"titleSlug": slug}}).encode()
    req = urllib.request.Request(
        LEETCODE_GRAPHQL_URL, data=payload,
        headers={
            "Content-Type": "application/json",
            "Referer": f"https://leetcode.com/problems/{slug}/",
            "User-Agent": "Mozilla/5.0",
        }, method="POST"
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read().decode())
    return data.get("data", {}).get("question")

def get_starter(snippets, lang_slug):
    for s in (snippets or []):
        if s["langSlug"] == lang_slug:
            return s["code"]
    return ""

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    blind75_path = os.path.join(script_dir, "blind75.json")
    out_path = os.path.join(script_dir, "neetcode150.json")

    existing_by_title = {}
    if os.path.exists(blind75_path):
        with open(blind75_path, "r", encoding="utf-8") as f:
            for item in json.load(f):
                norm_title = re.sub(r'[^a-zA-Z0-9]', '', item['title'].lower())
                existing_by_title[norm_title] = item

    print(f"Loaded {len(existing_by_title)} existing problems from blind75.json.")

    neetcode_problems = []
    total = len(NEETCODE_150_CONFIG)

    for idx, (slug, topic) in enumerate(NEETCODE_150_CONFIG, 1):
        norm_slug = re.sub(r'[^a-zA-Z0-9]', '', slug.lower())
        matched = None
        for k, v in existing_by_title.items():
            if norm_slug in k or k in norm_slug:
                matched = v
                break

        if matched:
            prob = dict(matched)
            prob['topic'] = topic
            neetcode_problems.append(prob)
            print(f"[{idx:03d}/{total}] Reused existing: {matched['title']} ({topic})")
            continue

        print(f"[{idx:03d}/{total}] Fetching from LeetCode: {slug} ...", end=" ", flush=True)
        try:
            q = fetch_problem(slug)
            if not q:
                print("SKIPPED (not found)")
                continue

            meta = json.loads(q.get("metaData") or "{}")
            func_name = meta.get("name", slug.replace("-", "_"))
            params = meta.get("params", [])
            return_t = (meta.get("return") or {}).get("type", "void")
            raw_ex = q.get("exampleTestcases", "")
            examples = parse_example_inputs(raw_ex, params) if params else []

            tests = generate_test_cases(func_name, params, return_t, examples, num_tests=12)

            hints = q.get("hints") or []

            item = {
                "id": int(q["questionId"]),
                "title": q["title"],
                "difficulty": q["difficulty"],
                "topic": topic,
                "description": q.get("content") or "",
                "starterCode": {
                    "python": clean_python_starter(get_starter(q.get("codeSnippets"), "python3")),
                    "javascript": get_starter(q.get("codeSnippets"), "javascript"),
                },
                "testCases": tests,
                "hints": hints,
            }
            neetcode_problems.append(item)
            print(f"SUCCESS (ID: {item['id']})")
        except Exception as e:
            print(f"FAILED ({e})")

        time.sleep(0.3)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(neetcode_problems, f, indent=2, ensure_ascii=False)

    print(f"\nCompleted! Written {len(neetcode_problems)} problems to {out_path}")

if __name__ == "__main__":
    main()
