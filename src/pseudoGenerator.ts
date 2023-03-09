import StringUtils from "@rbxts/string-utils";
import { GetInstancesFromIdsLUA } from "getInstance";
import {
	BooleanLiteral,
	Expression,
	LocalStatement,
	Statement,
	StringLiteral,
	Identifier,
	NumericLiteral,
	NilLiteral,
	CallExpression,
	TableCallExpression,
	StringCallExpression,
	CallStatement,
	TableConstructorExpression,
	TableKey,
	TableKeyString,
	TableValue,
} from "./parser/astTypes";
import { parseAst } from "parser/astParser";
import { CallData, getInstancePath } from "utils";

interface GenerationSettings {
	useInstanceIds?: boolean;
	useRemoteId?: boolean;
	useNowDateTime?: boolean;
}

const InstanceVarMap = new Map<string, [string, Instance]>();

function getSafeBracketEquals(str: string) {
	let amtEquals = 0;
	while (str.match(`]${"=".rep(amtEquals)}]`)[0] || StringUtils.endsWith(str, `]${"=".rep(amtEquals)}`)) {
		amtEquals++;
	}
	return "=".rep(amtEquals);
}

function renderStringLiteral(value: string): string {
	const isMultiline = value.match("\n")[0];
	if (!isMultiline && !value.match('"')[0]) {
		return `"${value}"`;
	} else if (!isMultiline && !value.match("'")[0]) {
		return `'${value}'`;
	} else {
		const eqStr = getSafeBracketEquals(value);
		const spacing = "";
		return `${spacing}[${eqStr}[${value}]${eqStr}]${spacing}`;
	}
}

export function NewStringLiteral(value: string): StringLiteral {
	return {
		type: "StringLiteral",
		value: value,
		raw: renderStringLiteral(value),
	};
}

export function NewBooleanLiteral(value: boolean): BooleanLiteral {
	return {
		type: "BooleanLiteral",
		value: value,
		raw: value ? "true" : "false",
	};
}

export function NewIdentifier(name: string): Identifier {
	return {
		type: "Identifier",
		name: name,
	};
}

export function NewNumericLiteral(value: number): NumericLiteral {
	return {
		type: "NumericLiteral",
		value: value,
		raw: `${value}`,
	};
}

export function NewNilLiteral(): NilLiteral {
	return {
		type: "NilLiteral",
		value: undefined,
		raw: "nil",
	};
}

export function NewLocalStatement(name: string | string[], value: Expression | Expression[]): LocalStatement {
	return {
		type: "LocalStatement",
		variables: typeIs(name, "string") ? [NewIdentifier(name)] : name.map((n) => NewIdentifier(n)),
		init: "type" in value ? [value] : value,
	};
}

export function NewTableConstructorExpression(
	fields: (TableKey | TableKeyString | TableValue)[],
): TableConstructorExpression {
	return {
		type: "TableConstructorExpression",
		fields: fields,
	};
}

export function NewRawRender(value: string): StringLiteral {
	return {
		type: "StringLiteral",
		value: value,
		raw: value,
	};
}

function ASTTable(i: number, tbl: object, settings: GenerationSettings | undefined): [LocalStatement, string] {
	const fields: (TableKey | TableKeyString | TableValue)[] = [];

	let iteration = 0;

	for (const [k, v] of pairs(tbl)) {
		const ASTOrString = typeToAST(i, v, settings);
		let val: Expression;
		if (typeIs(ASTOrString, "string")) {
			val = NewRawRender(ASTOrString);
		} else {
			val = ASTOrString[0].init[0];
		}

		iteration++;
		if (typeIs(k, "number")) {
			if (iteration === k) {
				fields.push({
					type: "TableValue",
					value: val,
				});
			} else {
				fields.push({
					type: "TableKey",
					key: {
						type: "NumericLiteral",
						value: k as number,
						raw: `${k}`,
					},
					value: val,
				});
			}
		} else {
			fields.push({
				type: "TableKeyString",
				key: {
					type: "Identifier",
					name: k as string,
				},
				value: val,
			});
		}
	}

	return [NewLocalStatement(`_4lveTable${i}`, NewTableConstructorExpression(fields)), `_4lveTable${i}`];
}

function ASTInstance(
	i: number,
	inst: Instance,
	settings: GenerationSettings | undefined,
): [LocalStatement, string] | string {
	if (settings?.useInstanceIds) {
		InstanceVarMap.set(`_4lveInstance${i}`, [inst.GetDebugId(), inst]);
		return `_4lveInstance${i}`;
	} else {
		return [NewLocalStatement(`_4lveInstance${i}`, NewRawRender(getInstancePath(inst))), `_4lveInstance${i}`];
	}
}

function typeToAST(i: number, v: unknown, settings: GenerationSettings | undefined): [LocalStatement, string] | string {
	switch (typeOf(v)) {
		case "string":
			return [NewLocalStatement(`_4lveString${i}`, NewStringLiteral(v as string)), `_4lveString${i}`];
		case "number":
			return [NewLocalStatement(`_4lveNumber${i}`, NewNumericLiteral(v as number)), `_4lveNumber${i}`];
		case "table":
			return ASTTable(i, v as object, settings);
		case "boolean":
			return [NewLocalStatement(`_4lveBoolean${i}`, NewBooleanLiteral(v as boolean)), `_4lveBoolean${i}`];
		case "Instance":
			return ASTInstance(i, v as Instance, settings);
		case "nil":
			return [NewLocalStatement(`_4lveNil${i}`, NewNilLiteral()), `_4lveNil${i}`];
		case "DateTime":
			return [
				NewLocalStatement(
					`_4lveDateTime${i}`,
					settings?.useNowDateTime
						? NewRawRender(`DateTime.now()`)
						: NewRawRender(`DateTime.fromUnixTimestampMillis(${(v as DateTime).UnixTimestampMillis}})`),
				),
				`_4lveDateTime${i}`,
			];
		case "PathWaypoint":
			return [
				NewLocalStatement(
					`_4lvePathWaypoint${i}`,
					NewRawRender(
						`PathWaypoint.new(Vector3.new(${(v as PathWaypoint).Position}), ${(v as PathWaypoint).Action})`,
					),
				),
				`_4lvePathWaypoint${i}`,
			];
		case "Ray":
			return [
				NewLocalStatement(
					`_4lveRay${i}`,
					NewRawRender(`Ray.new(Vector3.new(${(v as Ray).Origin}), Vector3.new(${(v as Ray).Direction}))`),
				),
				`_4lveRay${i}`,
			];
		case "Region3":
			return [
				NewLocalStatement(
					`_4lveRegion3_${i}`,
					NewRawRender(
						`Region3.new(Vector3.new(${(v as Region3).CFrame.Position}), Vector3.new(${
							(v as Region3).Size
						}))`,
					),
				),
				`_4lveRegion3_${i}`,
			];
		case "ColorSequence":
			return [
				NewLocalStatement(
					`_4lveColorSequence${i}`,
					NewRawRender(
						`ColorSequence.new({${(v as ColorSequence).Keypoints.map(
							(k) =>
								`ColorSequenceKeypoint.new(${k.Time}, Color3.fromRGB(${k.Value.R}, ${k.Value.G}, ${k.Value.B}))`,
						).join(", ")}})`,
					),
				),
				`_4lveColorSequence${i}`,
			];
		case "NumberSequence":
			return [
				NewLocalStatement(
					`_4lveNumberSequence${i}`,
					NewRawRender(
						`NumberSequence.new({${(v as NumberSequence).Keypoints.map(
							(k) => `NumberSequenceKeypoint.new(${k.Time}, ${k.Value}, ${k.Envelope})`,
						).join(", ")}})`,
					),
				),
				`_4lveNumberSequence${i}`,
			];
		case "ColorSequenceKeypoint":
			return [
				NewLocalStatement(
					`_4lveColorSequenceKeypoint${i}`,
					NewRawRender(
						`ColorSequenceKeypoint.new(${(v as ColorSequenceKeypoint).Time}, Color3.fromRGB(${
							(v as ColorSequenceKeypoint).Value.R
						}, ${(v as ColorSequenceKeypoint).Value.G}, ${(v as ColorSequenceKeypoint).Value.B}))`,
					),
				),
				`_4lveColorSequenceKeypoint${i}`,
			];
		case "NumberSequenceKeypoint":
			return [
				NewLocalStatement(
					`_4lveNumberSequenceKeypoint${i}`,
					NewRawRender(
						`NumberSequenceKeypoint.new(${(v as NumberSequenceKeypoint).Time}, ${
							(v as NumberSequenceKeypoint).Value
						}, ${(v as NumberSequenceKeypoint).Envelope})`,
					),
				),
				`_4lveNumberSequenceKeypoint${i}`,
			];
		default:
			return [
				NewLocalStatement(`_4lve${typeOf(v)}_${i}`, NewRawRender(`${typeOf(v)}.new(${v})`)),
				`_4lve${typeOf(v)}_${i}`,
			];
	}
}

export function pseudoGenerate(
	callData: CallData,
	settings: GenerationSettings = {
		useInstanceIds: true,
		useRemoteId: true,
		useNowDateTime: true,
	},
): string {
	const { cScript, args, func, remoteType, returnData, remote } = callData;

	if (!cScript) return "--[[ SCRIPT IS NIL ]]";
	//if (!func) return "--[[ FUNCTION IS NIL ]]";

	print("Remote: " + getInstancePath(remote));

	//print("Func Hash: " + getfunctionhash(func));

	//print("Script Func Hash: " + getfunctionhash(getscriptfunction(cScript)));

	InstanceVarMap.clear();

	const body: Statement[] = [];

	const remoteCallArgs: string[] = [];
	// Notice shifted by 1
	// eslint-disable-next-line roblox-ts/no-array-pairs
	for (const [i, v] of pairs(args)) {
		const ast = typeToAST(i, v, settings);
		ast && !typeIs(ast, "string") && body.push(ast[0]);
		remoteCallArgs.push(!typeIs(ast, "string") ? ast[1] : ast);
	}

	settings.useRemoteId && InstanceVarMap.set("RemoteInstance", [remote.GetDebugId(), remote]);

	const instanceVariables: Identifier[] = [];
	const instanceArgs: Expression[] = [];
	let mappingComments = "";

	InstanceVarMap.forEach(([id, instance], name) => {
		instanceVariables.push({
			type: "Identifier",
			name: name,
		});
		instanceArgs.push({
			type: "StringLiteral",
			value: id,
			raw: `"${id}"`,
		});
		mappingComments += `--[[ ${name} = ${getInstancePath(instance)} --]]\n`;
	});

	const instanceBody: Statement[] = [
		{
			type: "LocalStatement",
			variables: instanceVariables,
			init: [
				{
					type: "CallExpression",
					base: {
						type: "Identifier",
						name: "GetInstancesFromIds",
					},
					arguments: instanceArgs,
				},
			],
		},
	];

	let remoteCallCode = settings.useRemoteId ? "RemoteInstance" : getInstancePath(callData.remote);

	if (callData.remoteType === "RemoteEvent") {
		remoteCallCode += ":FireServer(" + remoteCallArgs.join(", ") + ")";
	} else {
		remoteCallCode += ":InvokeServer(" + remoteCallArgs.join(", ") + ")";
	}

	return (
		"-- Pseudo code generated by 4lve's AST Renderer\n\n" +
		(InstanceVarMap.size() > 0
			? GetInstancesFromIdsLUA +
			  `\n\n${mappingComments}` +
			  parseAst({
					type: "Chunk",
					body: instanceBody,
			  }) +
			  "\n\n"
			: "") +
		parseAst({
			type: "Chunk",
			body: body,
		}) +
		"\n\n" +
		(callData.remoteType === "RemoteFunction" ? "local ReturnValue = " : "") +
		remoteCallCode +
		"\n"
	);
}
