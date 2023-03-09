import { CallData } from "utils";

export const remotesViewing = {
	RemoteEvent: true,
	RemoteFunction: true,
	BindableEvent: false,
	BindableFunction: false,
};

export const remoteCalls = new Map<RemoteEvent | RemoteFunction | BindableEvent | BindableFunction, CallData[]>();
