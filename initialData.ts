import {
  StoryConfig,
  ToneSettings,
  ToneStyle,
  WeeklyDayRhythm,
  ZonakTask,
} from '../types/zonak';

export const INITIAL_TASKS: ZonakTask[] = [
  {
    id: 'task-weekly-report',
    title: 'تخلّص تقرير الشغل الأسبوعي',
    subtitle: 'شغل هادي • تركيز ٢٥ دقيقة',
    category: 'الأهم ⭐',
    categoryTone: 'priority',
    area: 'work',
    priority: 'high',
    isImportant: true,
    timeLabel: '١١:٠٠ ص',
    durationMinutes: 25,
    completed: false,
    encouragement:
      'مش مطلوب تخلّص التقرير كله قعدة واحدة.. خطوة واحدة دلوقتي كافية جداً عشان تفخر بنفسك.',
    contextTags: ['الأهم النهارده', '٢٥ دقيقة تركيز مريح', 'مع فنجان قهوتك'],
    microSteps: [
      {
        id: 'step-1',
        title: 'فتح الملف والاطلاع على الأرقام بس',
        hint: 'خلصت في ٣ دقايق 👏 عظيم!',
        durationMinutes: 3,
        completed: true,
        completedInMinutes: 3,
      },
      {
        id: 'step-2',
        title: 'كتابة فقرة الملخص (٣ سطور بس)',
        hint: 'اكتب اللي يجي في بالك الأول، التنقيح والتظبيط سهل بعدين.',
        durationMinutes: 5,
        completed: false,
      },
      {
        id: 'step-3',
        title: 'إضافة رسم بياني واحد من الشيت',
        hint: 'مجرد سحب الرسمة للملف، مش محتاجة حسابات',
        durationMinutes: 7,
        completed: false,
      },
      {
        id: 'step-4',
        title: 'مراجعة سريعة وإرسال الإيميل',
        hint: 'آخر خطوة وخلاص تقفل لابتوبك وترتاح',
        durationMinutes: 5,
        completed: false,
      },
    ],
  },
  {
    id: 'task-study-hour',
    title: 'مذاكرة ساعة',
    subtitle: 'عاش عليك، خطوة بسيطة فرقت',
    category: 'تم بنجاح ✓',
    categoryTone: 'done',
    area: 'study',
    priority: 'medium',
    isImportant: false,
    timeLabel: '٠٩:٣٠ ص',
    durationMinutes: 60,
    completed: true,
    encouragement: 'بداية هادية ورايقة.. إنجازك ده بيفرق في يومك كله.',
    contextTags: ['إنجاز هادي', 'تركيز مرن'],
    microSteps: [
      {
        id: 'study-1',
        title: 'مراجعة ملخص الدرس الأول',
        hint: 'قراءة سريعة مع كوباية شاي',
        durationMinutes: 15,
        completed: true,
        completedInMinutes: 15,
      },
      {
        id: 'study-2',
        title: 'حل ٣ أمثلة تطبيقية بس',
        hint: 'بدون ضغط، المهم الفهم',
        durationMinutes: 20,
        completed: true,
        completedInMinutes: 20,
      },
    ],
  },
  {
    id: 'task-gym-walk',
    title: 'تنزل الجيم',
    subtitle: 'لو حسيت بإرهاق، مشي خفيف يكفي',
    category: 'صحة ونشاط',
    categoryTone: 'health',
    area: 'health',
    priority: 'low',
    isImportant: false,
    timeLabel: '٠٦:٠٠ م',
    durationMinutes: 40,
    completed: false,
    encouragement: 'الحركة عشان تفرّغ طاقتك وتفرح جسمك، مش عشان تعاقب نفسك.',
    contextTags: ['صحة ونشاط', 'مرونة كاملة', 'مشي خفيف يكفي'],
    microSteps: [
      {
        id: 'gym-1',
        title: 'تجهيز الشنطة وشرب كوباية مياه',
        hint: 'تجهيز بسيط من غير تفكير كتير',
        durationMinutes: 5,
        completed: false,
      },
      {
        id: 'gym-2',
        title: 'تسخين ومشي ١٥ دقيقة على مهلك',
        hint: 'اسمع بودكاست أو مزيكا رايقة',
        durationMinutes: 15,
        completed: false,
      },
      {
        id: 'gym-3',
        title: 'تمارين إطالة خفيفة في الآخر',
        hint: 'تفك عضلاتك وترجع منتعش',
        durationMinutes: 10,
        completed: false,
      },
    ],
  },
];

export const DEFAULT_TONE_SETTINGS: ToneSettings = {
  tone: 'friends',
  noNagRule: true,
  lowEnergyAutoDetect: false,
  morningNudgeTime: '09:00',
  eveningCutoffTime: '21:30',
  sound: 'tea_chime',
  quietNotificationsEnabled: true,
};

export const TONE_PRESETS: Array<{
  id: ToneStyle;
  title: string;
  badge: string;
  description: string;
  quote: string;
  greetingMorning: string;
  progressHeadline: (completedCount: number, totalCount: number) => string;
}> = [
  {
    id: 'friends',
    title: 'الصحاب والروقان (المحببة)',
    badge: 'الأكثر هدوءاً ☕',
    description:
      'زي صاحبك المقرب.. لهجة مصرية دافئة، خفيفة، كلام بسيط بيشيل عنك الهم ويقولك «عاش يا بطل» و«ولا تشيل هم».',
    quote: '«صباح الفل، خطوة واحدة النهارده كفاية جداً والباقي ملحوق!»',
    greetingMorning: 'صباح الراحة والإنتاجية بمرونة ☕',
    progressHeadline: (done, total) =>
      total > 0 && done >= total
        ? 'عاش يا بطل! يومك رايق 🌟'
        : done > 0
        ? 'ماشي حلو جداً وبروقان'
        : 'بداية هادية على مهلك',
  },
  {
    id: 'direct',
    title: 'مباشر ومختصر جداً',
    badge: 'تركيز فائق 🎯',
    description:
      'بدون مقدمات طويلة ولا كلام زيادة.. بس الخطوة المطلوبة وبأقل كلام ممكن عشان تركّز.',
    quote: '«الخطوة: مراجعة الإيميل (٥ دقايق). جاهز؟»',
    greetingMorning: 'خطة واضحة ومرنة لليوم',
    progressHeadline: (done, total) =>
      total > 0 && done >= total
        ? 'تمت خطة اليوم بنجاح'
        : done > 0
        ? 'تقدّم ممتاز ومركز'
        : 'خطوتك الأولى جاهزة',
  },
  {
    id: 'mentor',
    title: 'حكيم وهادي (مينتور دافي)',
    badge: 'صحة نفسية 🌱',
    description:
      'نبرة أهدى، بتفكرك إن قيمتك كإنسان أكبر من قائمة مهامك وبتركز على العافية الذهنية.',
    quote: '«راحة بالك أهم من أي ميعاد تسليم، خد نفس وابدأ براحتك.»',
    greetingMorning: 'يوم هادي على وتيرتك الخاصة 🌱',
    progressHeadline: (done, total) =>
      total > 0 && done >= total
        ? 'أتممت يومك بسلام ورضا'
        : done > 0
        ? 'كل خطوة صغيرة لها قيمة'
        : 'خد نفس عميق وابدأ بلطف',
  },
];

export const WEEKLY_RHYTHM_DATA: WeeklyDayRhythm[] = [
  {
    id: 'sat',
    dayName: 'السبت',
    moodLabel: 'خطوة رايقة',
    icon: 'coffee',
    tint: 'amber',
    note: 'بدأت الأسبوع بفنجان قهوة وخطوة واحدة خفيفة من غير استعجال.',
  },
  {
    id: 'sun',
    dayName: 'الأحد',
    moodLabel: 'بهدوء ✨',
    icon: 'sparkles',
    tint: 'sky',
    note: 'أنجزت مهامك الأساسية في هدوء تام وسبت وقت لنفسك.',
  },
  {
    id: 'mon',
    dayName: 'الإثنين',
    moodLabel: 'استشفاء 🛋️',
    icon: 'shield',
    tint: 'peach',
    note: 'حسّيت بفرهدة فاخدت استشفاء معتمد ومحمي من غير تأنيب ضمير.',
  },
  {
    id: 'tue',
    dayName: 'الثلاثاء',
    moodLabel: 'تركيز مريح',
    icon: 'brain',
    tint: 'amber',
    note: 'رجعت بطاقة متجددة وقدرت تركّز ٢٥ دقيقة بكل سلاسة.',
  },
  {
    id: 'wed',
    dayName: 'الأربعاء',
    moodLabel: 'روقان ☀️',
    icon: 'sun',
    tint: 'sage',
    note: 'مشيت على وتيرتك الخاصة وقسمت الشغل لجرعات تافهة.',
  },
  {
    id: 'thu',
    dayName: 'الخميس',
    moodLabel: 'سلام نفسي',
    icon: 'heart',
    tint: 'sky',
    note: 'قفلت يومك بدري واستمتعت بوقتك مع صحابك وعيلتك.',
  },
  {
    id: 'fri',
    dayName: 'الجمعة',
    moodLabel: 'راحة تامة',
    icon: 'moon',
    tint: 'peach',
    note: 'يوم إجازة حقيقي لشحن البطاريات ببال رايق.',
  },
];

export const BREAK_ACTIVITIES = [
  {
    id: 'tea',
    title: 'فنجان شاي بالنعناع أو قهوة رايقة',
    subtitle: 'قوم جهز مشروبك المفضل على مهلك وبدون أي استعجال 🫖',
    badge: '',
    icon: 'coffee' as const,
  },
  {
    id: 'podcast',
    title: 'حلقة بودكاست هادي أو حكاية دافية',
    subtitle: '«لحظة هدوء مع نفسك» (١٠ دقايق روقان ودردشة) 🎧',
    badge: 'اقتراح زونك',
    icon: 'headphones' as const,
  },
  {
    id: 'balcony',
    title: 'وقفة في البلكونة ونَفَس عميق',
    subtitle: 'بص للسما، خد ٣ أنفاس عميقة وخلي نسمة الهوا تغيّر مودك 🌿',
    badge: '',
    icon: 'wind' as const,
  },
  {
    id: 'nap',
    title: 'أنتخة تامة وتغميض عين',
    subtitle: 'سيب الموبايل خالص على جنب وغمض عينك ٥ دقايق بس 🛋️',
    badge: '',
    icon: 'moon' as const,
  },
];

export const BRAIN_DUMP_CHIPS = [
  {
    id: 'example-full',
    label: 'مثال يوم كامل (شغل + جيم)',
    sample: 'بكرة عندي اجتماع الساعة 11، ولازم أخلص التقرير قبله، وعايز أنزل الجيم بليل',
  },
  {
    id: 'work',
    label: 'فكرة شغل أو مشروع',
    sample: 'عندي فكرة تطوير شاشة الترحيب في المشروع وعايز أكتب لها نقطتين وأبعتهم للفريق بكرة.',
  },
  {
    id: 'call',
    label: 'مكالمة مهمة متأجلة',
    sample: 'محتاج أكلم كريم بخصوص ميعاد الميتنج وأطمن على ماما بليل.',
  },
  {
    id: 'home',
    label: 'حاجات للبيت والنزول',
    sample: 'أجيب بن ولبن وفواكه من السوبرماركت وأدفع فاتورة النت.',
  },
];

export const STICKER_COLORS = [
  { id: 'gold', bg: '#F1CC51', text: '#2C2C2A', border: '#F1CC51', label: 'ذهبي دافي' },
  { id: 'navy', bg: '#185FA5', text: '#FFFFFF', border: '#185FA5', label: 'أزرق زونك' },
  { id: 'white', bg: '#FFFFFF', text: '#2C2C2A', border: '#E4DEC9', label: 'أبيض صافي' },
  { id: 'peach', bg: '#FDE2D1', text: '#5A250C', border: '#D85A30', label: 'مرجاني هادي' },
  { id: 'sky', bg: '#DCEBFB', text: '#185FA5', border: '#BDD9F7', label: 'سماوي رايق' },
];

export const EGYPTIAN_STICKER_SUGGESTIONS = [
  'براحتي خالص 🐢',
  'قهوة وسكينة ☕✨',
  'مش هاحرق دمي 🧘',
  'رايق وبشرب قهوتي ☕✨',
];

export const DEFAULT_STORY_CONFIG: StoryConfig = {
  theme: 'warm_sunrise',
  showNumbers: true,
  showChart: true,
  customStickerText: 'رايق وبشرب قهوتي ☕✨',
  customStickerColor: 'gold',
  stickers: [
    {
      id: 'sticker-custom',
      text: 'رايق وبشرب قهوتي ☕✨',
      bgColor: '#F1CC51',
      textColor: '#2C2C2A',
      visible: false,
      x: 50,
      y: 14,
      scale: 1,
      rotation: -5,
      isCustom: true,
    },
    {
      id: 'sticker-farhada',
      text: 'فصلان معتمد 🔋💤',
      bgColor: '#FDE8CD',
      textColor: '#5B320B',
      visible: true,
      x: 24,
      y: 28,
      scale: 1,
      rotation: -8,
    },
    {
      id: 'sticker-roqan',
      text: 'روقان وهدوء تام ☕✨',
      bgColor: '#F1CC51',
      textColor: '#2C2C2A',
      visible: true,
      x: 78,
      y: 44,
      scale: 1,
      rotation: 9,
    },
    {
      id: 'sticker-race',
      text: 'مش سباق يا بطل 🐢💛',
      bgColor: '#D6ECFC',
      textColor: '#185FA5',
      visible: true,
      x: 27,
      y: 66,
      scale: 1,
      rotation: -6,
    },
  ],
};

export const AREA_LABELS: Record<'work' | 'study' | 'health' | 'personal', string> = {
  work: 'شغل هادي',
  study: 'مذاكرة وتركيز',
  health: 'صحة ونشاط',
  personal: 'حياة وروقان',
};

export function toArabicDigits(value: number | string): string {
  const map: Record<string, string> = {
    '0': '٠',
    '1': '١',
    '2': '٢',
    '3': '٣',
    '4': '٤',
    '5': '٥',
    '6': '٦',
    '7': '٧',
    '8': '٨',
    '9': '٩',
  };
  return String(value).replace(/[0-9]/g, (d) => map[d] ?? d);
}
