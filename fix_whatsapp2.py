import sys

with open('d:/TAKKA FINEL/src/components/POS.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the WhatsApp button and replace its onClick handler
old_onclick = """                    <button
                      onClick={async () => {
                        let phone = '';
                        if (successInvoiceInfo?.customerPhone) {
                          phone = successInvoiceInfo.customerPhone.startsWith('0')
                            ? '2' + successInvoiceInfo.customerPhone
                            : successInvoiceInfo.customerPhone.startsWith('+')
                              ? successInvoiceInfo.customerPhone.substring(1)
                              : successInvoiceInfo.customerPhone;
                        }
                        const name = successInvoiceInfo?.customerName || '\\u0639\\u0645\\u064a\\u0644\\u0646\\u0627 \\u0627\\u0644\\u0639\\u0632\\u064a\\u0632';
                        const msg = encodeURIComponent('\\u0623\\u0647\\u0644\\u0627\\u064b \\u0628\\u0643 \\u064a\\u0627 ' + name + ' \\u0641\\u064a \\u062a\\u0643\\u0629 \\u0623\\u0635\\u0644 \\u0627\\u0644\\u062b\\u0642\\u0629.\\n\\u062a\\u0645 \\u062a\\u0633\\u062c\\u064a\\u0644 \\u0641\\u0627\\u062a\\u0648\\u0631\\u062a\\u0643 \\u0628\\u0646\\u062c\\u0627\\u062d.\\n\\u0631\\u0642\\u0645 \\u0627\\u0644\\u0641\\u0627\\u062a\\u0648\\u0631\\u0629: ' + (successInvoiceInfo?.invoiceId || '') + '\\n\\u0625\\u062c\\u0645\\u0627\\u0644\\u064a \\u0627\\u0644\\u0641\\u0627\\u062a\\u0648\\u0631\\u0629: ' + (successInvoiceInfo?.total?.toLocaleString() || '0') + ' \\u062c.\\u0645\\n\\u0646\\u0634\\u0643\\u0631\\u0643 \\u0639\\u0644\\u0649 \\u062b\\u0642\\u062a\\u0643 \\u0628\\u0646\\u0627!\\n');
                        const waUrl = phone ? 'https://wa.me/' + phone + '?text=' + msg : 'https://wa.me/?text=' + msg;
                        try {
                          if (receiptPrintRef.current) {
                            const tempDiv = document.createElement('div');
                            tempDiv.style.cssText = 'position:fixed;top:0;left:0;z-index:-1;opacity:0.01;background:white;';
                            const clone = receiptPrintRef.current.cloneNode(true) as HTMLElement;
                            clone.style.display = 'block';
                            clone.style.width = '300px';
                            tempDiv.appendChild(clone);
                            document.body.appendChild(tempDiv);
                            await new Promise(r => setTimeout(r, 500));
                            const { toPng } = await import('html-to-image');
                            const dataUrl = await toPng(clone, { quality: 1, pixelRatio: 2, backgroundColor: '#ffffff' });
                            document.body.removeChild(tempDiv);
                            const link = document.createElement('a');
                            link.href = dataUrl;
                            link.download = 'Invoice_' + (successInvoiceInfo?.invoiceId || 'receipt') + '.png';
                            link.click();
                            alert('\\u062a\\u0645 \\u062a\\u062d\\u0645\\u064a\\u0644 \\u0635\\u0648\\u0631\\u0629 \\u0627\\u0644\\u0641\\u0627\\u062a\\u0648\\u0631\\u0629! \\u064a\\u0645\\u0643\\u0646\\u0643 \\u0625\\u0631\\u0641\\u0627\\u0642\\u0647\\u0627 \\u0641\\u064a \\u0627\\u0644\\u0648\\u0627\\u062a\\u0633\\u0627\\u0628.');
                            window.open(waUrl, '_blank');
                          } else {
                            window.open(waUrl, '_blank');
                          }
                        } catch (err) {
                          console.error('WhatsApp error:', err);
                          window.open(waUrl, '_blank');
                        }
                      }}
                      className="flex-1 py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-[1.25rem] font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-[#25D366]/20 text-lg"
                    >
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                      إرسال واتساب
                    </button>"""

new_onclick = """                    <button
                      onClick={async () => {
                        let phone = '';
                        if (successInvoiceInfo?.customerPhone) {
                          phone = successInvoiceInfo.customerPhone.startsWith('0')
                            ? '2' + successInvoiceInfo.customerPhone
                            : successInvoiceInfo.customerPhone.startsWith('+')
                              ? successInvoiceInfo.customerPhone.substring(1)
                              : successInvoiceInfo.customerPhone;
                        }
                        const name = successInvoiceInfo?.customerName || '\u0639\u0645\u064a\u0644\u0646\u0627 \u0627\u0644\u0639\u0632\u064a\u0632';
                        const msgText = '\u0623\u0647\u0644\u0627\u064b \u0628\u0643 \u064a\u0627 ' + name + ' \u0641\u064a \u062a\u0643\u0629 \u0623\u0635\u0644 \u0627\u0644\u062b\u0642\u0629.\\n\u062a\u0645 \u062a\u0633\u062c\u064a\u0644 \u0641\u0627\u062a\u0648\u0631\u062a\u0643 \u0628\u0646\u062c\u0627\u062d.\\n\u0631\u0642\u0645 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629: ' + (successInvoiceInfo?.invoiceId || '') + '\\n\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629: ' + (successInvoiceInfo?.total?.toLocaleString() || '0') + ' \u062c.\u0645\\n\u0646\u0634\u0643\u0631\u0643 \u0639\u0644\u0649 \u062b\u0642\u062a\u0643 \u0628\u0646\u0627!';
                        const waUrl = phone ? 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msgText) : 'https://wa.me/?text=' + encodeURIComponent(msgText);
                        try {
                          if (receiptPrintRef.current) {
                            const tempDiv = document.createElement('div');
                            tempDiv.style.cssText = 'position:fixed;top:0;left:0;z-index:-1;opacity:0.01;background:white;';
                            const clone = receiptPrintRef.current.cloneNode(true) as HTMLElement;
                            clone.style.display = 'block';
                            clone.style.width = '300px';
                            tempDiv.appendChild(clone);
                            document.body.appendChild(tempDiv);
                            await new Promise(r => setTimeout(r, 500));
                            const { toPng } = await import('html-to-image');
                            const dataUrl = await toPng(clone, { quality: 1, pixelRatio: 2, backgroundColor: '#ffffff' });
                            document.body.removeChild(tempDiv);
                            // Convert dataUrl to blob
                            const res = await fetch(dataUrl);
                            const blob = await res.blob();
                            const file = new File([blob], 'Invoice_' + (successInvoiceInfo?.invoiceId || 'receipt') + '.png', { type: 'image/png' });
                            // Try navigator.share (works on mobile - auto attaches image to WhatsApp)
                            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                              await navigator.share({ files: [file], title: '\u0641\u0627\u062a\u0648\u0631\u0629 \u062a\u0643\u0629', text: msgText });
                            } else {
                              // Fallback: copy to clipboard then open WhatsApp
                              try {
                                const item = new ClipboardItem({ 'image/png': blob });
                                await navigator.clipboard.write([item]);
                                alert('\u062a\u0645 \u0646\u0633\u062e \u0635\u0648\u0631\u0629 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629! \u0627\u0636\u063a\u0637 Ctrl+V \u0641\u064a \u0627\u0644\u0648\u0627\u062a\u0633\u0627\u0628 \u0644\u0644\u0635\u0642\u0647\u0627.');
                                window.open(waUrl, '_blank');
                              } catch (clipErr) {
                                // Last fallback: download + open WhatsApp
                                const link = document.createElement('a');
                                link.href = dataUrl;
                                link.download = 'Invoice_' + (successInvoiceInfo?.invoiceId || 'receipt') + '.png';
                                link.click();
                                alert('\u062a\u0645 \u062a\u062d\u0645\u064a\u0644 \u0635\u0648\u0631\u0629 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629! \u0627\u0631\u0641\u0642\u0647\u0627 \u0641\u064a \u0627\u0644\u0648\u0627\u062a\u0633\u0627\u0628.');
                                window.open(waUrl, '_blank');
                              }
                            }
                          } else {
                            window.open(waUrl, '_blank');
                          }
                        } catch (err) {
                          console.error('WhatsApp error:', err);
                          window.open(waUrl, '_blank');
                        }
                      }}
                      className="flex-1 py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-[1.25rem] font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-[#25D366]/20 text-lg"
                    >
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                      \u0625\u0631\u0633\u0627\u0644 \u0648\u0627\u062a\u0633\u0627\u0628
                    </button>"""

if old_onclick in content:
    content = content.replace(old_onclick, new_onclick)
    with open('d:/TAKKA FINEL/src/components/POS.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("WhatsApp button updated with share API + clipboard fallback!")
else:
    print("ERROR: Could not find WhatsApp button to replace!")
