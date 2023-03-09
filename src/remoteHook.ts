import { remotesViewing } from "ui/config";
import { CallData, InternalRemoteSignal, getCallingFunction, restoremetatable, udhookmetamethod } from "utils";

const remoteSpyFilter = new AnyFilter([
	new AllFilter([
		new AnyFilter([
			new NamecallFilter("FireServer"),
			new NamecallFilter("fireServer"), // Some games use deprecated methods
		]),
		new InstanceTypeFilter(1, "RemoteEvent"),
	]),
	new AllFilter([
		new AnyFilter([
			new NamecallFilter("InvokeServer"),
			new NamecallFilter("invokeServer"), // Some games use deprecated methods
		]),
		new InstanceTypeFilter(1, "RemoteFunction"),
	]),
	new AllFilter([
		new AnyFilter([
			new NamecallFilter("Fire"),
			new NamecallFilter("fire"), // Some games use deprecated methods
		]),
		new InstanceTypeFilter(1, "BindableEvent"),
	]),
	new AllFilter([
		new AnyFilter([
			new NamecallFilter("Invoke"),
			new NamecallFilter("invoke"), // Some games use deprecated methods
		]),
		new InstanceTypeFilter(1, "BindableFunction"),
	]),
]);

export function remoteHook() {
	let oldRemoteHandler: Callback;
	oldRemoteHandler = udhookmetamethod(
		game,
		"__namecall",
		(remote: RemoteEvent | RemoteFunction | BindableEvent | BindableFunction, ...data: unknown[]) => {
			const remoteClassName = remote.ClassName as keyof typeof remotesViewing;
			if (!remotesViewing[remoteClassName]) return oldRemoteHandler(remote, ...data);

			const isSynapse = checkcaller();

			let returnData: unknown = undefined;
			if (remoteClassName === "RemoteFunction") {
				returnData = oldRemoteHandler(remote, ...data);
			}

			const callData: CallData = {
				cScript: getcallingscript(),
				args: data,
				func: getCallingFunction(),
				remoteType: remoteClassName,
				returnData: returnData,
				remote: remote,
				caller: isSynapse ? "Synapse X" : "Roblox",
			};

			if (!callData.cScript) return oldRemoteHandler(remote, ...data);

			InternalRemoteSignal.Fire(callData);

			return returnData ?? oldRemoteHandler(remote, ...data);
		},
		remoteSpyFilter,
	);
}
