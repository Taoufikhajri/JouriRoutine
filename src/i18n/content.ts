/**
 * Translations for ready-made content (template routines, missions and default
 * rewards). These end up in the database, so they are translated when a
 * template is applied, and can be re-translated when the family language changes.
 */
export interface ContentEntry {
  en: string;
  fr: string;
  ar: string;
}

export const CONTENT: ContentEntry[] = [
  // Routine names
  { en: "Morning", fr: "Matin", ar: "الصباح" },
  { en: "School", fr: "École", ar: "المدرسة" },
  { en: "After School", fr: "Après l'école", ar: "بعد المدرسة" },
  { en: "Evening", fr: "Soir", ar: "المساء" },
  { en: "Good Habits", fr: "Bonnes habitudes", ar: "عادات حسنة" },
  { en: "Weekend", fr: "Week-end", ar: "عطلة نهاية الأسبوع" },
  { en: "Ramadan", fr: "Ramadan", ar: "رمضان" },
  { en: "School Day", fr: "Jour d'école", ar: "يوم المدرسة" },
  // Missions
  { en: "Wake up", fr: "Je me réveille", ar: "أستيقظ" },
  { en: "Make my bed", fr: "Je fais mon lit", ar: "أرتّب سريري" },
  { en: "Bathroom & wash", fr: "Toilette et lavage", ar: "الحمّام والاغتسال" },
  { en: "Fajr Prayer", fr: "Prière du Fajr", ar: "صلاة الفجر" },
  { en: "Dhuhr Prayer", fr: "Prière du Dhuhr", ar: "صلاة الظهر" },
  { en: "Asr Prayer", fr: "Prière du Asr", ar: "صلاة العصر" },
  { en: "Maghrib Prayer", fr: "Prière du Maghrib", ar: "صلاة المغرب" },
  { en: "Isha Prayer", fr: "Prière du Icha", ar: "صلاة العشاء" },
  { en: "Quran", fr: "Coran", ar: "القرآن" },
  { en: "Brush my teeth", fr: "Je me brosse les dents", ar: "أنظّف أسناني" },
  { en: "Get dressed", fr: "Je m'habille", ar: "ألبس ملابسي" },
  { en: "Healthy breakfast", fr: "Petit-déjeuner sain", ar: "فطور صحي" },
  { en: "Prepare my school bag", fr: "Je prépare mon cartable", ar: "أجهّز حقيبتي المدرسية" },
  { en: "Say goodbye nicely", fr: "Je dis au revoir gentiment", ar: "أودّع أهلي بلطف" },
  { en: "Go to school", fr: "Je vais à l'école", ar: "أذهب إلى المدرسة" },
  { en: "Come home", fr: "Je rentre à la maison", ar: "أعود إلى البيت" },
  { en: "Put shoes & clothes away", fr: "Je range chaussures et vêtements", ar: "أرتّب حذائي وملابسي" },
  { en: "Healthy snack", fr: "Goûter sain", ar: "وجبة خفيفة صحية" },
  { en: "Rest for 20 minutes", fr: "Je me repose 20 minutes", ar: "أرتاح ٢٠ دقيقة" },
  { en: "Homework", fr: "Devoirs", ar: "الواجبات المدرسية" },
  { en: "Read a book (15 min)", fr: "Je lis un livre (15 min)", ar: "أقرأ كتابًا (١٥ دقيقة)" },
  { en: "Free play", fr: "Jeu libre", ar: "لعب حر" },
  { en: "Help Mom or Dad", fr: "J'aide Maman ou Papa", ar: "أساعد أمي أو أبي" },
  { en: "Dinner with family", fr: "Dîner en famille", ar: "العشاء مع العائلة" },
  { en: "Creative time", fr: "Moment créatif", ar: "وقت الإبداع" },
  { en: "Tidy toys & bedroom", fr: "Je range jouets et chambre", ar: "أرتّب ألعابي وغرفتي" },
  { en: "Shower time", fr: "C'est l'heure de la douche", ar: "وقت الاستحمام" },
  { en: "Evening adhkar", fr: "Adhkar du soir", ar: "أذكار المساء" },
  { en: "Bedtime story", fr: "Histoire du soir", ar: "قصة قبل النوم" },
  { en: "Hug Mom and Dad", fr: "Câlin à Maman et Papa", ar: "أعانق أمي وأبي" },
  { en: "Sleep", fr: "Dodo", ar: "النوم" },
  { en: "Say Bismillah before eating", fr: "Je dis Bismillah avant de manger", ar: "أقول بسم الله قبل الأكل" },
  { en: "Say Alhamdulillah", fr: "Je dis Alhamdoulillah", ar: "أقول الحمد لله" },
  { en: "Say something nice", fr: "Je dis quelque chose de gentil", ar: "أقول كلمة طيبة" },
  { en: "Be kind to my sibling", fr: "Gentillesse avec ma fratrie", ar: "ألطف مع إخوتي" },
  { en: "Learn something new", fr: "J'apprends quelque chose de nouveau", ar: "أتعلّم شيئًا جديدًا" },
  { en: "Charity & kindness", fr: "Charité et gentillesse", ar: "صدقة ولطف" },
  { en: "Breakfast", fr: "Petit-déjeuner", ar: "الفطور" },
  { en: "Clean my bedroom", fr: "Je nettoie ma chambre", ar: "أنظّف غرفتي" },
  { en: "Help my parents", fr: "J'aide mes parents", ar: "أساعد والديّ" },
  { en: "Reading time", fr: "Moment de lecture", ar: "وقت القراءة" },
  { en: "Outdoor activity", fr: "Activité dehors", ar: "نشاط في الخارج" },
  { en: "Creative activity", fr: "Activité créative", ar: "نشاط إبداعي" },
  { en: "Family time", fr: "Moment en famille", ar: "وقت العائلة" },
  { en: "Dinner", fr: "Dîner", ar: "العشاء" },
  { en: "Shower", fr: "Douche", ar: "الاستحمام" },
  { en: "Read a book", fr: "Je lis un livre", ar: "أقرأ كتابًا" },
  { en: "Lay out tomorrow's clothes", fr: "Je prépare mes habits de demain", ar: "أجهّز ملابس الغد" },
  { en: "Suhoor", fr: "Souhour", ar: "السحور" },
  { en: "Dhikr", fr: "Dhikr", ar: "الذكر" },
  { en: "Help prepare Iftar", fr: "J'aide à préparer l'iftar", ar: "أساعد في تحضير الإفطار" },
  { en: "Iftar with family", fr: "Iftar en famille", ar: "الإفطار مع العائلة" },
  { en: "Taraweeh", fr: "Tarawih", ar: "صلاة التراويح" },
  { en: "Charity challenge", fr: "Défi de charité", ar: "تحدّي الصدقة" },
  // Descriptions
  { en: "Read or listen for 5 minutes", fr: "Lire ou écouter 5 minutes", ar: "أقرأ أو أستمع ٥ دقائق" },
  { en: "Read or listen for 10 minutes", fr: "Lire ou écouter 10 minutes", ar: "أقرأ أو أستمع ١٠ دقائق" },
  { en: "A big smile and a hug!", fr: "Un grand sourire et un câlin !", ar: "ابتسامة كبيرة وحضن!" },
  { en: "If it is prayer time", fr: "Si c'est l'heure de la prière", ar: "إذا حان وقت الصلاة" },
  {
    en: "Organize toys, set the table, tidy my room or help my sibling",
    fr: "Ranger les jouets, mettre la table, ranger ma chambre ou aider ma fratrie",
    ar: "أرتّب الألعاب، أجهّز المائدة، أرتّب غرفتي أو أساعد إخوتي",
  },
  { en: "Drawing, crafts, puzzle, LEGO or writing", fr: "Dessin, bricolage, puzzle, LEGO ou écriture", ar: "رسم، أشغال يدوية، أحجية، ليغو أو كتابة" },
  { en: "Share, give sadaqah or do a secret kindness", fr: "Partager, donner une sadaqa ou faire une gentillesse secrète", ar: "أشارك، أتصدّق أو أفعل لطفًا في السر" },
  { en: "Share something or help someone today", fr: "Partager quelque chose ou aider quelqu'un aujourd'hui", ar: "أشارك شيئًا أو أساعد أحدًا اليوم" },
  // Default rewards
  { en: "Family bike ride", fr: "Balade à vélo en famille", ar: "جولة دراجات مع العائلة" },
  { en: "Ice cream", fr: "Une glace", ar: "مثلجات" },
  { en: "Family movie night", fr: "Soirée film en famille", ar: "سهرة فيلم مع العائلة" },
  { en: "30 min extra game time", fr: "30 min de jeu en plus", ar: "٣٠ دقيقة لعب إضافية" },
  { en: "New coloring book", fr: "Nouveau cahier de coloriage", ar: "كتاب تلوين جديد" },
  { en: "Choose dinner", fr: "Je choisis le dîner", ar: "أختار العشاء" },
  { en: "Small surprise", fr: "Petite surprise", ar: "مفاجأة صغيرة" },
  { en: "Special family activity", fr: "Activité spéciale en famille", ar: "نشاط عائلي مميّز" },
];

type L = keyof ContentEntry;

/** Translate a known content string (in any language) into `to`. Unknown text is returned unchanged. */
export function translateContent(text: string, to: L): string {
  const v = text.trim();
  const hit = CONTENT.find((e) => e.en === v || e.fr === v || e.ar === v);
  return hit ? hit[to] : text;
}
