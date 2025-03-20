import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import zhCN from "./locales/zh-CN";

const resources = {
	en: en,
	"zh-cn": zhCN,
};

i18n.use(initReactI18next).init({
	resources,
	lng: "en",
	fallbackLng: "en", // 当前语言的翻译不存在时，使用英文
	interpolation: {
		escapeValue: false,
	},
});

export default i18n;
