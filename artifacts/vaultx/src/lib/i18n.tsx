import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* ─── Supported languages ─────────────────────────────────────────────── */

export type LanguageCode = "en" | "es" | "ar" | "ur";

export interface LanguageMeta {
  code: LanguageCode;
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
}

export const LANGUAGES: LanguageMeta[] = [
  { code: "en", name: "English", nativeName: "English", dir: "ltr" },
  { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr" },
  { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl" },
  { code: "ur", name: "Urdu", nativeName: "اردو", dir: "rtl" },
];

const STORAGE_KEY = "estatefund-language";
const DEFAULT_LANGUAGE: LanguageCode = "en";

function isRtl(code: LanguageCode): boolean {
  return LANGUAGES.find((l) => l.code === code)?.dir === "rtl";
}

function loadStoredLanguage(): LanguageCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LANGUAGES.some((l) => l.code === stored)) {
      return stored as LanguageCode;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_LANGUAGE;
}

/* ─── Translation keys ────────────────────────────────────────────────── */

export interface TranslationDict {
  // Navigation
  dashboard: string;
  wallet: string;
  investments: string;
  myInvestments: string;
  profile: string;
  notifications: string;
  settings: string;
  security: string;
  signOut: string;
  // Common actions
  deposit: string;
  withdraw: string;
  invest: string;
  investNow: string;
  viewAll: string;
  viewDetails: string;
  back: string;
  save: string;
  cancel: string;
  edit: string;
  copy: string;
  copied: string;
  loading: string;
  search: string;
  close: string;
  // Property / investment
  featuredProperties: string;
  myActiveProperties: string;
  projectedReturn: string;
  investmentTerm: string;
  fundingGoal: string;
  fundingProgress: string;
  fundingDeadline: string;
  minimumInvestment: string;
  maximumInvestment: string;
  daysRemaining: string;
  location: string;
  propertyType: string;
  availableBalance: string;
  totalEarned: string;
  pendingEarnings: string;
  // Status
  active: string;
  completed: string;
  pending: string;
  verified: string;
  unverified: string;
  // Greeting
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  welcomeBack: string;
}

const en: TranslationDict = {
  dashboard: "Dashboard",
  wallet: "Wallet",
  investments: "Properties",
  myInvestments: "My Investments",
  profile: "Profile",
  notifications: "Notifications",
  settings: "Settings",
  security: "Security",
  signOut: "Sign out",
  deposit: "Deposit",
  withdraw: "Withdraw",
  invest: "Invest",
  investNow: "Invest Now",
  viewAll: "View All",
  viewDetails: "View Details",
  back: "Back",
  save: "Save",
  cancel: "Cancel",
  edit: "Edit",
  copy: "Copy",
  copied: "Copied",
  loading: "Loading…",
  search: "Search",
  close: "Close",
  featuredProperties: "Featured Properties",
  myActiveProperties: "My Active Properties",
  projectedReturn: "Projected Return",
  investmentTerm: "Investment Term",
  fundingGoal: "Funding Goal",
  fundingProgress: "Funding Progress",
  fundingDeadline: "Funding Deadline",
  minimumInvestment: "Minimum Investment",
  maximumInvestment: "Maximum Investment",
  daysRemaining: "days remaining",
  location: "Location",
  propertyType: "Property Type",
  availableBalance: "Available Balance",
  totalEarned: "Total Earned",
  pendingEarnings: "Pending Earnings",
  active: "Active",
  completed: "Completed",
  pending: "Pending",
  verified: "Verified",
  unverified: "Unverified",
  goodMorning: "Good morning",
  goodAfternoon: "Good afternoon",
  goodEvening: "Good evening",
  welcomeBack: "Welcome back",
};

const es: TranslationDict = {
  ...en,
  dashboard: "Panel",
  wallet: "Cartera",
  investments: "Propiedades",
  myInvestments: "Mis Inversiones",
  profile: "Perfil",
  notifications: "Notificaciones",
  settings: "Ajustes",
  security: "Seguridad",
  signOut: "Cerrar sesión",
  deposit: "Depositar",
  withdraw: "Retirar",
  invest: "Invertir",
  investNow: "Invertir Ahora",
  viewAll: "Ver Todo",
  viewDetails: "Ver Detalles",
  back: "Volver",
  save: "Guardar",
  cancel: "Cancelar",
  edit: "Editar",
  copy: "Copiar",
  copied: "Copiado",
  loading: "Cargando…",
  search: "Buscar",
  close: "Cerrar",
  featuredProperties: "Propiedades Destacadas",
  myActiveProperties: "Mis Propiedades Activas",
  projectedReturn: "Rendimiento Proyectado",
  investmentTerm: "Plazo de Inversión",
  fundingGoal: "Objetivo de Financiación",
  fundingProgress: "Progreso de Financiación",
  fundingDeadline: "Fecha Límite",
  minimumInvestment: "Inversión Mínima",
  maximumInvestment: "Inversión Máxima",
  daysRemaining: "días restantes",
  location: "Ubicación",
  propertyType: "Tipo de Propiedad",
  availableBalance: "Saldo Disponible",
  totalEarned: "Total Ganado",
  pendingEarnings: "Ganancias Pendientes",
  active: "Activo",
  completed: "Completado",
  pending: "Pendiente",
  verified: "Verificado",
  unverified: "Sin verificar",
  goodMorning: "Buenos días",
  goodAfternoon: "Buenas tardes",
  goodEvening: "Buenas noches",
  welcomeBack: "Bienvenido de nuevo",
};

const ar: TranslationDict = {
  ...en,
  dashboard: "لوحة التحكم",
  wallet: "المحفظة",
  investments: "العقارات",
  myInvestments: "استثماراتي",
  profile: "الملف الشخصي",
  notifications: "الإشعارات",
  settings: "الإعدادات",
  security: "الأمان",
  signOut: "تسجيل الخروج",
  deposit: "إيداع",
  withdraw: "سحب",
  invest: "استثمار",
  investNow: "استثمر الآن",
  viewAll: "عرض الكل",
  viewDetails: "عرض التفاصيل",
  back: "رجوع",
  save: "حفظ",
  cancel: "إلغاء",
  edit: "تعديل",
  copy: "نسخ",
  copied: "تم النسخ",
  loading: "جار التحميل…",
  search: "بحث",
  close: "إغلاق",
  featuredProperties: "عقارات مميزة",
  myActiveProperties: "عقاراتي النشطة",
  projectedReturn: "العائد المتوقع",
  investmentTerm: "مدة الاستثمار",
  fundingGoal: "هدف التمويل",
  fundingProgress: "تقدم التمويل",
  fundingDeadline: "الموعد النهائي",
  minimumInvestment: "الحد الأدنى للاستثمار",
  maximumInvestment: "الحد الأقصى للاستثمار",
  daysRemaining: "يوم متبقٍ",
  location: "الموقع",
  propertyType: "نوع العقار",
  availableBalance: "الرصيد المتاح",
  totalEarned: "إجمالي الأرباح",
  pendingEarnings: "الأرباح المعلقة",
  active: "نشط",
  completed: "مكتمل",
  pending: "قيد الانتظار",
  verified: "موثّق",
  unverified: "غير موثّق",
  goodMorning: "صباح الخير",
  goodAfternoon: "مساء الخير",
  goodEvening: "مساء الخير",
  welcomeBack: "مرحباً بعودتك",
};

const ur: TranslationDict = {
  ...en,
  dashboard: "ڈیش بورڈ",
  wallet: "والٹ",
  investments: "پراپرٹیز",
  myInvestments: "میری سرمایہ کاری",
  profile: "پروفائل",
  notifications: "اطلاعات",
  settings: "سیٹنگز",
  security: "سیکیورٹی",
  signOut: "سائن آؤٹ",
  deposit: "ڈپازٹ",
  withdraw: "انخلاع",
  invest: "سرمایہ کاری",
  investNow: "ابھی سرمایہ کاری کریں",
  viewAll: "سب دیکھیں",
  viewDetails: "تفصیلات دیکھیں",
  back: "واپس",
  save: "محفوظ کریں",
  cancel: "منسوخ",
  edit: "ترمیم",
  copy: "کاپی",
  copied: "کاپی ہو گیا",
  loading: "لوڈ ہو رہا ہے…",
  search: "تلاش",
  close: "بند کریں",
  featuredProperties: "نمایاں پراپرٹیز",
  myActiveProperties: "میری فعال پراپرٹیز",
  projectedReturn: "متوقع منافع",
  investmentTerm: "سرمایہ کاری کی مدت",
  fundingGoal: "فنڈنگ کا ہدف",
  fundingProgress: "فنڈنگ کی پیش رفت",
  fundingDeadline: "آخری تاریخ",
  minimumInvestment: "کم از کم سرمایہ کاری",
  maximumInvestment: "زیادہ سے زیادہ سرمایہ کاری",
  daysRemaining: "دن باقی",
  location: "مقام",
  propertyType: "پراپرٹی کی قسم",
  availableBalance: "دستیاب بیلنس",
  totalEarned: "کل کمایا",
  pendingEarnings: "زیر التوا کمائی",
  active: "فعال",
  completed: "مکمل",
  pending: "زیر التوا",
  verified: "تصدیق شدہ",
  unverified: "غیر تصدیق شدہ",
  goodMorning: "صبح بخیر",
  goodAfternoon: "دوپہر بخیر",
  goodEvening: "شام بخیر",
  welcomeBack: "خوش آمدید",
};

const TRANSLATIONS: Record<LanguageCode, TranslationDict> = { en, es, ar, ur };

/* ─── Context ─────────────────────────────────────────────────────────── */

interface I18nContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: TranslationDict;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(loadStoredLanguage);

  const dir: "ltr" | "rtl" = isRtl(language) ? "rtl" : "ltr";

  // Apply dir/lang to <html> so layout flows correctly for RTL languages
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [language, dir]);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  };

  const value = useMemo<I18nContextValue>(
    () => ({ language, setLanguage, t: TRANSLATIONS[language], dir }),
    [language, dir]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fail-safe: return English defaults when used outside the provider
    return { language: DEFAULT_LANGUAGE, setLanguage: () => {}, t: en, dir: "ltr" };
  }
  return ctx;
}
