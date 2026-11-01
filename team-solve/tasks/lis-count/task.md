# Problem: Count Longest Increasing Subsequences

You are given an array A of N integers. Consider subsequences (choose indices i1 < i2 < ... < ik)
whose values are strictly increasing. Let L be the maximum length of such a subsequence.

Print the number of strictly increasing subsequences of length L, modulo 998244353.
Two subsequences are different if their index sets differ.

## Input
The first line contains N (1 ≤ N ≤ 2000). The second line contains N integers A_i
(1 ≤ A_i ≤ 10^9).

## Output
One integer: the count modulo 998244353.

## Examples
Input: 4 / 1 3 2 4  → Output: 2   (L = 3: 1 3 4 and 1 2 4)
Input: 3 / 5 4 3    → Output: 3   (every single element is a longest subsequence of length 1)
Input: 3 / 2 2 2    → Output: 3
Input: 4 / 1 2 1 2  → Output: 3

Write the program as solution.py reading stdin and printing the answer.
