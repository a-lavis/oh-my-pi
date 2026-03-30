import { afterEach, describe, expect, it } from "bun:test";
import * as fs from "node:fs";
import { getShellConfig, shouldDisableShellCI } from "../src/procmgr";

const originalPiBashNoCI = Bun.env.PI_BASH_NO_CI;
const originalClaudeBashNoCI = Bun.env.CLAUDE_BASH_NO_CI;
const originalCI = Bun.env.CI;

const TEST_SHELL_PATH =
	process.platform === "win32" ? (Bun.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe") : "/bin/sh";

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

describe("shouldDisableShellCI", () => {
	it("returns false when neither setting nor env flags are set", () => {
		delete Bun.env.PI_BASH_NO_CI;
		delete Bun.env.CLAUDE_BASH_NO_CI;

		expect(shouldDisableShellCI(false)).toBe(false);
	});

	it("returns true when setting disables CI", () => {
		delete Bun.env.PI_BASH_NO_CI;
		delete Bun.env.CLAUDE_BASH_NO_CI;

		expect(shouldDisableShellCI(true)).toBe(true);
	});

	it("ignores legacy env flags when setting is false", () => {
		Bun.env.CLAUDE_BASH_NO_CI = "1";

		expect(shouldDisableShellCI(false)).toBe(false);
	});
});

describe("getShellConfig CI env handling", () => {
	it("forces CI empty when disableCI is enabled", () => {
		if (!fs.existsSync(TEST_SHELL_PATH)) return;
		Bun.env.CI = "1";
		delete Bun.env.PI_BASH_NO_CI;
		delete Bun.env.CLAUDE_BASH_NO_CI;

		const config = getShellConfig(TEST_SHELL_PATH, { disableCI: true });
		expect(config.env.CI).toBe("");
	});

	it("sets CI by default when disableCI is not enabled", () => {
		if (!fs.existsSync(TEST_SHELL_PATH)) return;
		delete Bun.env.CI;
		delete Bun.env.PI_BASH_NO_CI;
		delete Bun.env.CLAUDE_BASH_NO_CI;

		const config = getShellConfig(TEST_SHELL_PATH, { disableCI: false });
		expect(config.env.CI).toBe("true");
	});

	it("keeps inherited CI when legacy env flag is set and setting is false", () => {
		if (!fs.existsSync(TEST_SHELL_PATH)) return;
		Bun.env.CI = "1";
		Bun.env.PI_BASH_NO_CI = "1";
		delete Bun.env.CLAUDE_BASH_NO_CI;

		const config = getShellConfig(TEST_SHELL_PATH, { disableCI: false });
		expect(config.env.CI).toBe("1");
	});

	it("skips CI injection with legacy env flag when no inherited CI exists", () => {
		if (!fs.existsSync(TEST_SHELL_PATH)) return;
		delete Bun.env.CI;
		Bun.env.PI_BASH_NO_CI = "1";
		delete Bun.env.CLAUDE_BASH_NO_CI;

		const config = getShellConfig(undefined, { disableCI: false });
		expect(config.env.CI).toBeUndefined();
	});
});
