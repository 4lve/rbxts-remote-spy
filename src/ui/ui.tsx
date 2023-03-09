import Roact from "@rbxts/roact";
import { Dispatch, SetStateAction, useEffect, useState, withHookDetection } from "@rbxts/roact-hooked";
import { remoteHook } from "remoteHook";
import { InternalRemoteSignal, restoremetatable } from "utils";
import {
	Button,
	CheckBox,
	ChildWindow,
	ColorPicker,
	DummyWindow,
	InLine,
	Label,
	LabelFont,
	MarginLeftAbsolute,
	MarginUp,
	RenderWindowRoact,
	Selectable,
	Separator,
	TabMenu,
	TextBox,
	getElementById,
} from "./RenderWindowRoact";
import { remoteCalls, remotesViewing } from "./config";

let roactInstance: Roact.Tree | undefined;

const icons = {
	Search: "\xEF\x80\x82",
	Settings: "\xEF\x80\x93",
	Exit: "\xef\x80\x91",
	Pause: "\xEF\x8A\x8B",
	Play: "\xEF\x80\x9D",

	Synapse: "\xee\x80\x89",
	Roblox: "\xee\x80\x88",

	FireServer: "\xee\x80\x80",
	InvokeServer: "\xee\x80\x81",
	BindableEvent: "\xee\x80\x82",
	BindableFunction: "\xee\x80\x83",
};

let fontData: string;
function getFontData() {
	if (fontData) return fontData;

	fontData = syn.request({
		Url: "https://raw.githubusercontent.com/GameGuyThrowaway/RemoteSpy/main/Icons.ttf",
	}).Body;

	return fontData;
}

const Settings = ({ visible }: { visible: boolean }) => {
	return (
		<RenderWindowRoact
			name="4lve's Remote Spy Settings"
			id="4lveSettings"
			visible={visible}
			onTop={true}
			style={[
				[RenderStyleOption.WindowPadding, new Vector2(5, 5)],
				[RenderStyleOption.PopupRounding, 8],
				[RenderStyleOption.FrameRounding, 5],
				[RenderStyleOption.WindowRounding, 8],
				[RenderStyleOption.WindowBorderSize, 1],
				[RenderStyleOption.WindowTitleAlign, new Vector2(0.5, 0.5)],
			]}
		>
			<Label text="Settings" />
		</RenderWindowRoact>
	);
};

const App = () => {
	const fontData = getFontData();

	Drawing.WaitForRenderer();

	const RemoteIconFont = DrawFont.Register(fontData, {
		Scale: false,
		Bold: false,
		UseStb: false,
		PixelSize: 18,
		Glyphs: [[0xe000, 0xe007]],
	});

	const CallerIconFont = DrawFont.Register(fontData, {
		Scale: false,
		Bold: false,
		UseStb: false,
		PixelSize: 27,
		Glyphs: [[0xe008, 0xe009]],
	});

	const DefaultTextFont = DrawFont.RegisterDefault("NotoSans_Regular", {
		Scale: false,
		Bold: false,
		UseStb: true,
		PixelSize: 16,
	});

	const [settingsOpen, setSettingsOpen] = useState(false);
	const [remotes, setRemotes] = useState<(RemoteEvent | RemoteFunction | BindableEvent | BindableFunction)[]>([]);

	const updateRemotesList = () => {
		let remotesTemp: (RemoteEvent | RemoteFunction | BindableEvent | BindableFunction)[] = [];
		remoteCalls.forEach((callData2, remote) => {
			if (remotesViewing[callData2[0].remoteType]) {
				remotesTemp.push(remote);
			}
		});
		setRemotes(remotesTemp);
	};

	useEffect(() => {
		remoteHook();
		InternalRemoteSignal.Connect((callData) => {
			if (!remoteCalls.has(callData.remote)) {
				remoteCalls.set(callData.remote, [callData]);
			} else {
				remoteCalls.get(callData.remote)!.push(callData);
			}
			updateRemotesList();
		});
	}, []);

	return (
		<RenderWindowRoact
			name={`4lve's Remote Spy`}
			onTop={true}
			style={[
				[RenderStyleOption.WindowPadding, new Vector2(5, 5)],
				[RenderStyleOption.PopupRounding, 8],
				[RenderStyleOption.FrameRounding, 5],
				[RenderStyleOption.WindowRounding, 8],
				[RenderStyleOption.WindowBorderSize, 1],
				[RenderStyleOption.WindowTitleAlign, new Vector2(0.5, 0.5)],
			]}
			color={[[RenderColorOption.Separator, Color3.fromRGB(74, 74, 74), 1]]}
			minSize={new Vector2(600, 400)}
			maxSize={new Vector2(600, 1000)}
			id="4RemoteSpy"
		>
			<Settings visible={settingsOpen} />
			<MarginLeftAbsolute pixels={5}>
				<InLine>
					<DummyWindow>
						<TextBox
							text=""
							maxLength={100}
							onChange={(text) => {
								const searchLabel = getElementById("searchLabel") as RenderLabel;
								if (text === "") {
									searchLabel.Label = `${icons.Search}  Search`;
								} else {
									searchLabel.Label = icons.Search;
								}
							}}
						/>
					</DummyWindow>

					<DummyWindow style={[[RenderStyleOption.ButtonTextAlign, new Vector2(0.5, 0.5)]]}>
						<MarginLeftAbsolute pixels={480}>
							<InLine>
								<Button text={icons.Play} size={new Vector2(27, 27)} onClick={() => {}} />
								<Button
									text={icons.Settings}
									size={new Vector2(27, 27)}
									onClick={() => {
										setSettingsOpen((old) => !old);
									}}
								/>
								<Button
									text={icons.Exit}
									size={new Vector2(27, 27)}
									onClick={() => {
										roactInstance && Roact.unmount(roactInstance);
										restoremetatable(game, "__namecall");
									}}
								/>
							</InLine>
						</MarginLeftAbsolute>
					</DummyWindow>
					<MarginLeftAbsolute pixels={5}>
						<Label text={`${icons.Search}  Search`} id="searchLabel" />
					</MarginLeftAbsolute>
				</InLine>
			</MarginLeftAbsolute>
			<Separator />
			<InLine>
				<LabelFont font={RemoteIconFont}>
					<InLine>
						<LabelFont font={DefaultTextFont}>
							<CheckBox
								text={`Fire Server`}
								defaultValue={remotesViewing.RemoteEvent}
								onToggle={(value) => {
									remotesViewing.RemoteEvent = value;
									updateRemotesList();
								}}
							/>
						</LabelFont>
						<Label text={icons.FireServer} />

						<MarginLeftAbsolute pixels={140}>
							<InLine>
								<LabelFont font={DefaultTextFont}>
									<CheckBox
										text={`Invoke Server`}
										defaultValue={remotesViewing.RemoteFunction}
										onToggle={(value) => {
											remotesViewing.RemoteFunction = value;
											updateRemotesList();
										}}
									/>
								</LabelFont>
								<Label text={icons.InvokeServer} />
							</InLine>
						</MarginLeftAbsolute>
						<MarginLeftAbsolute pixels={280}>
							<InLine>
								<LabelFont font={DefaultTextFont}>
									<CheckBox
										text={`Bindable Event`}
										defaultValue={remotesViewing.BindableEvent}
										onToggle={(value) => {
											remotesViewing.BindableEvent = value;
											updateRemotesList();
										}}
									/>
								</LabelFont>
								<Label text={icons.BindableEvent} />
							</InLine>
						</MarginLeftAbsolute>
						<MarginLeftAbsolute pixels={420}>
							<InLine>
								<LabelFont font={DefaultTextFont}>
									<CheckBox
										text={`Bindable Function`}
										defaultValue={remotesViewing.BindableFunction}
										onToggle={(value) => {
											remotesViewing.BindableFunction = value;
											updateRemotesList();
										}}
									/>
								</LabelFont>
								<Label text={icons.BindableFunction} />
							</InLine>
						</MarginLeftAbsolute>
					</InLine>
				</LabelFont>
			</InLine>
			<Separator />

			<ChildWindow
				color={[[RenderColorOption.ChildBg, Color3.fromRGB(28, 28, 28), 1]]}
				size={new Vector2(590, 32)}
			>
				<MarginUp amount={4} />
				<InLine>
					<MarginLeftAbsolute pixels={6}>
						<Selectable text="                 OpenEgg" size={new Vector2(600 - 327 - 4 - 14, 24)} />
					</MarginLeftAbsolute>
					<MarginUp amount={3} />
					<LabelFont font={RemoteIconFont}>
						<MarginLeftAbsolute pixels={6}>
							<Label text={`${icons.FireServer}   `} />
						</MarginLeftAbsolute>
					</LabelFont>
					<InLine color={[[RenderColorOption.Text, Color3.fromRGB(8, 140, 173), 1]]}>
						<MarginLeftAbsolute pixels={27}>
							<Label text="999+" />
						</MarginLeftAbsolute>
					</InLine>
				</InLine>
			</ChildWindow>

			{remotes.map((remote) => {
				return <Label text={remote.Name} />;
			})}
		</RenderWindowRoact>
	);
};

export function Ui() {
	withHookDetection(Roact);
	roactInstance = Roact.mount(<App />);
}
