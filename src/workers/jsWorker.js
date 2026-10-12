// jsWorker.js — High-precision offline JavaScript test runner with LeetCode data structures and TLE enforcement

const PREAMBLE = `
function ListNode(val, next) {
    this.val = (val === undefined ? 0 : val);
    this.next = (next === undefined ? null : next);
}

function TreeNode(val, left, right) {
    this.val = (val === undefined ? 0 : val);
    this.left = (left === undefined ? null : left);
    this.right = (right === undefined ? null : right);
}

function listToLinked(arr) {
    if (!arr || arr.length === 0) return null;
    const head = new ListNode(arr[0]);
    let curr = head;
    for (let i = 1; i < arr.length; i++) {
        curr.next = new ListNode(arr[i]);
        curr = curr.next;
    }
    return head;
}

function linkedToList(node) {
    const res = [];
    let curr = node;
    while (curr) {
        res.push(curr.val);
        curr = curr.next;
    }
    return res;
}

function listToTree(arr) {
    if (!arr || arr.length === 0 || arr[0] === null) return null;
    const root = new TreeNode(arr[0]);
    const queue = [root];
    let i = 1;
    while (queue.length > 0 && i < arr.length) {
        const node = queue.shift();
        if (i < arr.length && arr[i] !== null) {
            node.left = new TreeNode(arr[i]);
            queue.push(node.left);
        }
        i++;
        if (i < arr.length && arr[i] !== null) {
            node.right = new TreeNode(arr[i]);
            queue.push(node.right);
        }
        i++;
    }
    return root;
}

function treeToList(root) {
    if (!root) return [];
    const res = [];
    const queue = [root];
    while (queue.length > 0) {
        const node = queue.shift();
        if (node) {
            res.push(node.val);
            queue.push(node.left);
            queue.push(node.right);
        } else {
            res.push(null);
        }
    }
    while (res.length > 0 && res[res.length - 1] === null) res.pop();
    return res;
}

function __isEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (typeof a !== typeof b) return false;
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (!__isEqual(a[i], b[i])) return false;
        }
        return true;
    }
    if (typeof a === 'object' && typeof b === 'object') {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        for (const k of keysA) {
            if (!__isEqual(a[k], b[k])) return false;
        }
        return true;
    }
    return false;
}
`;

self.onmessage = function (e) {
    const { code, testCases } = e.data;

    const capturedLogs = [];
    try {
        const originalLog = console.log;
        console.log = (...args) => {
            capturedLogs.push(args.map(a => String(a)).join(' '));
            originalLog.apply(console, args);
        };

        if (!testCases || testCases.length === 0) {
            const t0 = performance.now();
            eval(`${PREAMBLE}\n${code}`);
            const t1 = performance.now();
            self.postMessage({
                type: 'success',
                totalDurationMs: t1 - t0,
                logs: capturedLogs.join('\n')
            });
            return;
        }

        const runnerCode = `
            ${PREAMBLE}
            ${code};

            const __results = [];
            const __testCases = ${JSON.stringify(testCases)};
            let __totalCodeTimeMs = 0;
            const __MAX_TIME_PER_TEST_MS = 1200;

            for (let i = 0; i < __testCases.length; i++) {
                const __tStart = performance.now();
                try {
                    let result = eval(__testCases[i]);
                    const __tEnd = performance.now();
                    const __durationMs = __tEnd - __tStart;
                    __totalCodeTimeMs += __durationMs;

                    if (__durationMs > __MAX_TIME_PER_TEST_MS) {
                        __results.push({
                            testId: i,
                            passed: false,
                            durationMs: __durationMs,
                            error: 'Time Limit Exceeded (>1200ms). Suboptimal time complexity detected.'
                        });
                        break;
                    }

                    __results.push({
                        testId: i,
                        passed: true,
                        durationMs: __durationMs,
                        actualOutput: result
                    });
                } catch (err) {
                    const __tEnd = performance.now();
                    const __durationMs = __tEnd - __tStart;
                    __totalCodeTimeMs += __durationMs;

                    __results.push({
                        testId: i,
                        passed: false,
                        durationMs: __durationMs,
                        error: err.toString()
                    });
                }
            }
            ({ results: __results, totalDurationMs: __totalCodeTimeMs });
        `;

        const { results, totalDurationMs } = eval(runnerCode);
        self.postMessage({
            type: 'success',
            results,
            totalDurationMs,
            logs: capturedLogs.join('\n')
        });
    } catch (error) {
        self.postMessage({
            type: 'error',
            error: error.toString(),
            logs: capturedLogs.join('\n')
        });
    }
};
