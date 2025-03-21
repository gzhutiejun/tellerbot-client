import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import zh from "./locales/zh";

const resources = {
  en: en,
  zh: zh,
};

i18n.use(initReactI18next).init({
  resources,
  lng: "zh",
  fallbackLng: "en", // 当前语言的翻译不存在时，使用英文
  interpolation: {
    escapeValue: false,
  },
});

export function translate(key: string, dynamicData = {}) {
  return i18n.t(key, dynamicData);
}
