/* @flow */

import * as BLOCKCHAIN from 'actions/constants/blockchain';
import * as EthereumBlockchainActions from 'actions/ethereum/BlockchainActions';
import * as RippleBlockchainActions from 'actions/ripple/BlockchainActions';
import { resolveAfter } from 'utils/promiseUtils';

import type { Dispatch, GetState, PromiseAction, BlockchainFeeLevel } from 'flowtype';
import type { BlockchainBlock, BlockchainNotification, BlockchainError } from 'trezor-connect';

export type BlockchainAction =
    | {
          type: typeof BLOCKCHAIN.READY,
      }
    | {
          type: typeof BLOCKCHAIN.UPDATE_FEE,
          shortcut: string,
          feeLevels: Array<BlockchainFeeLevel>,
      }
    | {
          type: typeof BLOCKCHAIN.START_SUBSCRIBE,
          shortcut: string,
      };

// Conditionally subscribe to blockchain backend
// called after TrezorConnect.init successfully emits TRANSPORT.START event
// checks if there are discovery processes loaded from LocalStorage
// if so starts subscription to proper networks
export const init = (): PromiseAction<void> => async (
    dispatch: Dispatch,
    getState: GetState
): Promise<void> => {
    if (getState().discovery.length > 0) {
        // get unique networks
        const networks: Array<string> = [];
        getState().discovery.forEach(discovery => {
            if (networks.indexOf(discovery.network) < 0) {
                networks.push(discovery.network);
            }
        });

        // subscribe
        const results = networks.map(n => dispatch(subscribe(n)));
        // wait for all subscriptions
        await Promise.all(results);
    }

    // continue wallet initialization
    dispatch({
        type: BLOCKCHAIN.READY,
    });
};

export const subscribe = (networkName: string): PromiseAction<void> => async (
    dispatch: Dispatch,
    getState: GetState
): Promise<void> => {
    const { config } = getState().localStorage;
    const network = config.networks.find(c => c.shortcut === networkName);
    if (!network) return;

    dispatch({
        type: BLOCKCHAIN.START_SUBSCRIBE,
        shortcut: network.shortcut,
    });

    switch (network.type) {
        case 'ethereum':
            await dispatch(EthereumBlockchainActions.subscribe(networkName));
            break;
        case 'ripple':
            await dispatch(RippleBlockchainActions.subscribe(networkName));
            break;
        default:
            break;
    }
};

export const onBlockMined = (payload: BlockchainBlock): PromiseAction<void> => async (
    dispatch: Dispatch,
    getState: GetState
): Promise<void> => {
    const shortcut = payload.coin.shortcut.toLowerCase();
    const { config } = getState().localStorage;
    const network = config.networks.find(c => c.shortcut === shortcut);
    if (!network) return;

    switch (network.type) {
        case 'ethereum':
            await dispatch(EthereumBlockchainActions.onBlockMined(network));
            break;
        case 'ripple':
            await dispatch(RippleBlockchainActions.onBlockMined(network));
            break;
        default:
            break;
    }
};

export const onNotification = (payload: BlockchainNotification): PromiseAction<void> => async (
    dispatch: Dispatch,
    getState: GetState
): Promise<void> => {
    const shortcut = payload.coin.shortcut.toLowerCase();
    const { config } = getState().localStorage;
    const network = config.networks.find(c => c.shortcut === shortcut);
    if (!network) return;

    switch (network.type) {
        case 'ethereum':
            await dispatch(EthereumBlockchainActions.onNotification(payload, network));
            break;
        case 'ripple':
            await dispatch(RippleBlockchainActions.onNotification(payload, network));
            break;
        default:
            break;
    }
};

// Handle BLOCKCHAIN.ERROR event from TrezorConnect
// disconnect and remove Web3 websocket instance if exists
export const onError = (payload: BlockchainError): PromiseAction<void> => async (
    dispatch: Dispatch,
    getState: GetState
): Promise<void> => {
    const shortcut = payload.coin.shortcut.toLowerCase();
    const { config } = getState().localStorage;
    const network = config.networks.find(c => c.shortcut === shortcut);
    if (!network) return;

    dispatch(autoReconnect(shortcut));

    switch (network.type) {
        case 'ethereum':
            await dispatch(EthereumBlockchainActions.onError(shortcut));
            break;
        case 'ripple':
            // this error is handled in BlockchainReducer
            // await dispatch(RippleBlockchainActions.onBlockMined(shortcut));
            break;
        default:
            break;
    }
};

const autoReconnect = (shortcut: string): PromiseAction<void> => async (
    dispatch: Dispatch,
    getState: GetState
): Promise<void> => {
    let blockchain = getState().blockchain.find(b => b.shortcut === shortcut);
    if (!blockchain || blockchain.reconnectionAttempts >= 5) return;

    await resolveAfter(5000 * (blockchain.reconnectionAttempts + 1));

    blockchain = getState().blockchain.find(b => b.shortcut === shortcut);
    if (!blockchain || blockchain.connected || blockchain.connecting) return;

    await dispatch(subscribe(shortcut));
};
