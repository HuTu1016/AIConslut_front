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

	// Global image resolution helper
	app.config.globalProperties.$resolveImage = (url) => {
		if (!url) return '/static/default-avatar.png'; // Fallback
		if (url.startsWith('http')) return url;
		// Only prefix backend static resources (avatars)
		if (url.startsWith('/static/avatars/')) return BASE_URL + url;
		// Otherwise return as is (local static resources like /static/default-avatar.png)
		return url;
	};

	return {
		app,
	};
}
