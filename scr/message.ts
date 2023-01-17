import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { bedrockServer } from "bdsx/launcher";
import { serverProperties } from "bdsx/serverproperties";
import { gray } from "colors";
import {
    BlockColorWordTitle,
    ChatCutLongMessageLength,
    ChatCutLongMessageTitle,
    ChatCutSameMessageTitle,
    ChatCutSpeedMessageTime,
    ChatCutSpeedMessageTitle,
    ChatCutWhisperMessageLength,
    ChatCutWhisperMessageTitle,
    MuteMessage,
    SystemMessageTitle,
    UseBlockColorWord,
    UseChatCut,
} from "../setting";
import { addlog } from "./log";
const levelname = serverProperties["level-name"];

const runCommand = bedrockServer.executeCommand;

events.packetBefore(MinecraftPacketIds.Text).on((ptr, ni, id) => {
    const today = new Date();
    const hours = today.getHours();
    const minutes = today.getMinutes();
    const seconds = today.getSeconds();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const message = ptr.message.replace(/"/g, "''");
    const username = ni.getActor()!.getNameTag();

    if (ni.getActor()?.hasTag("mute")) {
        console.log(gray(`[${month}/${day}/${hours}/${minutes}/${seconds}] <${username}> : ${message}`));
        runCommand(`tellraw @a[name="${username}"] {"rawtext":[{"text":"${SystemMessageTitle} ${MuteMessage}"}]}`);
        return CANCEL;
    }
    console.log(gray(`[${month}/${day}/${hours}/${minutes}/${seconds}] <${username}> : ${message}`));
    addlog(`<${username}> : ${message}`);
});

events.packetAfter(MinecraftPacketIds.CommandRequest).on((pkt, ni, id) => {
    const message = pkt.command;

    if (message.startsWith("/")) {
        const today = new Date();
        const hours = today.getHours();
        const minutes = today.getMinutes();
        const seconds = today.getSeconds();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        const username = ni.getActor()?.getNameTag();

        console.log(gray(`[${month}/${day}/${hours}:${minutes}:${seconds}] <${username}> : ${message}`));
        addlog(`<${username}> : ${message}`);
    }
});

if (UseChatCut) {
    const lastChatTimes: Record<string, number> = {};
    const LastChat: Record<string, string> = {};
    events.packetBefore(MinecraftPacketIds.Text).on((pkt, ni, id) => {
        const actor = ni.getActor()!;
        const username = actor.getNameTag();
        const msg = pkt.message.replace(" ", "");

        if (msg.length > ChatCutLongMessageLength) {
            runCommand(`tellraw @a[name="${username}"] {"rawtext":[{"text":"${SystemMessageTitle} ${ChatCutLongMessageTitle}"}]}`);
            return CANCEL;
        }

        if (lastChatTimes[username] === undefined) {
            lastChatTimes[username] = Date.now();
        } else if (Date.now() - lastChatTimes[username] < ChatCutSpeedMessageTime) {
            runCommand(`tellraw @a[name="${username}"] {"rawtext":[{"text":"${SystemMessageTitle} ${ChatCutSpeedMessageTitle}"}]}`);
            return CANCEL;
        } else {
            lastChatTimes[username] = Date.now();
        }

        if (!LastChat[username]) {
            LastChat[username] = msg;
        } else if (LastChat[username]) {
            const oldMsg = LastChat[username];

            if (msg === oldMsg) {
                LastChat[username] = msg;
                actor.sendMessage(ChatCutSameMessageTitle);
                return CANCEL;
            }
            if (Math.abs(oldMsg.length - msg.length) < 3) {
                if (oldMsg.includes(msg) || msg.includes(oldMsg)) {
                    LastChat[username] = msg;
                    actor.sendMessage(ChatCutSameMessageTitle);
                    return CANCEL;
                }
            }
        }
        LastChat[username] = msg;
    });
}

events.command.on((command, origin) => {
    const cmdhead = command.split(" ")[0];
    if (UseChatCut) {
        if (cmdhead === "/w") {
            if (ChatCutWhisperMessageLength) {
                runCommand(`tellraw "${origin}" {"rawtext":[{"text":"${SystemMessageTitle} ${ChatCutWhisperMessageTitle}"}]}`);
                return 0;
            }
        }

        if (cmdhead === "/tell") {
            if (ChatCutWhisperMessageLength) {
                runCommand(`tellraw "${origin}" {"rawtext":[{"text":"${SystemMessageTitle} ${ChatCutWhisperMessageTitle}"}]}`);
                return 0;
            }
        }

        if (cmdhead === "/msg") {
            if (ChatCutWhisperMessageLength) {
                runCommand(`tellraw "${origin}" {"rawtext":[{"text":"${SystemMessageTitle} ${ChatCutWhisperMessageTitle}"}]}`);
                return 0;
            }
        }

        if (cmdhead === "/me") {
            if (ChatCutWhisperMessageLength) {
                runCommand(`tellraw "${origin}" {"rawtext":[{"text":"${SystemMessageTitle} ${ChatCutWhisperMessageTitle}"}]}`);
                return 0;
            }
        }
    }
});

if (UseBlockColorWord === true) {
    events.packetBefore(MinecraftPacketIds.Text).on((ptr, ni, id) => {
        const actor = ni.getActor()!;
        const username = actor.getNameTag();

        if (UseBlockColorWord === true) {
            if (ptr.message?.includes("§")) {
                runCommand(`tellraw @a[name="${username}"] {"rawtext":[{"text":"${SystemMessageTitle} ${BlockColorWordTitle}"}]}`);
                return CANCEL;
            }
        }
    });
}

console.info("[ " + "sos9533scr".yellow + " ] " + `${levelname}`.red + ` - message.ts loaded`.gray);
