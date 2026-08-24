import sys
import re

with open('d:/TAKKA FINEL/src/components/POS.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add condition?: string; to Product interface
content = re.sub(
    r"type: 'device' \| 'accessory' \| 'spare_part';",
    "type: 'device' | 'accessory' | 'spare_part';\n  condition?: string;",
    content
)

# 2. Add deviceConditionFilter state
content = re.sub(
    r"const \[activeTab, setActiveTab\] = useState.*?;",
    "\\g<0>\n  const [deviceConditionFilter, setDeviceConditionFilter] = useState<'all' | 'جديد' | 'مستعمل'>('all');",
    content
)

# 3. Add condition to mappedData
content = re.sub(
    r"location: item\.location \|\| null,",
    "location: item.location || null,\n        condition: item.condition || null,",
    content
)

# 4. Filter logic
content = re.sub(
    r"const matchesSearch = strMatch.*?;\n\s*const matchesBrand = strMatch.*?;\n\s*return matchesSearch && matchesBrand;",
    "const matchesSearch = strMatch(p.name) || strMatch(p.imei1) || strMatch(p.barcode) || strMatch(p.category) || strMatch(p.brand);\n    const matchesBrand = selectedBrand === 'الكل' || p.brand === selectedBrand || p.category === selectedBrand;\n    const matchesCondition = activeTab !== 'devices' || deviceConditionFilter === 'all' || p.condition === deviceConditionFilter;\n    return matchesSearch && matchesBrand && matchesCondition;",
    content
)
# Wait, let's use a safer regex for the filter logic replacement
filter_search = r"(const matchesBrand = selectedBrand === 'الكل' \|\| p\.brand === selectedBrand \|\| p\.category === selectedBrand;\n\s*return matchesSearch && matchesBrand;)"
filter_replace = r"const matchesBrand = selectedBrand === 'الكل' || p.brand === selectedBrand || p.category === selectedBrand;\n    const matchesCondition = activeTab !== 'devices' || deviceConditionFilter === 'all' || p.condition === deviceConditionFilter;\n    return matchesSearch && matchesBrand && matchesCondition;"
content = re.sub(filter_search, filter_replace, content)

# 5. JSX Select Filter
jsx_search = r"(\{brands\.map\(\(brand\) => \(\n\s*<button\n\s*key=\{brand\})"
jsx_replace = r"""{activeTab === 'devices' && (
                      <select
                        value={deviceConditionFilter}
                        onChange={(e) => setDeviceConditionFilter(e.target.value as any)}
                        className="px-4 py-3 rounded-xl text-sm font-bold bg-white dark:bg-[#11151c] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5 focus:outline-none focus:border-blue-500/50 shadow-sm transition-colors cursor-pointer shrink-0"
                      >
                        <option value="all">كل الحالات</option>
                        <option value="جديد">جديد</option>
                        <option value="مستعمل">مستعمل</option>
                      </select>
                    )}
                    \1"""
content = re.sub(jsx_search, jsx_replace, content)

with open('d:/TAKKA FINEL/src/components/POS.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("POS.tsx updated with condition filter!")
