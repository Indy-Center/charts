const ALPHA3 = /^[A-Z]{3}$/;
const ALPHANUM3 = /^[A-Z0-9]{3}$/;
const ALPHANUM4 = /^[A-Z0-9]{4}$/;

export function normalizeForApi(input: string): string | null {
	const upper = input.trim().toUpperCase();
	if (upper.length === 3) {
		if (ALPHA3.test(upper)) return 'K' + upper;
		if (ALPHANUM3.test(upper)) return upper;
		return null;
	}
	if (upper.length === 4 && ALPHANUM4.test(upper)) return upper;
	return null;
}

export function displayForm(faaIdent: string | undefined, icaoIdent: string | undefined): string {
	return faaIdent ?? icaoIdent ?? '';
}
