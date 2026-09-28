globalThis.__nitro_main__ = import.meta.url;
import { n as HTTPError, r as defineLazyEventHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { t as HookableCore } from "./_libs/hookable.mjs";
import { r as FastResponse } from "./_libs/h3-v2+rou3+srvx.mjs";
//#region #nitro-vite-setup
function lazyService(loader) {
	let promise, mod;
	return { fetch(req) {
		if (mod) return mod.fetch(req);
		if (!promise) promise = loader().then((_mod) => mod = _mod.default || _mod);
		return promise.then((mod) => mod.fetch(req));
	} };
}
var services = { ["ssr"]: lazyService(() => import("./_ssr/ssr.mjs")) };
globalThis.__nitro_vite_envs__ = services;
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/favicon.ico": {
		"type": "image/vnd.microsoft.icon",
		"etag": "\"4f95-3RXc3p2mhEAs1WBwaIvE0Y0uu0Y\"",
		"mtime": "2026-09-23T20:55:34.704Z",
		"size": 20373,
		"path": "../public/favicon.ico"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"a0-CKGXSIe7TSsqDTmGm/nY1t/o5d0\"",
		"mtime": "2026-09-23T20:55:34.704Z",
		"size": 160,
		"path": "../public/robots.txt"
	},
	"/assets/agenda-BtdgptFN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a3b-oMAcF5uaKtThjcADx8O0pyJ3li4\"",
		"mtime": "2026-09-23T20:55:34.000Z",
		"size": 2619,
		"path": "../public/assets/agenda-BtdgptFN.js"
	},
	"/assets/configuracoes-wO_49S_U.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"30c8-qpYpxVk3lQZ0P3Y6OtlLxLRLt8U\"",
		"mtime": "2026-09-23T20:55:34.000Z",
		"size": 12488,
		"path": "../public/assets/configuracoes-wO_49S_U.js"
	},
	"/assets/curriculo-Dy62P_Oz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"47-RMM2dt32sZGIOujJKmeszMS8Bt4\"",
		"mtime": "2026-09-23T20:55:34.000Z",
		"size": 71,
		"path": "../public/assets/curriculo-Dy62P_Oz.js"
	},
	"/assets/daily-log-card-BIYH55Ub.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1936-Q6hlZmlgyDjVUji5XqXXZGbMmjo\"",
		"mtime": "2026-09-23T20:55:34.000Z",
		"size": 6454,
		"path": "../public/assets/daily-log-card-BIYH55Ub.js"
	},
	"/assets/download-B3soloI0.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"dd-YwZtBsT3llkmWJhqjTymCfKACe8\"",
		"mtime": "2026-09-23T20:55:34.000Z",
		"size": 221,
		"path": "../public/assets/download-B3soloI0.js"
	},
	"/assets/file-text-D-qYCemc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"176-qWohoGmtM07Ms2w80wAhw/HL1F0\"",
		"mtime": "2026-09-23T20:55:34.000Z",
		"size": 374,
		"path": "../public/assets/file-text-D-qYCemc.js"
	},
	"/assets/focus-card-4xTTDRLD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"d82-YlL27BciUyOtCpkaw3JaK9xZeuk\"",
		"mtime": "2026-09-23T20:55:34.000Z",
		"size": 3458,
		"path": "../public/assets/focus-card-4xTTDRLD.js"
	},
	"/assets/jogos-BVLk09jJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"47-eXuCgXInCje8D8XH8xv0n+WfMMs\"",
		"mtime": "2026-09-23T20:55:34.000Z",
		"size": 71,
		"path": "../public/assets/jogos-BVLk09jJ.js"
	},
	"/assets/label-Dbr4C9qY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"264-qwbCWna+bYdHRQnFq+UqmQY2zTk\"",
		"mtime": "2026-09-23T20:55:34.000Z",
		"size": 612,
		"path": "../public/assets/label-Dbr4C9qY.js"
	},
	"/assets/lifetime-tracker-xUKcKpTf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"15f9-67Gzc/LOH82gAyGrXxexthlWHGs\"",
		"mtime": "2026-09-23T20:55:34.000Z",
		"size": 5625,
		"path": "../public/assets/lifetime-tracker-xUKcKpTf.js"
	},
	"/assets/page-kit-eoRrPdJ5.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a7d-OtT6p94EOn0bYSS1I+qkewSSEZ4\"",
		"mtime": "2026-09-23T20:55:34.000Z",
		"size": 2685,
		"path": "../public/assets/page-kit-eoRrPdJ5.js"
	},
	"/assets/pages-CnyUVkOj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5190-LWR3KCKhxBYIC7Lb8v06ukh7UDw\"",
		"mtime": "2026-09-23T20:55:34.000Z",
		"size": 20880,
		"path": "../public/assets/pages-CnyUVkOj.js"
	},
	"/assets/planejamento-DHPpgPln.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"47-Ecn7bo75W3WVI53VhMj2+cw1K4E\"",
		"mtime": "2026-09-23T20:55:34.000Z",
		"size": 71,
		"path": "../public/assets/planejamento-DHPpgPln.js"
	},
	"/assets/projetos-Cv3vKw_x.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"47-3ymv7oVin4c5YPXwtaUnfZB6bKw\"",
		"mtime": "2026-09-23T20:55:34.000Z",
		"size": 71,
		"path": "../public/assets/projetos-Cv3vKw_x.js"
	},
	"/assets/realizacoes-FEd6L8q2.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"47-XNZlaDncldPVIpN7eW2MZn76+n8\"",
		"mtime": "2026-09-23T20:55:34.000Z",
		"size": 71,
		"path": "../public/assets/realizacoes-FEd6L8q2.js"
	},
	"/assets/routes-B5SQ4nIA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f52e-kuKOSFAxHb3q04mJR3MR8l1A0a8\"",
		"mtime": "2026-09-23T20:55:34.000Z",
		"size": 62766,
		"path": "../public/assets/routes-B5SQ4nIA.js"
	},
	"/assets/slider-BrZyZhM2.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"48e0-KAFIy83U2ikB+ItR5ijrY3gc2uc\"",
		"mtime": "2026-09-23T20:55:34.000Z",
		"size": 18656,
		"path": "../public/assets/slider-BrZyZhM2.js"
	},
	"/assets/sobre-CbIkmgV7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"47-++FXqMtLBaklokkSM+rQAP/mPyw\"",
		"mtime": "2026-09-23T20:55:34.000Z",
		"size": 71,
		"path": "../public/assets/sobre-CbIkmgV7.js"
	},
	"/assets/styles-C4gJO0J_.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"1b054-va3FdRUa54wVlce3S8fewzhD1N0\"",
		"mtime": "2026-09-23T20:55:34.000Z",
		"size": 110676,
		"path": "../public/assets/styles-C4gJO0J_.css"
	},
	"/assets/index-DCQQj64k.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"bc1d1-61GGPRwwrhQMU52/+BWskCHFNDA\"",
		"mtime": "2026-09-23T20:55:34.000Z",
		"size": 770513,
		"path": "../public/assets/index-DCQQj64k.js"
	}
};
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/route-rules.mjs
var headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
});
//#endregion
//#region #nitro/virtual/routing
var findRouteRules = /* @__PURE__ */ (() => {
	const $0 = [{
		name: "headers",
		route: "/assets/**",
		handler: headers,
		options: { "cache-control": "public, max-age=31536000, immutable" }
	}];
	return (m, p) => {
		let r = [];
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		let s = p.split("/");
		if (s.length > 1) {
			if (s[1] === "assets") r.unshift({
				data: $0,
				params: { "_": s.slice(2).join("/") }
			});
		}
		return r;
	};
})();
var _lazy_NfYLD_ = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy_NfYLD_
	};
	return ((_m, p) => {
		return {
			data,
			params: { "_": p.slice(1) }
		};
	});
})();
[].filter(Boolean);
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new FastResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
var errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region #nitro/virtual/app
function createNitroApp() {
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks: void 0,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~getMiddleware"] = (event, route) => {
		const pathname = event.url.pathname;
		const method = event.req.method;
		const middleware = [];
		const routeRules = getRouteRules(method, pathname);
		event.context.routeRules = routeRules?.routeRules;
		if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
		if (route?.data?.middleware?.length) middleware.push(...route.data.middleware);
		return middleware;
	};
	return h3App;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/app.mjs
var APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function useNitroHooks() {
	const nitroApp = useNitroApp();
	const hooks = nitroApp.hooks;
	if (hooks) return hooks;
	return nitroApp.hooks = new HookableCore();
}
function getRouteRules(method, pathname) {
	const m = findRouteRules(method, pathname);
	if (!m?.length) return { routeRuleMiddleware: [] };
	const routeRules = {};
	for (const layer of m) for (const rule of layer.data) {
		const currentRule = routeRules[rule.name];
		if (currentRule) {
			if (rule.options === false) {
				delete routeRules[rule.name];
				continue;
			}
			if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
				...currentRule.options,
				...rule.options
			};
			else currentRule.options = rule.options;
			currentRule.route = rule.route;
			currentRule.params = {
				...currentRule.params,
				...layer.params
			};
		} else if (rule.options !== false) routeRules[rule.name] = {
			...rule,
			params: layer.params
		};
	}
	const middleware = [];
	const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
	for (const rule of orderedRules) {
		if (rule.options === false || !rule.handler) continue;
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
//#endregion
//#region node_modules/nitro/dist/presets/cloudflare/runtime/_module-handler.mjs
function createHandler(hooks) {
	const nitroApp = useNitroApp();
	const nitroHooks = useNitroHooks();
	return {
		async fetch(request, env, context) {
			globalThis.__env__ = env;
			augmentReq(request, {
				env,
				context
			});
			const ctxExt = {};
			const url = new URL(request.url);
			if (hooks.fetch) {
				const res = await hooks.fetch(request, env, context, url, ctxExt);
				if (res) return res;
			}
			return await nitroApp.fetch(request);
		},
		scheduled(controller, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:scheduled", {
				controller,
				env,
				context
			}) || Promise.resolve());
		},
		email(message, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:email", {
				message,
				event: message,
				env,
				context
			}) || Promise.resolve());
		},
		queue(batch, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:queue", {
				batch,
				event: batch,
				env,
				context
			}) || Promise.resolve());
		},
		tail(traces, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:tail", {
				traces,
				env,
				context
			}) || Promise.resolve());
		},
		trace(traces, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:trace", {
				traces,
				env,
				context
			}) || Promise.resolve());
		}
	};
}
function augmentReq(cfReq, ctx) {
	const req = cfReq;
	req.ip = cfReq.headers.get("cf-connecting-ip") || void 0;
	req.runtime ??= { name: "cloudflare" };
	req.runtime.cloudflare = {
		...req.runtime.cloudflare,
		...ctx
	};
	req.waitUntil = ctx.context?.waitUntil.bind(ctx.context);
}
//#endregion
//#region node_modules/nitro/dist/presets/cloudflare/runtime/cloudflare-module.mjs
var cloudflare_module_default = createHandler({ fetch(cfRequest, env, context, url) {
	if (env.ASSETS && isPublicAssetURL(url.pathname)) return env.ASSETS.fetch(cfRequest);
} });
//#endregion
export { cloudflare_module_default as default };
