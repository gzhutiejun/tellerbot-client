import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import zh_ch from "./locales/zh-cn";

const resources = {
  en: en,
  zh_ch: zh_ch,
};

i18n.use(initReactI18next).init({
  resources,
  lng: "zh_ch",
  fallbackLng: "en", // 当前语言的翻译不存在时，使用英文
  interpolation: {
    escapeValue: false,
  },
});

export function translate(key: string, dynamicData = {}) {
  return i18n.t(key, dynamicData);
}
