const fs = require('fs');
const file = 'd:/takkatest/src/components/Maintenance.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add States
content = content.replace(
    const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);,
    const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);\n  const [directPartName, setDirectPartName] = useState('');\n  const [directPartCost, setDirectPartCost] = useState('');\n  const [directPartPrice, setDirectPartPrice] = useState('');\n  const [directPartQty, setDirectPartQty] = useState('1');\n  const [directPartWalletId, setDirectPartWalletId] = useState('');
);

// 2. Add handleAddDirectPart
const handleAddDirectPart = 

  const handleAddDirectPart = async () => {
    if (!directPartName || !directPartPrice) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const newPartReserved = {
        id: 'direct-' + Date.now(),
        name: directPartName,
        sku: 'DIR',
        quantity: Number(directPartQty),
        price: Number(directPartPrice),
        cost: Number(directPartCost),
        total: Number(directPartPrice) * Number(directPartQty),
        date: new Date().toISOString(),
        status: '????? (?????)',
        wallet_id: directPartWalletId || null
      };
      const newRepairParts = [...repairParts, newPartReserved];

      let finalNotes = repair.notes || '';
      let cleanText = finalNotes.split('\\n===')[0];
      cleanText = cleanText.split('\\n').filter((l) => !l.includes('???? ??????') && !l.includes('???? ??????:') && !l.includes('???? ??????:')).join('\\n');
      if (devicePassword) cleanText += (cleanText ? '\\n' : '') + \?? ???? ?????? \\;
      if (deviceLocation) cleanText += (cleanText ? '\\n' : '') + \?? ???? ??????: \\;
      finalNotes = cleanText;
      finalNotes = updateSection(finalNotes, 'PARTS', newRepairParts);
      finalNotes = updateSection(finalNotes, 'DISCOUNT', { type: discountType, value: discountValue });
      finalNotes = updateSection(finalNotes, 'PAYMENTS', paymentsList);

      await fetch(\\/rest/v1/Repairs?id=eq.\\, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': API_KEY, 'Authorization': \Bearer \\ },
        body: JSON.stringify({ notes: finalNotes })
      });

      if (directPartWalletId) {
        await processTreasuryTransaction(Number(directPartWalletId), Number(directPartCost) * Number(directPartQty), 'out', '??????? ??? ???? ?????', \???? ???? ??????: \ - ????? #\\, repair.receiving_branch_id || null);
      }

      logToCRM(repair.id, \????? ???? ??????: \\);
      setRepairParts(newRepairParts);
      setIsAddPartModalOpen(false);
      await onSuccess();
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };
;

content = content.replace(
  /  const handleCancelPart = async/g,
  handleAddDirectPart + '  const handleCancelPart = async'
);

// 3. Add Refund Logic in handleCancelPart
const oldCancelStock =       // If it's cancelled (not damaged), we restock it
      if (!isDamaged && rp.id) {
        // We need to fetch current quantity first to be safe, but since Supabase doesn't have native increment over API easily without RPC, 
        // we assume we can fetch it or just use an RPC if exists. For now we will fetch then update.
        const partRes = await fetch(\\/rest/v1/spare_parts?id=eq.\&select=quantity\, {
          headers: { 'apikey': API_KEY, 'Authorization': \Bearer \\ }
        });;

const newCancelStock =       // If it's cancelled (not damaged), we restock it or refund
      if (!isDamaged && rp.id) {
        if (String(rp.id).startsWith('direct-') || rp.sku === 'DIR') {
          if (rp.wallet_id) {
            promises.push(
              processTreasuryTransaction(Number(rp.wallet_id), Number(rp.cost) * Number(rp.quantity), 'in', '????? ??????? ??? ???? ???????', \????? ???? ???? ?????? ???????: \ - ????? #\\, repair?.receiving_branch_id || repair?.branch_id || null)
            );
          }
        } else {
          const partRes = await fetch(\\/rest/v1/spare_parts?id=eq.\&select=quantity\, {
            headers: { 'apikey': API_KEY, 'Authorization': \Bearer \\ }
          });;

content = content.replace(oldCancelStock, newCancelStock);

// 4. Update the Parts Header to include the button
const oldHeader = \<h3 className="text-slate-800 dark:text-gray-200 font-bold flex items-center gap-2">
                              <Wrench className="w-5 h-5 text-slate-400" /> ??? ??????
                            </h3>\;
const newHeader = \<div className="flex items-center justify-between">
                              <h3 className="text-slate-800 dark:text-gray-200 font-bold flex items-center gap-2">
                                <Wrench className="w-5 h-5 text-slate-400" /> ??? ??????
                              </h3>
                              {canEditData && (
                                <button
                                  onClick={() => setIsAddPartModalOpen(true)}
                                  className="text-sm font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors flex items-center gap-1"
                                >
                                  <Plus className="w-4 h-4" /> ????? ???? ??????
                                </button>
                              )}
                            </div>\;
content = content.replace(oldHeader, newHeader);

// 5. Add Modal UI at the end
const oldFooter = \          </div>
        </motion.div>
      </div>
    </>
  );\;

const modalUI = \      {isAddPartModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsAddPartModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-6 h-6 text-blue-500" />
                ????? ???? ??????
              </h3>
              <button 
                onClick={() => setIsAddPartModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-2 pb-2">
              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-gray-300 mb-2 block">??? ??????</label>
                <input
                  type="text"
                  value={directPartName}
                  onChange={e => setDirectPartName(e.target.value)}
                  placeholder="????: ???? ????? 13 ???"
                  className="w-full h-12 bg-white dark:bg-[#1a1f2e] border border-slate-300 dark:border-white/10 rounded-xl px-4 text-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all shadow-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 dark:text-gray-300 mb-2 block">??? ?????? (???????)</label>
                  <input
                    type="number"
                    value={directPartCost}
                    onChange={e => setDirectPartCost(e.target.value)}
                    className="w-full h-12 bg-white dark:bg-[#1a1f2e] border border-slate-300 dark:border-white/10 rounded-xl px-4 text-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all shadow-sm text-left font-mono font-bold text-lg"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 dark:text-gray-300 mb-2 block">??? ????? ??????</label>
                  <input
                    type="number"
                    value={directPartPrice}
                    onChange={e => setDirectPartPrice(e.target.value)}
                    className="w-full h-12 bg-white dark:bg-[#1a1f2e] border border-slate-300 dark:border-white/10 rounded-xl px-4 text-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all shadow-sm text-left font-mono font-bold text-lg"
                    dir="ltr"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-gray-300 mb-2 block">??????</label>
                <input
                  type="number"
                  min="1"
                  value={directPartQty}
                  onChange={e => setDirectPartQty(e.target.value)}
                  className="w-full h-12 bg-white dark:bg-[#1a1f2e] border border-slate-300 dark:border-white/10 rounded-xl px-4 text-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all shadow-sm text-left font-mono font-bold text-lg"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-gray-300 mb-2 block">??? ??????? ?? ????:</label>
                <select
                  value={directPartWalletId}
                  onChange={(e) => setDirectPartWalletId(e.target.value)}
                  className="w-full h-12 bg-white dark:bg-[#1a1f2e] border border-slate-300 dark:border-white/10 rounded-xl px-4 text-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all shadow-sm font-bold appearance-none cursor-pointer"
                >
                  <option value="" disabled>-- ???? ?????? (?? ?????? ?????) --</option>
                  {availableWallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
                {directPartCost && directPartQty && directPartWalletId && (
                  <p className="text-sm text-slate-500 mt-2 font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 p-3 rounded-lg border border-rose-100 dark:border-rose-500/20">
                    ???? ??? <span className="font-mono text-lg mx-1">{(Number(directPartCost) * Number(directPartQty)).toFixed(2)}</span> ?.? ?? ?????? ???????.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-6 border-t border-slate-100 dark:border-white/10">
              <button
                disabled={isLoading || !directPartName || !directPartPrice || !directPartCost}
                onClick={handleAddDirectPart}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
                <span className="text-lg">????? ?????? ???????</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );;

content = content.replace(oldFooter, modalUI);

fs.writeFileSync(file, content, 'utf8');
