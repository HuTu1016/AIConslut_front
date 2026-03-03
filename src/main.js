import {
	createSSRApp
} from "vue";
import App from "./App.vue";
import { BASE_URL } from "@/utils/request.js";
import BackButton from "@/components/BackButton/BackButton.vue";

export function createApp() {
	const app = createSSRApp(App);

	// 全局注册返回按钮组件
	app.component('back-button', BackButton);

	// 全局图片URL解析：将后端相对路径拼接为完整URL
	// 前端本地资源（tabbar图标等）直接返回，后端资源拼接BASE_URL
	app.config.globalProperties.$resolveImage = (url) => {
		if (!url) return '/static/default-avatar.png';
		if (url.startsWith('http')) return url;
		// 后端静态资源路径，需要拼接服务器地址
		if (url.startsWith('/static/avatars/') ||
			url.startsWith('/static/doctor/') ||
			url.startsWith('/static/covers/') ||
			url.startsWith('/static/consult-images/')) {
			return BASE_URL + url;
		}
		// 前端本地静态资源（如 /static/tabbar/、/static/default-avatar.png）
		return url;
	};

	return {
		app,
	};
}
