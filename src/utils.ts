import { Players, Workspace } from "@rbxts/services";

export type RemoteType = "RemoteEvent" | "RemoteFunction" | "BindableEvent" | "BindableFunction";

export interface CallData {
	cScript: LocalScript | ModuleScript | undefined;
	args: unknown[];
	func: Callback | undefined;
	remoteType: RemoteType;
	returnData: unknown;
	remote: RemoteEvent | RemoteFunction | BindableEvent | BindableFunction;
	caller: "Synapse X" | "Roblox";
}
export type RemoteSignalMessage = "NEW" | "UPDATE";
export const InternalRemoteSignal = new SynSignal<[callData: CallData]>();

/**
 * Undetactable version of {@link hookmetamethod} aswell as implementing a optional {@link Filter} for the hook.
 */
export function udhookmetamethod<UD, K extends keyof SynapseMetatable>(
	toHook: UD,
	metamethod: K,
	hookFunc: Callback,
	filter?: FilterBase,
): Callback {
	const toHookMetatable = getrawmetatable(toHook);
	const exceptionReturn = () => {};
	if (!toHookMetatable) return exceptionReturn;

	const toHookFunction = toHookMetatable[metamethod];
	if (!toHookFunction || typeIs(toHookFunction, "string")) return exceptionReturn;

	let func: Callback;
	let oldFunction: Callback;

	if (filter) {
		func = getfilter(
			filter,
			function (...data: unknown[]) {
				return oldFunction(...data);
			},
			hookFunc,
		);
	} else {
		func = hookFunc;
	}

	restoremetatable(toHook, metamethod);
	oldFunction = syn.oth.hook(toHookFunction, func);
	return oldFunction;
}

export function restoremetatable(toRestore: unknown, metamethod: keyof SynapseMetatable) {
	const toRestoreMetatable = getrawmetatable(toRestore);

	if (toRestoreMetatable !== undefined && metamethod in toRestoreMetatable) {
		let toRestoreFunction = toRestoreMetatable[metamethod];
		if (typeIs(toRestoreFunction, "function")) {
			unhook(toRestoreFunction);
		}
	}
}

export function unhook(toUnhook: Callback) {
	restorefunction(toUnhook);
	syn.oth.unhook(toUnhook);
}

export function getCallingFunction(): Callback | undefined {
	try {
		return debug.getinfo(3).func;
	} catch (error) {
		return undefined;
	}
}

function isService(name: string): boolean {
	try {
		let service = game.GetService(name as keyof Services);
		return service !== undefined;
	} catch (error) {
		return false;
	}
}

// Credit to Hydroxide
export function getInstancePath(instance: Instance): string {
	const name = instance.Name;
	let head = (name.size() > 0 && "." + name) || "['']";

	if (!instance.Parent && instance !== game) {
		return head + " --[[ PARENTED TO NIL OR DESTROYED ]]";
	}

	if (instance === game) {
		return "game";
	} else if (instance === Workspace) {
		return "workspace";
	} else {
		const result = isService(instance.ClassName);

		if (result) {
			head = ':GetService("' + instance.ClassName + '")';
		} else if (instance === Players.LocalPlayer) {
			head = ".LocalPlayer";
		} else {
			let nonAlphaNum = name.gsub("[%w_]", "")[0];
			let noPunct = nonAlphaNum.gsub("[%s%p]", "")[0];

			if (tonumber(name.sub(1, 1)) || (nonAlphaNum.size() !== 0 && noPunct.size() === 0)) {
				head = '["' + name.gsub('"', '\\"')[0].gsub("\\", "\\\\")[0] + '"]';
			} else if (nonAlphaNum.size() !== 0 && noPunct.size() > 0) {
				head = "[" + toUnicode(name) + "]";
			}
		}
	}
	if (!instance.Parent) return head + " --[[ PARENTED TO NIL OR DESTROYED ]]";
	return getInstancePath(instance.Parent) + head;
}

export function toUnicode(str: string): string {
	let codepoints = "utf8.char(";

	for (const [_i, v] of utf8.codes(str)) {
		codepoints = codepoints + v + ", ";
	}

	return codepoints.sub(1, -3) + ")";
}
