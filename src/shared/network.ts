import { Networking } from "@flamework/networking";
import type { SprintState } from "server/services/movement.service";
import { Input, Motion, MotionInput } from "./util/input";
import type { EntityState } from "./util/lib";

interface ServerEvents {
}

interface ClientEvents {
    Tick(frameTime: number, tickRate: number): number
    Jump(character: Model & { Humanoid: Humanoid, PrimaryPart: BasePart } ): void;
}

interface GameFunctions {
    GetGameTickRate(): number
}

interface MovementFunctions {
    Crouch(crouchState: EntityState.Crouch | EntityState.Idle): boolean
    Jump(): boolean
}

type InputFunctions = {
    [key in Input]: (this: InputFunctions) => boolean;
}
interface CombatFunctions extends InputFunctions {
    SubmitMotionInput(motionInput: MotionInput): boolean;
}


interface ServerFunctions extends CombatFunctions, GameFunctions, MovementFunctions {
    RespawnCharacter(characterId: string): boolean;
    RequestSprint(sprintState: SprintState): boolean;

    KnockbackTest(): boolean;
    TrailTest(): boolean;
}

interface ClientFunctions {
}

export const GlobalEvents = Networking.createEvent<ServerEvents, ClientEvents>();
export const GlobalFunctions = Networking.createFunction<ServerFunctions, ClientFunctions>();

export const ServerFunctions = GlobalFunctions.server;
export const ClientFunctions = GlobalFunctions.client;

export const ServerEvents = GlobalEvents.server;
export const ClientEvents = GlobalEvents.client;
