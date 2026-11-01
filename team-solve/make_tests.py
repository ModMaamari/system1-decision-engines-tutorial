"""Generate sample tests for the extra tasks (islands, lis-count).
Usage: python3 make_tests.py   (writes tasks/<name>/tests/N.in|N.out)"""
import os, random
from collections import deque

MOD = 998244353

def islands(grid):
    R, C = len(grid), len(grid[0])
    seen, n = set(), 0
    for r in range(R):
        for c in range(C):
            if grid[r][c] == '#' and (r, c) not in seen:
                n += 1
                q = deque([(r, c)]); seen.add((r, c))
                while q:
                    y, x = q.popleft()
                    for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
                        ny, nx = y+dy, x+dx
                        if 0 <= ny < R and 0 <= nx < C and grid[ny][nx] == '#' and (ny, nx) not in seen:
                            seen.add((ny, nx)); q.append((ny, nx))
    return n

def lis_count(a):
    n = len(a)
    length, count = [1]*n, [1]*n
    for i in range(n):
        for j in range(i):
            if a[j] < a[i]:
                if length[j] + 1 > length[i]:
                    length[i], count[i] = length[j] + 1, count[j]
                elif length[j] + 1 == length[i]:
                    count[i] = (count[i] + count[j]) % MOD
    best = max(length)
    return sum(c for l, c in zip(length, count) if l == best) % MOD

def write(task, cases):
    d = os.path.join('tasks', task, 'tests'); os.makedirs(d, exist_ok=True)
    for i, (inp, out) in enumerate(cases, 1):
        open(os.path.join(d, f'{i}.in'), 'w').write(inp)
        open(os.path.join(d, f'{i}.out'), 'w').write(f'{out}\n')

rnd = random.Random(7)

# islands: hand-checked cases plus random grids
isl = [("3 3\n###\n.#.\n###\n", 1), ("2 4\n#.#.\n#.#.\n", 2), ("1 1\n.\n", 0), ("2 2\n##\n##\n", 1)]
for _ in range(6):
    R, C = rnd.randint(1, 8), rnd.randint(1, 8)
    g = [''.join(rnd.choice('#.') for _ in range(C)) for _ in range(R)]
    isl.append((f"{R} {C}\n" + '\n'.join(g) + '\n', islands(g)))
write('islands', isl)

# lis-count: hand-checked cases plus random arrays (cross-checked by brute force for small n)
import itertools
def brute(a):
    best, cnt = 0, 0
    for k in range(1, len(a)+1):
        for idx in itertools.combinations(range(len(a)), k):
            v = [a[i] for i in idx]
            if all(v[i] < v[i+1] for i in range(len(v)-1)):
                if k > best: best, cnt = k, 1
                elif k == best: cnt += 1
    return cnt % MOD
hand = [([1, 3, 2, 4], 2), ([5, 4, 3], 3), ([2, 2, 2], 3), ([1, 2, 1, 2], 3)]
for a, o in hand:
    assert lis_count(a) == o == brute(a), (a, o)
lis = list(hand)
for _ in range(6):
    n = rnd.randint(1, 9)
    a = [rnd.randint(1, 6) for _ in range(n)]
    assert lis_count(a) == brute(a), a
    lis.append((a, lis_count(a)))
write('lis-count', [(f"{len(a)}\n" + ' '.join(map(str, a)) + '\n', o) for a, o in lis])
print('ok')
