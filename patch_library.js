const fs = require('fs');
let content = fs.readFileSync('src/pages/Library/Library.tsx', 'utf8');

// Update preview rendering (lines 490-510)
content = content.replace(
  `                 ) : (
                   <div className="flex flex-col items-center text-slate-500">
                     <FileText className="w-16 h-16 mb-4" />
                     <p>Preview not available for this asset type.</p>
                   </div>`,
  `                 ) : previewAsset.type === 'text' && previewAsset.generatedText ? (
                   <div className="w-full max-w-2xl h-full p-8 overflow-y-auto custom-scrollbar">
                     <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-slate-300 whitespace-pre-wrap leading-relaxed text-[15px]">
                       {previewAsset.generatedText}
                     </div>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center text-slate-500">
                     <FileText className="w-16 h-16 mb-4" />
                     <p>Preview not available for this asset type.</p>
                   </div>`
);

// Update download button inside preview (lines 515-520)
content = content.replace(
  `                  <div className="flex items-center gap-2">
                    {previewAsset.resultUrl && (
                      <button 
                        onClick={() => handleDownload(previewAsset.resultUrl!, previewAsset.fileName || 'asset')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20"
                      >`,
  `                  <div className="flex items-center gap-2">
                    {(previewAsset.resultUrl || previewAsset.generatedText) && (
                      <button 
                        onClick={() => {
                          if (previewAsset.type === 'text' && previewAsset.generatedText) {
                            const blob = new Blob([previewAsset.generatedText], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            handleDownload(url, previewAsset.fileName || \`generation-\${Date.now()}.txt\`);
                          } else if (previewAsset.resultUrl) {
                            handleDownload(previewAsset.resultUrl, previewAsset.fileName || 'asset');
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20"
                      >`
);

fs.writeFileSync('src/pages/Library/Library.tsx', content);
