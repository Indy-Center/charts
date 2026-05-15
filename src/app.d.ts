/// <reference types="unplugin-icons/types/svelte" />

import type { IdentityBinding, SessionContext } from '@indy-center/identity';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: SessionContext | null;
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: Omit<Cloudflare.Env, 'IDENTITY'> & { IDENTITY?: IdentityBinding };
			cf: CfProperties;
			ctx: ExecutionContext;
		}
	}
}

export {};
