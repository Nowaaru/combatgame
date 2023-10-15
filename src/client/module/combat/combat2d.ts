import { Components } from "@flamework/components";
import { Controller, Dependency, OnInit, OnStart } from "@flamework/core";
import { MotionInput } from "client/controllers/motioninput.controller";
import { CombatController } from "client/module/combat";
import { Animator } from "shared/components/animator.component";
import { Client, ClientEvents, ClientFunctions } from "shared/network";
import { Input, InputMode, InputResult, Motion } from "shared/util/input";
import { EntityState } from "shared/util/lib";

import { Players } from "@rbxts/services";
import { CharacterSelectController } from "client/controllers/characterselect.controller";
import { OnKeyboardInput } from "client/controllers/keyboard.controller";
import Character from "shared/util/character";
import { CameraController2D } from "../camera/camera2d";

export abstract class CombatController2D extends CombatController implements OnInit, OnKeyboardInput
{
    constructor(protected readonly motionInputController: MotionInput.MotionInputController, protected readonly cameraController2D: CameraController2D)
    {
        super();
    }

    onInit()
    {
        /*
        ClientEvents.SetCombatMode.connect(async (combatMode) =>
        {
            if (combatMode === Client.CombatMode.TwoDimensional)
            {
                const thisMatch = await ClientFunctions.GetCurrentMatch();
                assert(thisMatch, "no match found");

                this.cameraController2D.SetCameraEnabled(true);
                this.cameraController2D.SetParticipants(...[ ...thisMatch.Participants.mapFiltered(({ ParticipantId }) =>
                {
                    return Players.GetPlayers().find((p) => p.GetAttribute("ParticipantId") === ParticipantId)?.Character;
                }) * ... entity model support here ... * ]);
            }
        });
        */
    }

    protected keybindMap: Map<Enum.KeyCode, Input> = new Map();

    protected validateInput(attacks: Character.Character["Attacks"], input: (Motion | Input)[])
    {
        for (const [ _input ] of attacks)
        {
            if (_input.every((a, b) => input[b] === a))
                return true;
        }

        return false;
    }

    protected handleOffensiveInput(buttonPressed: Enum.KeyCode)
    {
        if (!this.IsEnabled())
            return false;

        const Characters = Dependency<CharacterSelectController>().characters;
        print("button:", buttonPressed, "character:", this.character, "sc:", this.selectedCharacter);
        const buttonType = this.keybindMap.get(buttonPressed);
        if (!this.character)
            return InputResult.Fail;

        if (!this.selectedCharacter)
            return InputResult.Fail;

        assert(Characters.has(this.selectedCharacter.Name), "selected character does not exist");
        if (buttonType)
        {
            const characterAnimator = Dependency<Components>().getComponent(this.character, Animator.Animator);
            assert(characterAnimator, `no characterAnimator found in character ${this.character}`);

            const lockedMotionInput = this.motionInputController.pushToMotionInput(buttonType)!;
            const inputMotion = lockedMotionInput.GetInputsFilterNeutral();
            print("inputMotion", inputMotion);

            if (inputMotion.size() === 1)
            { // this likely means that it's a neutral input
                if (this.validateInput(Characters.get(this.selectedCharacter.Name)!.Attacks, lockedMotionInput.GetInputs()))
                {
                    ClientFunctions[buttonType as Input].invoke();

                    return InputResult.Success;
                }
            }
            else
            {
                ClientFunctions.SubmitMotionInput(inputMotion);
            }
        }

        return InputResult.Fail;
    }

    onKeyboardInput(buttonPressed: Enum.KeyCode, inputMode: InputMode): boolean | InputResult | (() => boolean | InputResult)
    {
        print("enabled:", this.IsEnabled());
        if (!this.IsEnabled())
            return false;

        if (inputMode !== InputMode.Press)
            return false;

        return this.handleOffensiveInput(buttonPressed);
    }
}
