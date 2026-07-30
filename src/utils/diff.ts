export type DiffPart = {
  text: string;
  type: 'added' | 'removed' | 'unchanged';
};

export const computeWordDiff = (oldStr: string = '', newStr: string = ''): DiffPart[] => {
  const oldWords = oldStr.trim().split(/\s+/).filter(Boolean);
  const newWords = newStr.trim().split(/\s+/).filter(Boolean);

  if (oldWords.length === 0 && newWords.length === 0) return [];
  if (oldWords.length === 0) {
    return newWords.map(word => ({ text: word, type: 'added' }));
  }
  if (newWords.length === 0) {
    return oldWords.map(word => ({ text: word, type: 'removed' }));
  }

  // DP table for Longest Common Subsequence (LCS)
  const dp: number[][] = Array(oldWords.length + 1)
    .fill(0)
    .map(() => Array(newWords.length + 1).fill(0));

  for (let i = 1; i <= oldWords.length; i++) {
    for (let j = 1; j <= newWords.length; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const diff: DiffPart[] = [];
  let i = oldWords.length;
  let j = newWords.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      diff.unshift({ text: oldWords[i - 1], type: 'unchanged' });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.unshift({ text: newWords[j - 1], type: 'added' });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      diff.unshift({ text: oldWords[i - 1], type: 'removed' });
      i--;
    }
  }

  return diff;
};

export const computeLineDiff = (oldText: string = '', newText: string = ''): { line: string; type: 'added' | 'removed' | 'unchanged'; oldLineNum?: number; newLineNum?: number }[] => {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  const result: { line: string; type: 'added' | 'removed' | 'unchanged'; oldLineNum?: number; newLineNum?: number }[] = [];
  let oldIdx = 0;
  let newIdx = 0;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    const oldL = oldLines[oldIdx];
    const newL = newLines[newIdx];

    if (oldL === newL) {
      result.push({ line: oldL || '', type: 'unchanged', oldLineNum: oldIdx + 1, newLineNum: newIdx + 1 });
      oldIdx++;
      newIdx++;
    } else if (newIdx < newLines.length && !oldLines.includes(newL)) {
      result.push({ line: newL, type: 'added', newLineNum: newIdx + 1 });
      newIdx++;
    } else if (oldIdx < oldLines.length && !newLines.includes(oldL)) {
      result.push({ line: oldL, type: 'removed', oldLineNum: oldIdx + 1 });
      oldIdx++;
    } else {
      // Fallback
      if (oldL !== undefined) {
        result.push({ line: oldL, type: 'removed', oldLineNum: oldIdx + 1 });
        oldIdx++;
      }
      if (newL !== undefined) {
        result.push({ line: newL, type: 'added', newLineNum: newIdx + 1 });
        newIdx++;
      }
    }
  }

  return result;
};

export const computeTextStats = (text: string = '') => {
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lineCount = text ? text.split('\n').length : 0;
  const estimatedTokens = Math.ceil(wordCount * 1.33);

  return { charCount, wordCount, lineCount, estimatedTokens };
};
