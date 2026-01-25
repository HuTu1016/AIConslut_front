import {
	createSSRApp
} from "vue";
import App from "./App.vue";
import { BASE_URL } from "@/utils/request.js";

export function createApp() {
	const app = createSSRApp(App);

	// Global image resolution helper
	app.config.globalProperties.$resolveImage = (url) => {
		if (!url) return '/static/default-avatar.png'; // Fallback
		if (url.startsWith('http')) return url;
		if (url.startsWith('/static/')) return BASE_URL + url;
		return url;
	};

	return {
		app,
	};
}
