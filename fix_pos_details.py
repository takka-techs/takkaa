import sys
import re

with open('d:/TAKKA FINEL/src/components/POS.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Product interface
# Find `condition?: string;` and add new fields
content = re.sub(
    r"condition\?: string;",
    "condition?: string;\n  storage?: string;\n  activation_status?: string;\n  sim_type?: string;",
    content
)

# 2. Update fetchProducts mappedData
# Find `condition: item.condition || null,` and add new fields
content = re.sub(
    r"condition: item\.condition \|\| null,",
    "condition: item.condition || null,\n        storage: item.storage || null,\n        activation_status: item.activation_status || null,\n        sim_type: item.sim_type || null,",
    content
)

# 3. Update device rendering in the grid
# Find the color render block and insert the new spans
color_span = r"\{product\.color && \(\s*<span.*?<Palette.*?\{product\.color\}\s*</span>\s*\)\}"
new_spans = """{product.color && (
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-slate-200 dark:border-white/5">
                                    <Palette className="w-3 h-3 text-indigo-500" /> {product.color}
                                  </span>
                                )}
                                {product.storage && (
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-slate-200 dark:border-white/5">
                                    <Database className="w-3 h-3 text-blue-500" /> {product.storage}
                                  </span>
                                )}
                                {product.condition && (
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-slate-200 dark:border-white/5">
                                    <Info className="w-3 h-3 text-orange-500" /> {product.condition}
                                  </span>
                                )}
                                {product.activation_status && product.activation_status !== 'غير محدد' && (
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-slate-200 dark:border-white/5">
                                    <CheckCircle className="w-3 h-3 text-purple-500" /> {product.activation_status}
                                  </span>
                                )}
                                {product.sim_type && product.sim_type !== 'غير محدد' && (
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-slate-200 dark:border-white/5">
                                    <CreditCard className="w-3 h-3 text-cyan-500" /> {product.sim_type}
                                  </span>
                                )}"""

content = re.sub(color_span, new_spans, content)

# 4. Check if Database, Info, CheckCircle, CreditCard icons are imported from lucide-react
lucide_import_pattern = r"(import \{.*?)(Plus.*?)(?=\} from 'lucide-react';)"
match = re.search(lucide_import_pattern, content, re.DOTALL)
if match:
    imports_str = match.group(1) + match.group(2)
    new_icons = ["Database", "Info", "CheckCircle"] # CreditCard is likely already there but we should check
    for icon in new_icons:
        if icon not in imports_str:
            imports_str = imports_str.replace("Plus", f"{icon}, Plus")
    
    content = content[:match.start()] + imports_str + content[match.end():]

with open('d:/TAKKA FINEL/src/components/POS.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("POS.tsx updated with device details!")
