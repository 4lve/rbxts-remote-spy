export function GetInstancesFromIds(...ids: LuaTuple<(string | Instance)[]>): LuaTuple<(string | Instance)[]> {
	const instances = [...getnilinstances(), ...getweakdescendants(game)];

	const instancesToFind = ids.size();

	let foundInstances = 0;

	instances.forEach((instance) => {
		if (instancesToFind === foundInstances) return;
		const debugId = instance.GetDebugId();
		ids.forEach((id, i) => {
			if (debugId === id) {
				foundInstances++;
				ids[i] = instance;
			}
		});
	});

	ids.forEach((id, i) => {
		if (typeIs(id, "string")) {
			ids[i] = "nil -- Could not find instance with id: " + id;
		}
	});

	return $tuple(...ids);
}

export const GetInstancesFromIdsLUA = `function GetInstancesFromIds(...) local ids = ({ ... });local _array = ({});local _length = # _array;local _array_1 = getnilinstances();local _Length = # _array_1;table.move(_array_1, 1, _Length, (_length + 1), _array);_length = (_length + _Length);local _array_2 = getweakdescendants(game);table.move(_array_2, 1, # _array_2, (_length + 1), _array);local instances = _array;local instancesToFind = # ids;local foundInstances = 0;local _arg0 = (function(instance) if (instancesToFind == foundInstances) then return nil;end;local debugId = instance:GetDebugId();local _ids = ids;local _arg0_1 = (function(id, i) if (debugId == id) then foundInstances = (foundInstances + 1);ids[(i + 1)] = instance;end;end);for _k, _v in _ids do _arg0_1(_v, (_k - 1), _ids);end;end);for _k, _v in instances do _arg0(_v, (_k - 1), instances);end;local _ids = ids;local _arg0_1 = (function(id, i) local _id = id;if (type(_id) == "string") then ids[(i + 1)] = ("nil -- Could not find instance with id: " .. id);end;end);for _k, _v in _ids do _arg0_1(_v, (_k - 1), _ids);end;return unpack(ids);end;`;
