import { Component } from "@flamework/components";
import { HttpService, Workspace } from "@rbxts/services";
import { Identifier } from "shared/util/identifier";
import { EntityState } from "shared/util/lib";
import { StatefulComponent, StateAttributes } from "./state.component";


export interface EntityAttributes extends StateAttributes
    {
        /**
         * The ID of the entity.
         */
        EntityId: string,
        /**
         * The maximum health of the entity.
         */
        MaxHealth: number,
        /**
         * The current health of the entity.
         */
        Health: number,

        /**
         * The amount of frames that the entity
         * is physically frozen for.
         *
         * When this integer is above 0, the entity's
         * current animation is stopped and they are
         * stuck in place for this many frames.
         */
        HitStop: number | -1,
    }

@Component({
    defaults:
    {
    MaxHealth: 100,
    Health: 100,

    HitStop: -1,

    EntityId: "generate",
    State: EntityState.Idle,
    }
    })
export class Entity<I extends EntityAttributes = EntityAttributes> extends StatefulComponent<I, Model & {PrimaryPart: BasePart, Humanoid: Humanoid}>
{
        private readonly id = Identifier.GenerateComponentId(this, "EntityId");

        constructor()
        {
            super();
            this.onAttributeChanged("EntityId", () =>
            {
                if (this.attributes.EntityId !== this.id)

                    this.attributes.EntityId = this.id;
            });
        }

        private tickDowns: Set<defined> = new Set();
        protected tickDown<V = I>(attr: keyof {
            [K in keyof V as (V[K] extends number ? K : never )]: number
        })
        {
            const attributeKey = tostring(attr) as keyof I;
            const attributeValue = this.attributes[ attributeKey ];
            assert(attr && attr in this.attributes, `invalid attribute: ${attributeKey as string}`);
            assert(typeIs(attributeValue, "number"), `invalid attribute type of ${attributeKey as string} for tickDown: ${typeOf(attr)}`);

            // wait for one extra frame if the tickdown
            // was just applied
            if (this.tickDowns.has(attributeKey))
            {
                if (attributeValue > 0)

                    this.setAttribute(attributeKey, attributeValue - 1 as never);

                else if (attributeValue !== -1)
                {
                    this.tickDowns.delete(attributeKey);
                    this.setAttribute(attributeKey, -1 as never);
                }
            }
            else if (attributeValue > 0)

                this.tickDowns.add(attributeKey);
        }

        public SetHitstop(hitstop: number)
        {
            this.attributes.HitStop = hitstop;
        }

        public IsGrounded()
        {
            const isPhysicallyGrounded = this.humanoid.FloorMaterial !== Enum.Material.Air;
            if (isPhysicallyGrounded)

                return true;

            const characterPosition = this.instance.GetPivot();
            const raycastParams = new RaycastParams();
            raycastParams.FilterDescendantsInstances = [Workspace.WaitForChild("CharacterContainer")];
            raycastParams.FilterType = Enum.RaycastFilterType.Exclude;

            const boxResult = Workspace.Blockcast(
                characterPosition,
                this.instance.GetExtentsSize(),
                new Vector3(0, -this.humanoid.HipHeight * 1.125, 0),
                raycastParams
            );

            if (boxResult)

                return true;

            return false;
        }

        public IsMoving()
        {
            return this.humanoid.MoveDirection !== Vector3.zero;
        }

        public GetPrimaryPart()
        {
            assert(this.instance.PrimaryPart, "primary part not found");

            return this.instance.PrimaryPart;
        }

        public readonly humanoid = this.instance.WaitForChild("Humanoid") as Humanoid;

        public readonly entityId = HttpService.GenerateGUID(false);

        public readonly baseWalkSpeed = 16;

        public readonly sprintWalkSpeed = 24;
}