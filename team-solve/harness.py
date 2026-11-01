#!/usr/bin/env python3
"""team-solve harness: the GVS5H team method as a small DAG over an
OpenAI-compatible chat endpoint. Stdlib only.

  plan -> (ideate-a || ideate-b) -> solve -> test -> review -> [repair] -> verify

Every role is a fresh chat call. Roles see each other only through files in the
run directory (the ledger), never through chat history. The prompts follow
memdoor's examples/workflows/team-solve/steps/*.yaml.

Config (env, never written to disk by this script):
  LLM_BASE_URL  default https://llms.innkube.fim.uni-passau.de/v1
  LLM_API_KEY   required
  LLM_MODEL     default qwen38-27b

Usage: python3 harness.py TASK_DIR RUN_DIR
"""
import json, os, re, subprocess, sys, shutil, time, urllib.request
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.environ.get('LLM_BASE_URL', 'https://llms.innkube.fim.uni-passau.de/v1').rstrip('/')
KEY = os.environ.get('LLM_API_KEY', '')
MODEL = os.environ.get('LLM_MODEL', 'qwen38-27b')
MAX_TOKENS = int(os.environ.get('LLM_MAX_TOKENS', '16000'))
# Temperatures from the GVS5H harness (plan 0.3, ideation 0.4, manager/worker 0.2).
TEMP = {'plan': 0.3, 'ideate': 0.4, 'solve': 0.2, 'review': 0.2, 'repair': 0.2}

def chat(role, system, user):
    body = {'model': MODEL, 'temperature': TEMP[role], 'top_p': 0.95, 'max_tokens': MAX_TOKENS,
            'messages': [{'role': 'system', 'content': system}, {'role': 'user', 'content': user}],
            # Thinking off: the bench showed it is the only setting that answers reliably
            # and quickly on this host. Set LLM_THINK=1 to leave it on.
            'chat_template_kwargs': {'enable_thinking': os.environ.get('LLM_THINK') == '1'}}
    req = urllib.request.Request(BASE + '/chat/completions', data=json.dumps(body).encode(),
                                 headers={'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=900) as r:
                d = json.load(r)
            ch = d['choices'][0]
            text = ch['message'].get('content') or ''
            if not text.strip():  # a reply with no text: answered by its reasoning, as in GVS5H
                text = ch['message'].get('reasoning_content') or ''
            return text, ch.get('finish_reason')
        except Exception as e:
            if attempt == 2: raise
            time.sleep(5 * (attempt + 1))

def read(p):
    return open(p).read() if os.path.exists(p) else '(missing)'

def last_python_block(text):
    blocks = re.findall(r"```(?:python|py)?[ \t]*\n(.*?)```", text, re.S)
    return blocks[-1].rstrip() + '\n' if blocks else None

SYS = ("You are one member of a small team. You have no memory of other conversations; "
       "everything you need is in the files provided below. Do not spawn agents. Answer with "
       "the requested content only.")

def run_step(name, run, system_extra, user):
    text, fin = chat(name.split('-')[0] if name.startswith('ideate') else name,
                     SYS + '\n' + system_extra, user)
    open(os.path.join(run, f'{name}.reply.md'), 'w').write(text)
    print(f'  [{name}] finish={fin} chars={len(text)}', flush=True)
    return text

def main(task_dir, run_dir):
    task_dir, run_dir = os.path.abspath(task_dir), os.path.abspath(run_dir)
    if os.path.exists(run_dir): shutil.rmtree(run_dir)
    os.makedirs(run_dir)
    shutil.copy(os.path.join(HERE, 'check-samples.sh'), run_dir)
    shutil.copy(os.path.join(task_dir, 'task.md'), run_dir)
    shutil.copytree(os.path.join(task_dir, 'tests'), os.path.join(run_dir, 'tests'))
    W = lambda f: os.path.join(run_dir, f)
    task = read(W('task.md'))
    t0 = time.time()

    # 1. plan
    print('plan', flush=True)
    plan = run_step('plan', run_dir,
        "Write plan.md: the decomposition, correctness requirements, two or three candidate "
        "algorithms with time/space complexity, and instructions for the ideators, solver and "
        "reviewer. Do not solve the problem in full. Output the content of plan.md in one ```markdown block.",
        f"TASK (task.md):\n{task}")
    open(W('plan.md'), 'w').write(plan.strip() + '\n')

    # 2. ideate-a and ideate-b in parallel; the harness does the ledger insertion, so
    #    the two writers cannot clash.
    print('ideate-a || ideate-b', flush=True)
    ideate_prompt = lambda letter, family: (
        f"You are independent ideator {letter}. Develop one concrete proposal: {family}. "
        "Include pseudocode, the invariant or correctness reasoning, complexity, and edge cases "
        "(off-by-one, overflow). Output only the proposal as markdown.")
    jobs = {'ideate-a': ideate_prompt('A', 'the most direct algorithm you can prove meets the constraints'),
            'ideate-b': ideate_prompt('B', 'an alternative from a different family of technique than the most obvious one, compared with the obvious approach')}
    with ThreadPoolExecutor(2) as ex:
        futs = {n: ex.submit(run_step, n, run_dir, '', f"{p}\n\nTASK:\n{task}\n\nPLAN:\n{plan}") for n, p in jobs.items()}
        props = {n: f.result() for n, f in futs.items()}
    notes = (f"# Notes\n\nRun: {os.path.basename(run_dir)}\n\n## Proposal A\n<!-- proposal-a -->\n"
             f"{props['ideate-a'].strip()}\n\n## Proposal B\n<!-- proposal-b -->\n{props['ideate-b'].strip()}\n\n"
             "## Solver decision\n\n## Review\n\n## Repair\n")
    open(W('notes.md'), 'w').write(notes)

    # 3. solve
    print('solve', flush=True)
    sol_reply = run_step('solve', run_dir,
        "You are the solver. Select and justify one approach from the two proposals, with a brief "
        "correctness argument and complexity. Then write the complete solution.py using only the Python "
        "standard library: read stdin, print only the answer. Put the code in ONE ```python block at the end.",
        f"TASK:\n{task}\n\nPLAN:\n{plan}\n\nNOTES (both proposals):\n{notes}")
    code = last_python_block(sol_reply)
    if code is None:
        print('  solver produced no python block', flush=True)
        code = ''
    open(W('solution.py'), 'w').write(code)
    open(W('notes.md'), 'a').write('\n### Solver\n' + sol_reply.strip() + '\n')

    # 4. test (never fails the run; records the status)
    def samples():
        r = subprocess.run(['bash', 'check-samples.sh'], cwd=run_dir, capture_output=True, text=True, timeout=600)
        open(W('test-output.log'), 'w').write(r.stdout + r.stderr)
        open(W('test-status.txt'), 'w').write(f'{r.returncode}\n')
        return r.returncode
    status = samples()
    print(f'test: initial status {status}', flush=True)

    # 5. review, then at most one repair round, then the strict verify
    if status != 0:
        print('review', flush=True)
        review = run_step('review', run_dir,
            "You are the manager/reviewer. Inspect the actual captured sample results below. Describe the "
            "result, and for failing samples give concrete repair instructions for one fresh worker. Do not "
            "write code. Do not alter the test data or bypass comparison failures.",
            f"TASK:\n{task}\n\nSOLUTION:\n{code}\n\nTEST OUTPUT:\n{read(W('test-output.log'))}")
        open(W('review.md'), 'w').write(review)
        open(W('notes.md'), 'a').write('\n### Review\n' + review.strip() + '\n')

        print('repair', flush=True)
        rep = run_step('repair', run_dir,
            "You are the single repair worker. Correct solution.py using the reviewer's instructions. "
            "Output the complete corrected program in ONE ```python block. Do not change the tests.",
            f"TASK:\n{task}\n\nCURRENT SOLUTION:\n{code}\n\nREVIEW:\n{review}\n\nTEST OUTPUT:\n{read(W('test-output.log'))}")
        fixed = last_python_block(rep)
        if fixed:
            open(W('solution.py'), 'w').write(fixed)
            open(W('notes.md'), 'a').write('\n### Repair\n' + rep.strip() + '\n')
        else:
            print('  repair produced no python block; keeping solution', flush=True)
        samples()  # the status file records the post-repair result too

    # 6. verify: strict, fails the run on any sample failure
    final = subprocess.run(['bash', 'check-samples.sh'], cwd=run_dir, capture_output=True, text=True, timeout=600)
    open(W('final-test-output.log'), 'w').write(final.stdout + final.stderr)
    verdict = 'PASS' if final.returncode == 0 else 'FAIL'
    print(f'verify: {verdict} ({time.time()-t0:.0f}s)', flush=True)
    print(final.stdout.strip().splitlines()[-1] if final.stdout.strip() else '', flush=True)
    return final.returncode

if __name__ == '__main__':
    if not KEY:
        sys.exit('set LLM_API_KEY in the environment')
    sys.exit(main(sys.argv[1], sys.argv[2]))
