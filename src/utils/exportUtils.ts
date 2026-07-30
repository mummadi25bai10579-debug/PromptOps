import { PromptHistoryItem } from '../types';

/**
Helper to trigger file download in browser
*/
const downloadBlob = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
Export prompt history items to JSON format
*/
export const exportToJSON = (items: PromptHistoryItem[], filename = 'prompt-history.json') => {
  const exportData = items.map(item => ({
    id: item.id,
    prompt: item.prompt,
    negativePrompt: item.negativePrompt || '',
    type: item.type,
    model: item.model,
    provider: item.provider || 'PromptOps AI',
    status: item.status,
    duration: item.duration || 'N/A',
    favorite: !!item.favorite,
    createdAt: item.createdAt?.toMillis ? new Date(item.createdAt.toMillis()).toISOString() : new Date(item.createdAt || Date.now()).toISOString(),
    settings: item.settings || item.parameters || {},
    tokens: item.tokens || {},
    resultUrl: item.resultUrl || item.fileUrl || item.b2Url || '',
  }));

  const jsonString = JSON.stringify(exportData, null, 2);
  downloadBlob(jsonString, filename, 'application/json');
};

/**
Export prompt history items to CSV format
*/
export const exportToCSV = (items: PromptHistoryItem[], filename = 'prompt-history.csv') => {
  const headers = ['ID', 'Prompt', 'Type', 'Model', 'Status', 'Duration', 'Favorite', 'Created At', 'Result URL'];
  
  const escapeCSV = (field: any) => {
    if (field === null || field === undefined) return '""';
    const stringified = String(field).replace(/"/g, '""');
    return `"${stringified}"`;
  };

  const rows = items.map(item => [
    escapeCSV(item.id),
    escapeCSV(item.prompt),
    escapeCSV(item.type),
    escapeCSV(item.model),
    escapeCSV(item.status),
    escapeCSV(item.duration || 'N/A'),
    escapeCSV(item.favorite ? 'Yes' : 'No'),
    escapeCSV(item.createdAt?.toMillis ? new Date(item.createdAt.toMillis()).toLocaleString() : new Date(item.createdAt || Date.now()).toLocaleString()),
    escapeCSV(item.resultUrl || item.fileUrl || item.b2Url || '')
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
};

/**
Export prompt history items to clean TXT format
*/
export const exportToTXT = (items: PromptHistoryItem[], filename = 'prompt-history.txt') => {
  const content = items.map((item, index) => {
    const dateStr = item.createdAt?.toMillis 
      ? new Date(item.createdAt.toMillis()).toLocaleString() 
      : new Date(item.createdAt || Date.now()).toLocaleString();

    return `=== PROMPT #${index + 1} ===
ID: ${item.id}
Date: ${dateStr}
Type: ${item.type.toUpperCase()}
Model: ${item.model}
Status: ${item.status}
Duration: ${item.duration || 'N/A'}
Favorite: ${item.favorite ? 'Starred' : 'No'}

[PROMPT]
${item.prompt}

${item.negativePrompt ? `[NEGATIVE PROMPT]\n${item.negativePrompt}\n` : ''}${item.resultUrl || item.fileUrl ? `[RESULT URL]\n${item.resultUrl || item.fileUrl}\n` : ''}----------------------------------------`;
  }).join('\n\n');

  downloadBlob(content, filename, 'text/plain;charset=utf-8;');
};
