# Problem: Count Islands

You are given a grid of R rows and C columns. Each cell is '#' (land) or '.' (water).
An island is a maximal set of land cells that are connected horizontally or vertically
(4-directional; diagonal cells do not connect).

Print the number of islands.

## Input
The first line contains R and C (1 ≤ R, C ≤ 1000). Each of the next R lines contains
exactly C characters, each '#' or '.'.

## Output
One integer: the number of islands.

## Examples
Input: 3 3 / ### / .#. / ###  → Output: 1
Input: 2 4 / #.#. / #.#.      → Output: 2
Input: 1 1 / .                → Output: 0

Write the program as solution.py reading stdin and printing the answer.
