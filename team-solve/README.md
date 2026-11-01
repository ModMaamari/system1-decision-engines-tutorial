# team-solve harness

A stdlib-only Python port of the team-solve method from
[memdoor's examples](https://github.com/guregodevo/memdoor/tree/main/examples/workflows/team-solve)
(GVS5H-style team loop), pointed at an OpenAI-compatible endpoint serving `qwen38-27b`.

    plan -> (ideate-a || ideate-b) -> solve -> test -> review -> [repair if failing] -> verify

Each role is a fresh chat call. Roles share state only through files in the run
directory. The harness does the ledger insertion itself, so the two ideators cannot
clobber each other. Prompts follow the memdoor step YAML files. Thinking is off by
default (`LLM_THINK=1` turns it on).

## Run

    export LLM_API_KEY=...                       # never commit this
    export LLM_BASE_URL=https://llms.innkube.fim.uni-passau.de/v1   # default
    python3 harness.py tasks/balanced /path/to/run-dir
    echo $?   # 0 when every sample passes

A task is `task.md` plus `tests/N.in` / `tests/N.out`. `make_tests.py` regenerates the
tests for `islands` and `lis-count`, and cross-checks `lis-count` against brute force.

## Tasks included

| task | what | samples |
|---|---|---|
| `balanced` | count balanced substrings over {a,b,c} (N ≤ 200000) | 5 |
| `islands` | count 4-connected islands in a grid | 10 |
| `lis-count` | count longest strictly increasing subsequences mod 998244353 | 10 |

## Results (qwen38-27b, thinking off)

All three passed on the first attempt, so the repair round did not run.
Held-out check, separate from the samples: 300 random inputs per task against an
independent reference, 0 mismatches each. `balanced` at N=200000 ran in 0.12 s.

The repair branch is implemented but not exercised by these tasks.
