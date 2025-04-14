import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import zhCN from "./locales/zh-cn";
import zhHk from "./locales/zh-hk";

const resources = {
  en: en,
  "zh-CN": zhCN,
  "zh-HK": zhHk,
};

i18n.use(initReactI18next).init({
  resources,
  lng: "zh-CN",
  fallbackLng: "en", // 当前语言的翻译不存在时，使用英文
  interpolation: {
    escapeValue: false,
  },
});

export function setTranslationLanguage(lang: string) {
  i18n.changeLanguage(lang);
}
export function translate(key: string, dynamicData = {}) {
  return i18n.t(key, dynamicData);
}
