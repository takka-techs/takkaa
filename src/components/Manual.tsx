import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, ShoppingCart, Wrench, Settings, Users, 
  Box, Printer, MessageSquare, ChevronDown, MonitorSmartphone,
  Undo2, Handshake, Landmark, LineChart, ShieldCheck, Search,
  ArrowRightLeft
} from 'lucide-react';

export default function Manual() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setActiveSection(prev => prev === id ? null : id);
  };

  const sections = [
    {
      id: 'get_started',
      icon: BookOpen,
      title: '1. الإعدادات والبدء (خطوة بخطوة)',
      content: (
        <div className="space-y-4 text-slate-700 dark:text-slate-300">
          <p className="font-bold text-lg text-slate-900 dark:text-white">الخطوة الأولى لك في النظام:</p>
          <p>قبل القيام بأي عملية بيع أو شراء، يجب عليك تهيئة النظام ليتوافق مع تفاصيل محلك التجاري. اذهب إلى قائمة <strong>(الإعدادات)</strong> وقم بالتالي:</p>
          <ul className="list-disc list-inside space-y-3">
            <li><strong>البيانات الأساسية:</strong> أدخل (اسم الشركة/المحل، رقم الهاتف، العنوان). هذه البيانات ستظهر في أعلى وتذييل كافة الفواتير والإيصالات المطبوعة للعملاء.</li>
            <li><strong>اللوجو (الشعار):</strong> أضف رابط الشعار الخاص بك، سيتم سحبه تلقائياً لطباعته في فواتير (الكاشير، الصيانة، وكشوفات الحساب المالية).</li>
            <li><strong>الضرائب والعملة:</strong> حدد رمز العملة (مثال: ج.م أو EGP) ونسبة الضريبة الافتراضية إذا كنت تتعامل بنظام ضريبي (مثال: 14%). ستُضاف الضريبة تلقائياً على فواتير المبيعات إن لزم الأمر.</li>
            <li><strong>الترقيم التلقائي للفواتير:</strong> يمكنك من الإعدادات تحديد (البادئة Prefix) لكل نوع فاتورة (مبيعات، مشتريات، صيانة). مثلاً: مبيعات الأجهزة تبدأ بـ SAL-0001، بينما الصيانة بـ REP-0001.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'inventory',
      icon: MonitorSmartphone,
      title: '2. إدارة المخزون بكافة تفاصيله (أجهزة - إكسسوارات - قطع غيار)',
      content: (
        <div className="space-y-4 text-slate-700 dark:text-slate-300">
          <p>تم تقسيم المخزون في النظام إلى 3 أقسام رئيسية لمنع اختلاط أموال الصيانة بأموال المبيعات العامة، وتسهيل الجرد:</p>
          <div className="space-y-4 pr-4 border-r-2 border-blue-500/30">
            <div>
              <h4 className="font-bold text-blue-700 dark:text-blue-400">أولاً: الهواتف والأجهزة (تتبع الـ IMEI)</h4>
              <p className="mt-1">الأجهزة لا تُدار بالكمية العادية المجمعة، بل <strong>بالقطعة الفردية</strong>. كل هاتف يجب أن يمتلك رقم مسلسل التسلسلي الفريد (IMEI). عند استلامك 5 أجهزة iPhone 13 مثلاً، يجب عليك إدخال 5 أرقام IMEI مختلفة ليتم تسجيل 5 قطع في المخزن. هذا يحميك من السرقة ويسهل تتبع فترة الضمان الخاصة بكل عميل بمجرد البحث برقم الـ IMEI في النظام.</p>
            </div>
            <div>
              <h4 className="font-bold text-blue-700 dark:text-blue-400">ثانياً: الإكسسوارات</h4>
              <p className="mt-1">تدار بالطريقة التقليدية (رقم باركود عادي + كمية المتاحة ككل). عند إضافة منتج مثل (جراب أيفون) تضيف الباركود، وتقول أن لديك منه 50 قطعة. يمكنك لاحقاً جرد وتحديث هذه الكمية بسهولة أو تعديل أسعار البيع والتكلفة.</p>
            </div>
            <div>
              <h4 className="font-bold text-blue-700 dark:text-blue-400">ثالثاً: قطع الغيار (Spare Parts)</h4>
              <p className="mt-1">هذه الأصناف (مثل الشاشات، البطاريات الداخلية، آيسيهات الشحن) يتم فصلها عن واجهة "نقطة البيع (الكاشير)". يتم استخدامها واستهلاك مخزونها <strong>حصرياً من داخل تذاكر قسم الصيانة</strong> لمعرفة الفني الذي استخدم القطعة وتكلفة الصيانة الدقيقة لعدم التلاعب.</p>
            </div>
            <div>
              <h4 className="font-bold text-blue-700 dark:text-blue-400">تنبيه المخزون المنخفض (Low Stock)</h4>
              <p className="mt-1">كل منتج (خاصة الإكسسوارات وقطع الغيار) يحتوي على خانة (الحد الأدنى). عندما تنخفض كمية المنتج في المخزن عن هذا الرقم، سيظهر المنتج فوراً في <strong>تقرير النواقص</strong> لتقوم بشراء كمية جديدة من المورد.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'pos',
      icon: ShoppingCart,
      title: '3. نقطة البيع (الكاشير) وحركة الورديات',
      content: (
        <div className="space-y-4 text-slate-700 dark:text-slate-300">
          <p>شاشة الـ POS هي محور البيع اليومي السريع والمباشر للعميل العابر (الطياري) أو العميل المسجل.</p>
          <ul className="list-disc list-inside space-y-3">
            <li><strong>الورديات (Shifts) إجبارية:</strong> النظام لن يسمح لأي موظف بفتح فاتورة أو تحصيل مبلغ دون فتح (وردية). عند انتهاء دوام الموظف، يجب عليه التوجه لـ (إغلاق الوردية) وسيقوم النظام فوراً بمطابقة الـ (الدرج الفعلي) بالـ (المبيعات المتوقعة في النظام) ليظهر إن كان هناك (عجز) أو (زيادة) لدى الكاشير.</li>
            <li><strong>بيع الأجهزة (IMEI):</strong> بمجرد اختيار هاتف لبيعه في الكاشير، ستظهر لك نافذة إجبارية تطالبك باختيار السيريال (IMEI) تحديداً والذي ستقوم بتسليمه للعميل. لضمان خروج العهدة بشكل سليم.</li>
            <li><strong>نافذة الدفع:</strong> عند الضغط على الدفع، يمكنك (عمل خصم نسبة أو مبلغ ثابت)، وتحديد طريقة الدفع (كاش، فيزا، محفظة إلكترونية، أو آجل).</li>
            <li><strong>الآجل وربط العملاء:</strong> إذا كان الدفع (آجل)، النظام سيجبرك على اختيار واسم العميل من قاعدة بيانات العملاء، ليتم تحميل المديونية على حسابه مباشرة لتتمكن من محاسبته وعمل كشف حساب له لاحقاً.</li>
            <li><strong>تحديث الخزينة تلقائياً:</strong> أي مبيعات كاش أو فيزا ستأخذ طريقها للصب فوراً في (الخزينة) الرئيسية للنظام أو خزينة الوردية النشطة للموظف.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'printing',
      icon: Printer,
      title: '4. الطباعة الاحترافية وإعدادات الباركود (بالملليمتر)',
      content: (
        <div className="space-y-4 text-slate-700 dark:text-slate-300">
          <p>تم تصميم هذا النظام ليكون متجاوباً مع جميع وأصغر طابعات الريسيت والباركود في العالم.</p>
          <ul className="list-disc list-inside space-y-3">
            <li><strong>مقاسات الفواتير (Thermal Printers):</strong> من قسم الإعدادات بإمكانك تعيين حجم ورقة الكاشير لتكون <code>80mm</code> (وهو الشائع للطابعات الكبيرة)، أو <code>58mm</code> للطابعات اليدوية الصغيرة. جميع الفواتير في النظام ستتقلص لتناسب العرض الذي تم إدخاله بالمللي.</li>
            <li><strong>مقاسات الباركود (Barcode Stickers):</strong> في قسم الإعدادات الخاصة بتصميم الباركود، يمكنك مثلاً تعيين: <code>العرض: 50mm</code> ، <code>الارتفاع: 30mm</code> ، <code>حجم الخط: 12px</code>. عند طباعة الباركود سيقوم المتصفح بإخبار طابعة الباركود بهذه الأبعاد حصراً لضمان عدم خروج تصميم الباركود أو قصه من الأطراف.</li>
            <li><strong>الطباعة المباشرة الاختيارية:</strong> إذا كنت تستعمل نسخة (Electron/Desktop) يمكنك تحديد خيار الطباعة التلقائية المباشرة من الإعدادات، مما يتجاوز شاشة اختيار الطابعة التقليدية ويطلق أمر الطباعة في جزء من الثانية من أجل سرعة خدمة العميل على الكاشير.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'maintenance',
      icon: Wrench,
      title: '5. مركز الصيانة الشامل وتتبع الأعطال',
      content: (
        <div className="space-y-4 text-slate-700 dark:text-slate-300">
          <p>أداة احترافية تضمن حقك وحق العميل، وتمنع فقد الأجهزة في الورشة.</p>
          <ul className="list-disc list-inside space-y-3">
            <li><strong>استلام الجهاز وإنشاء التذكرة:</strong> عند قدوم مريض (هاتف) للصيانة، يتم تسجيل (اسم وتليفون العميل، نوع الهاتف، الرمز السري/الباسورد، وصف المشكلة أو الشكوى، وملاحظات الاستلام مثل "شاشة مكسورة، خدوش").</li>
            <li><strong>ملصق ظهر الجهاز (Maintenance Sticker):</strong> يتم طباعة ملصق صغير يحتوي على رقم التذكرة والعميل، يتم وضعه بظهر هاتف العميل ليضمن عدم الخلط بين هواتف العملاء المتطابقة في الورشة، وبمجرد إدخال رقمه في البحث يظهر كل التفاصيل.</li>
            <li><strong>سحب قطع الغيار للتذكرة:</strong> عندما يقوم الفني بالإصلاح، يفتح التذكرة ويبحث عن "شاشة أصلية" و "شريط شحن" في قسم قطع الغيار، ويسحبهما على التذكرة.. فتتسجل التكلفة ليتم احتساب صافي الربح من الصيانة بعد خصم ثمن قطع الغيار.</li>
            <li><strong>الاستلام النهائي والدفع:</strong> عند تسليم الجهاز، سيخرج النظام فاتورة تفصيلية بالصيانة و التكلفة (والتي تصب فوراً في أرباح الوردية والخزينة النشطة).</li>
          </ul>
        </div>
      )
    },
    {
      id: 'whatsapp',
      icon: MessageSquare,
      title: '6. التنبيهات المباشرة عبر الواتساب للعملاء',
      content: (
        <div className="space-y-4 text-slate-700 dark:text-slate-300">
          <p>استخدم قوة الواتساب لإبقاء عملائك على علم بحالة هواتفهم داخل ورشة الصيانة لزيادة الثقة وتقليل المكالمات الاستفسارية المزعجة.</p>
          <ul className="list-disc list-inside space-y-3">
            <li><strong>القالب الديناميكي:</strong> من (الإعدادات)، قم بتخصيص نص الرسالة. استخدم الأكواد التالية لتعويضها بالبيانات تلقائياً:<br/>
              <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 mx-1 rounded border dark:border-gray-700">{"{customer_name}"}</code> لاسم العميل.<br/>
              <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 mx-1 rounded border dark:border-gray-700">{"{device}"}</code> اسم الهاتف المستلم.<br/>
              <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 mx-1 rounded border dark:border-gray-700">{"{status}"}</code> حالة الإصلاح الحالية.<br/>
              <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 mx-1 rounded border dark:border-gray-700">{"{total_cost}"}</code> حساب العميل.<br/>
              <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 mx-1 rounded border dark:border-gray-700">{"{company_name}"}</code> لاسم شركتك.
            </li>
            <li><strong>الزر السحري في التذكرة:</strong> عندما ينتهي الفني من الهاتف ويغير الحالة لـ "جاهز للاستلام"، سيظهر له زر (أرسل واتساب)، بالضغط عليه يفتح الواتساب مباشرة برقم العميل المسجل في التذكرة، مع النص الجاهز، ويحتاج لضغطة (موافق) للإرسال.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'returns',
      icon: Undo2,
      title: '7. المرتجعات (المبيعات أو المشتريات التالفة)',
      content: (
        <div className="space-y-4 text-slate-700 dark:text-slate-300">
          <p>إدارة المرتجعات تتم بشكل محاسبي آلي وذكي لتفادي أي قصور في توازن الجرد والماليات.</p>
          <ul className="list-disc list-inside space-y-3">
            <li><strong>مرتجعات المبيعات (العميل أعاد منتج):</strong> قم باختيار فاتورة البيع الأصلية، ثم اختر السلعة التي يريد إرجاعها. سيسألك النظام إذا كانت العودة (لحالة المخزن للبيع مجدداً) أم (تالفة ولا تعود للمخزن). وفي الحالتين سيقوم النظام <strong>بسحب قيمة الأموال من الخزينة</strong> بردها للعميل وموازنة الوردية. بالنسبة للأجهزة التي تدار برقم الـ IMEI، سيتم استرداد وإتاحة الرقم التسلسلي المحدد مجدداً في الرصيد.</li>
            <li><strong>مرتجعات المشتريات (الإرجاع للمورد):</strong> اختر السلعة المرتجعة للمورد، سيخرجها النظام من عهدة المخزن، ويسجل لك <strong>إيراداً أو تخفيضاً لمديونية المورد</strong> بما يوازي قيمتها.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'branch_transfers',
      icon: ArrowRightLeft,
      title: '8. تحويلات الفروع (طلب وإرسال واستلام المخزون)',
      content: (
        <div className="space-y-4 text-slate-700 dark:text-slate-300">
          <p>أداة للتحكم في نقل البضائع بين فروعك المختلفة بشكل موثق وآمن عبر دورة مستندية من (إنشاء — قبول/رفض — استلام):</p>
          <ul className="list-disc list-inside space-y-3">
            <li><strong>إنشاء طلب تحويل (الإرسال):</strong> إذا كنت في "الفرع أ" وتريد إرسال بضاعة لـ "الفرع ب"، اذهب لزر "تحويل جديد"، حدد الفرع المستلم، ثم ابدأ بالبحث في مخزنك (أجهزة، إكسسوارات، أو قطع غيار) وأضفها للقائمة. بمجرد تأكيد التحويل سيتم <strong>حجز البضاعة وخصمها من مخزنك</strong> وتظل معلقة (قيد الانتظار).</li>
            <li><strong>استلام التحويلات:</strong> سيظهر لمدير "الفرع ب" أن هناك تحويل قيد الانتظار (وارد). يمكنه مراجعة الأصناف بدقة واستلامها. عند الاستلام يسأله النظام عن (المستودع/الرف) الذي سيضع فيه البضاعة، وفور القبول سيتم <strong>إضافة البضاعة رسمياً لمخزن الفرع المُستلِم</strong>.</li>
            <li><strong>رفض التحويل:</strong> إذا لاحظ الفرع المستلم أن هناك مشكلة بالبضاعة، يمكنه (رفض) التحويل مع كتابة سبب الرفض، مما يؤدي <strong>لإرجاع البضاعة تلقائياً إلى مخزن الفرع المرسل الأول</strong>، وتسجل العملية مرفوضة.</li>
            <li><strong>الأجهزة ذات الـ IMEI:</strong> عند نقل الأجهزة، تنتقل الهواتف بأرقامها التسلسلية للفرع الآخر محتفظة بنفس سجل المورد وتاريخ الشراء!</li>
          </ul>
        </div>
      )
    },
    {
      id: 'finance',
      icon: Landmark,
      title: '9. الإدارة المالية (الخزينة والمصروفات والآجل)',
      content: (
        <div className="space-y-4 text-slate-700 dark:text-slate-300">
          <p>الدورة المستندية للأموال في النظام مغلقة بالكامل لضمان رقابة صارمة على حركات الكاشير والمبيعات.</p>
          <ul className="list-disc list-inside space-y-3">
            <li><strong>العملاء والموردين:</strong> لكل عميل ومورد حساب ذو رصيد (ميزان مراجعة مصغر). يمكنك عمل (سند قبض) لتحصيل دفعة من حساب آجل، أو (سند صرف) لدفع قسط من ديون الموردين.</li>
            <li><strong>الخزينة المركزية:</strong> تحتوي على كل حركات السحب والإيداع. أرباح الورديات ترحل للخزينة تلقائياً.</li>
            <li><strong>المصروفات والإيرادات الأخرى:</strong> لتسجيل النثريات مثل (بوفيه، إيجارات، فواتير كهرباء، نقل، كيات مياه). يتم خصم هذه المبالغ قبل الوصول لقائمة الدخل والصافي.</li>
            <li><strong>كشوفات الحساب (Account Statements):</strong> يمكنك استخراج كشف حساب دقيق لكل عميل/مورد يوضح تفاصيل (حركة دائن / مدين / شراء / تسديد) مع إمكانية طباعة كشف الحساب وتوقيع العميل عليه كضمان قانوني.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'users',
      icon: ShieldCheck,
      title: '10. الصلاحيات والموظفين والمرتبات',
      content: (
        <div className="space-y-4 text-slate-700 dark:text-slate-300">
          <p>لا تدع الكل يرى كل شيء. الخصوصية والأمان أمران بغاية الأهمية.</p>
          <ul className="list-disc list-inside space-y-3">
            <li><strong>الصلاحيات (Roles):</strong> تستطيع إنشاء مستخدم باسم (موظف كاشير) ومنعه من الوصول لصفحات مثل (الموردين، الخزينة، الأرباح والخسائر، أو الإعدادات). سيُخفي النظام عنه جميع القوائم الممنوعة تماماً ويمنع الوصول لها. (الخيارات تتضمن: وصول للكاشير فقط، للمبيعات، للصيانة، التقارير وغيرها).</li>
            <li><strong>رواتب الموظفين (Salaries/Payroll):</strong> يمكنك تسجيل أساسي الراتب لكل موظف، ثم إضافة (بدلات ومكافآت) أو خصم (خصومات / غياب / أو خصم بسبب عجز سابق في الوردية الخاصة به).</li>
            <li><strong>سجلات الوردية (Shift Audit):</strong> كافة العمليات داخل النظام مسجلة باسم الموظف الذي قام بفتح الوردية حينها، مما يمنع التهرب من المسؤولية المحاسبية في حال حدوث أي تسريب أو خصم خاطئ.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'advanced_tools',
      icon: Search,
      title: '11. وحدة التتبع الشامل (IMEI Tracker) وأدوات التحكم',
      content: (
        <div className="space-y-4 text-slate-700 dark:text-slate-300">
          <p>أدوات مصممة خصيصاً لإحكام السيطرة ومتابعة التفاصيل الدقيقة في عملك:</p>
          <ul className="list-disc list-inside space-y-3">
            <li><strong>تتبع السيريال (IMEI Tracker):</strong> من الأدوات المذهلة جداً للبحث عن أي هاتف تم بيعه أو صيانته في المحل! فقط اكتب سيريال الهاتف، وسيجلب لك النظام <i>تاريخ هذا الهاتف بالكامل</i> (متى دخل المخزن، من أي مورد، لمن تم بيعه، وهل دخل الصيانة أم لا وتاريخ ذلك). سيتيح لك حسم أي جدال حول فترة الضمان في ثوانٍ!</li>
            <li><strong>التذكيرات والمهام (Reminders):</strong> يمكنك وضع تذكير مخصص لنفسك بموعد (استحقاق قسط مالي، اتصال بعميل للاستلام من الصيانة، الدفع لمورد).</li>
            <li><strong>القائمة السوداء (Blacklist):</strong> حظر التعامل مع (عملاء أو موردين) تسببوا بمشاكل مسبقاً لمنع الموظفين من إنشاء أي فواتير بيع آجلة أو تذاكر صيانة لهم بالخطأ عن طريق تنبيه يظهر عند اختيارهم.</li>
            <li><strong>الأرشيف:</strong> الاحتفاظ بالسجلات المحذوفة القديمة (مثل فواتير مبيعات سابقة أو تذاكر صيانة ممسوحة) بشكل آمن دون حذفها نهائياً لتتمكن من استرجاعها عند الضرورة.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'reports',
      icon: LineChart,
      title: '12. التقارير الختامية وقائمة الدخل (Excel)',
      content: (
        <div className="space-y-4 text-slate-700 dark:text-slate-300">
          <p>لوحة القيادة والتقارير لاتخاذ القرارات السليمة لصاحب العمل:</p>
          <ul className="list-disc list-inside space-y-3">
            <li><strong>قائمة الدخل - الأرباح والخسائر (P&L):</strong> تحسب لك إجمالي قيمة مبيعاتك وتخصم منها: (تكلفة البضاعة المباعة + تكلفة المرتجعات + المصروفات العامة اليومية والشهرية + أجور الفنيين) لتستخلص لك (صافي الزبدة) وصافي الربح في جيبك للفترة المحددة بدقة متناهية.</li>
            <li><strong>تقارير الورديات اليومية:</strong> يمكنك مراجعة وردية الأمس أو الأسبوع الماضي وتفقد مبيعات كل وردية وتفاصيلها من سحب وإيداع وعجز.</li>
            <li><strong>تقرير نواقص المخزون الرواكد:</strong> لمعرفة ماهي الأصناف التي حققت أعلى مبيعات لتقوم بإعادة طلبها، وماهي التي لم تباع منذ فترات طويلة.</li>
            <li><strong>تصدير إكسيل (Export to Excel):</strong> 99% من الجداول في النظام تحتوي على زر (تصدير إكسيل 📊). يمكنك أخذ بيانات الموردين، التقارير، أو الفواتير والاحتفاظ بنسخة خارجية احتياطية بضغطة زر.</li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col items-start gap-4 border-b border-slate-200 dark:border-[#2d3748] pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl shadow-inner">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">دليل المستخدم الشامل</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              المرجعية الأقوى لكافة أدوات النظام، من التفاصيل الصغيرة وحتى الدورة المحاسبية الكاملة.
            </p>
          </div>
        </div>
      </div>

      {/* Intro Box */}
      <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-6 rounded-3xl relative overflow-hidden shadow-sm">
        <div className="absolute -top-10 -left-10 w-48 h-48 bg-indigo-200/50 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <h2 className="text-xl font-bold text-indigo-900 dark:text-indigo-300 mb-3 relative z-10">أهلاً بك في نظام الإدارة الذكي 👋</h2>
        <p className="text-indigo-800 dark:text-indigo-200/90 leading-relaxed max-w-5xl relative z-10 text-base md:text-lg">
          تم كتابة وتجهيز هذا الدليل ليكون مرجعاً (استثنائياً) لك ولموظفيك. بدءاً من إعداد فاتورة صغيرة بمقاس طابعتك، 
          وصولاً لتتبع رقم السيريال (IMEI) وتحديد أرصدة وسلف الموظفين.
          <br/><br/>
          <span className="inline-block bg-white/50 dark:bg-black/20 px-3 py-1 rounded-lg">
            <b>💡 اضغط على اللسنة بالأسفل لفتح التفاصيل والتوجيهات التقنية.</b>
          </span>
        </p>
      </div>

      {/* Accordion / Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <div 
            key={section.id} 
            className="bg-white dark:bg-[#1a2332] border border-slate-200 dark:border-[#2d3748] rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full text-right p-5 md:p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors focus:outline-none"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${activeSection === section.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 dark:bg-[#2d3748] text-slate-500 dark:text-slate-400'} transition-all duration-300`}>
                  <section.icon className="w-7 h-7" strokeWidth={activeSection === section.id ? 2.5 : 2} />
                </div>
                <h3 className={`text-lg md:text-xl font-bold ${activeSection === section.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-white'} transition-colors duration-300`}>
                  {section.title}
                </h3>
              </div>
              <div className={`p-2 rounded-full ${activeSection === section.id ? 'bg-blue-100 dark:bg-blue-500/20' : 'bg-transparent'}`}>
                <ChevronDown className={`w-6 h-6 ${activeSection === section.id ? 'text-blue-600 dark:text-blue-400 rotate-180' : 'text-slate-400'} transition-transform duration-300`} />
              </div>
            </button>
            <AnimatePresence>
              {activeSection === section.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-100 dark:border-[#2d3748]/50 overflow-hidden"
                >
                  <div className="p-6 md:p-8 md:pr-20 text-base leading-loose bg-slate-50/50 dark:bg-transparent">
                    {section.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Footer Support Callout - Enhanced with WhatsApp Link */}
      <div className="mt-16 text-center p-8 md:p-12 border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-[#151d2b] dark:to-[#0f1520] rounded-3xl relative overflow-hidden shadow-lg">
        {/* Background glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-400/10 via-transparent to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-6 shadow-sm">
            <MessageSquare className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          
          <h3 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white mb-4">
            هل ما زلت بحاجة إلى المساعدة؟
          </h3>
          
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl text-lg leading-relaxed mb-8">
            إذا كان لديك استفسار إضافي، أو صعوبة في استخدام إحدى الشاشات، أو ترغب في تعديل أو طلب إضافة ميزة خاصة لنشاطك، تواصل مع فريق الدعم الفني مباشرة وسنكون سعداء بخدمتك!
          </p>

          <a 
            href="https://wa.me/201037230660" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#128C7E] outline-none focus:ring-4 focus:ring-green-500/40 text-white font-bold text-xl px-10 py-5 rounded-2xl transition-all duration-300 shadow-xl shadow-green-500/30 hover:scale-[1.02] active:scale-95"
          >
            <svg 
              viewBox="0 0 24 24" 
              className="w-8 h-8 fill-current"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
            تحدث معنا عبر الواتساب
          </a>
          
          <div className="mt-5 flex items-center justify-center gap-2">
            <span className="text-slate-400 dark:text-slate-500">أו انسخ الرقم المباشر:</span>
            <code className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg font-mono text-lg select-all">01037230660</code>
          </div>
        </div>
      </div>

    </div>
  );
}
