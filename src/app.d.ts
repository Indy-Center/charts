/// <reference types="unplugin-icons/types/svelte" />

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: Cloudflare.Env;
			cf: CfProperties;
			ctx: ExecutionContext;
		}
	}
}

export {};
