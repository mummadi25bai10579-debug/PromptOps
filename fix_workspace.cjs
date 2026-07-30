const fs = require('fs');
let content = fs.readFileSync('src/pages/Workspace/Workspace.tsx', 'utf8');

// Undo the sed:
content = content.replace(
  /<\/button>\n                       <button onClick={handleGenerateAudio} disabled={\["thinking", "generating", "formatting"\].includes\(audioStatus\)} className="p-2 hover:bg-white\/10 rounded-lg text-slate-400 hover:text-white transition-colors" title="Regenerate"><RotateCw className="w-4 h-4" \/><\/button>\n                       <button onClick={handleClearAudio} className="p-2 hover:bg-red-500\/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors" title="Clear"><Trash2 className="w-4 h-4" \/>/g,
  '<Trash2 className="w-4 h-4" />'
);

fs.writeFileSync('src/pages/Workspace/Workspace.tsx', content);
