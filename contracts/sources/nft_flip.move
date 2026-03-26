module nft_flip::nftflip {
    use one::event;
    use one::object::{Self, UID};
    use one::transfer;
    use one::tx_context::{sender, TxContext};
    use std::vector;

    public struct Flip has copy, drop, store {
        player: address,
        rarity: u8,
        nonce: u64,
    }

    public struct Machine has key, store {
        id: UID,
        creator: address,
        total_mints: u64,
        flips: vector<Flip>,
    }

    public struct MachineCreated has copy, drop, store {
        machine_id: address,
        creator: address,
    }

    public struct FlipMinted has copy, drop, store {
        machine_id: address,
        player: address,
        rarity: u8,
        nonce: u64,
    }

    public entry fun create_machine(ctx: &mut TxContext) {
        let machine = Machine {
            id: object::new(ctx),
            creator: sender(ctx),
            total_mints: 0,
            flips: vector::empty<Flip>(),
        };

        let machine_id = object::uid_to_address(&machine.id);
        event::emit(MachineCreated {
            machine_id,
            creator: sender(ctx),
        });

        transfer::share_object(machine);
    }

    public entry fun mint(machine: &mut Machine, ctx: &mut TxContext) {
        let who = sender(ctx);
        let nonce = machine.total_mints + 1;
        let roll = (nonce * 17 + 13) % 100;
        let rarity = if (roll < 70) {
            0
        } else if (roll < 95) {
            1
        } else {
            2
        };

        vector::push_back(&mut machine.flips, Flip {
            player: who,
            rarity,
            nonce,
        });
        machine.total_mints = nonce;

        event::emit(FlipMinted {
            machine_id: object::uid_to_address(&machine.id),
            player: who,
            rarity,
            nonce,
        });
    }
}
