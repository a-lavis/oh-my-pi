import { afterEach, describe, expect, it } from "bun:test";
import { getNonInteractiveEnv } from "@oh-my-pi/pi-coding-agent/exec/non-interactive-env";

const originalPiBashNoCI = Bun.env.PI_BASH_NO_CI;
const originalClaudeBashNoCI = Bun.env.CLAUDE_BASH_NO_CI;
const originalCI = Bun.env.CI;

function restoreEnv(): void {
	if (originalPiBashNoCI === undefined) delete Bun.env.PI_BASH_NO_CI;
	else Bun.env.PI_BASH_NO_CI = originalPiBashNoCI;

	if (originalClaudeBashNoCI === undefined) delete Bun.env.CLAUDE_BASH_NO_CI;
	else Bun.env.CLAUDE_BASH_NO_CI = originalClaudeBashNoCI;

	if (originalCI === undefined) delete Bun.env.CI;
	else Bun.env.CI = originalCI;
}

afterEach(() => {
	restoreEnv();
});

describe("getNonInteractiveEnv", () => {
	it("includes CI by default", () => {
		delete Bun.env.PI_BASH_NO_CI;
		delete Bun.env.CLAUDE_BASH_NO_CI;
		delete Bun.env.CI;

		const env = getNonInteractiveEnv(false);
		expect(env.CI).toBe("1");
	});

	it("forces CI empty when settings disable it", () => {
		delete Bun.env.PI_BASH_NO_CI;
		delete Bun.env.CLAUDE_BASH_NO_CI;
		Bun.env.CI = "1";

		const env = getNonInteractiveEnv(true);
		expect(env.CI).toBe("");
	});

	it("keeps CI enabled when only legacy env flags are set", () => {
		delete Bun.env.PI_BASH_NO_CI;
		Bun.env.CLAUDE_BASH_NO_CI = "1";
		Bun.env.CI = "1";

		const env = getNonInteractiveEnv(false);
		expect(env.CI).toBe("1");
	});
});
