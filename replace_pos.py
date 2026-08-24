import sys

with open('d:/TAKKA FINEL/src/components/POS.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
if 'import html2canvas' not in content:
    content = content.replace("import { useReactToPrint } from 'react-to-print';", "import { useReactToPrint } from 'react-to-print';\nimport html2canvas from 'html2canvas';")

# 2. State
old_state = "const [successInvoiceInfo, setSuccessInvoiceInfo] = useState<{ invoiceId: string, itemsCount: number, total: number } | null>(null);"
new_state = "const [successInvoiceInfo, setSuccessInvoiceInfo] = useState<{ invoiceId: string, itemsCount: number, total: number, customerPhone?: string, customerName?: string } | null>(null);"
content = content.replace(old_state, new_state)

# 3. setSuccessInvoiceInfo inside checkout
old_set_state = '''      setSuccessInvoiceInfo({
        invoiceId: invoiceData.invoice_number,
        itemsCount: printCart.reduce((sum, item) => sum + item.cartQuantity, 0),
        total: total
      });'''
new_set_state = '''      setSuccessInvoiceInfo({
        invoiceId: invoiceData.invoice_number,
        itemsCount: printCart.reduce((sum, item) => sum + item.cartQuantity, 0),
        total: total,
        customerPhone: checkoutData.customerPhone,
        customerName: checkoutData.customerName
      });'''
content = content.replace(old_set_state, new_set_state)

# 4. WhatsApp Button
old_btn = '''            <p className="text-slate-600 dark:text-slate-400 font-bold text-lg">?? ???? ????? ?????????</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  printReceiptAction();
                }}
                className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.25rem] font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 text-lg"
              >
                <Printer className="w-6 h-6" />
                ????? ????????
              </button>
              <button
                onClick={() => setIsSuccessModalOpen(false)}
                className="px-8 py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-[1.25rem] font-bold text-lg transition-all"
              >
                ?????
              </button>
            </div>'''

new_btn = '''            <p className="text-slate-600 dark:text-slate-400 font-bold text-lg">?? ???? ????? ?????????</p>
            <div className="flex gap-3 flex-col sm:flex-row">
              <button
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  printReceiptAction();
                }}
                className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.25rem] font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 text-lg"
              >
                <Printer className="w-6 h-6" />
                ????? ????????
              </button>
              <button 
                  onClick={async () => {
                    let phone = '';
                    if (successInvoiceInfo?.customerPhone) {
                        phone = successInvoiceInfo.customerPhone.startsWith('0') 
                          ? '2' + successInvoiceInfo.customerPhone 
                          : successInvoiceInfo.customerPhone.startsWith('+')
                            ? successInvoiceInfo.customerPhone.substring(1)
                            : successInvoiceInfo.customerPhone;
                    }
                    const name = successInvoiceInfo?.customerName || '?????? ??????';
                    const msg = encodeURIComponent(????? ?? ??  + name +  ?? ??? ??? ?????.\\n?? ????? ??????? ?????.\\n??? ????????:  + successInvoiceInfo?.invoiceId + \\n?????? ????????:  + successInvoiceInfo?.total?.toLocaleString() +  ?.?\\n????? ??? ???? ???!\\n(????? ??? ???????? ???)\\n);
                    const waUrl = phone ? https://wa.me/ + phone + ?text= + msg : https://wa.me/?text= + msg;
                    
                    try {
                        if (receiptPrintRef.current) {
                            // Temporarily display the receipt to render it properly if it's hidden
                            const originalDisplay = receiptPrintRef.current.style.display;
                            receiptPrintRef.current.style.display = 'block';
                            
                            const canvas = await html2canvas(receiptPrintRef.current, { scale: 2 });
                            receiptPrintRef.current.style.display = originalDisplay;
                            
                            canvas.toBlob(async (blob) => {
                                if (blob) {
                                    try {
                                        const item = new ClipboardItem({ 'image/png': blob });
                                        await navigator.clipboard.write([item]);
                                        alert("?? ??? ???? ????????! ???? ????? ??? ??? (Ctrl+V) ???? ???????? ???????? ??????.");
                                        window.open(waUrl, '_blank');
                                    } catch (e) {
                                        console.error("Clipboard write failed", e);
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = Invoice_ + successInvoiceInfo?.invoiceId + .png;
                                        a.click();
                                        alert("?? ????? ???? ????????? ????? ??????? ?????? ?? ????????.");
                                        window.open(waUrl, '_blank');
                                    }
                                }
                            }, 'image/png');
                        } else {
                            window.open(waUrl, '_blank');
                        }
                    } catch(err) {
                        console.error(err);
                        window.open(waUrl, '_blank');
                    }
                  }}
                  className="flex-1 py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-[1.25rem] font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-[#25D366]/20 text-lg"
                >
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  ????? ???????? ??????
              </button>
              <button
                onClick={() => setIsSuccessModalOpen(false)}
                className="px-8 py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-[1.25rem] font-bold text-lg transition-all"
              >
                ?????
              </button>
            </div>'''
if old_btn in content:
    content = content.replace(old_btn, new_btn)
    with open('d:/TAKKA FINEL/src/components/POS.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Done")
else:
    print("Not found old_btn!")
