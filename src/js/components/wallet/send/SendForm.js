/* @flow */
'use strict';

import React, { Component } from 'react';
import Select from 'react-select';
import AdvancedForm from './AdvancedForm';
import PendingTransactions from './PendingTransactions';
import { FeeSelectValue, FeeSelectOption } from './FeeSelect';
import { Notification } from '../../common/Notification';
import AbstractAccount from '../account/AbstractAccount';

export default class Send extends AbstractAccount {
    render() {
        return super.render(this.props.sendForm) || _render(this.props, this.device, this.discovery, this.account, this.deviceStatusNotification);
    }
}


const _render = (props: any, device, discovery, account, deviceStatusNotification): any => {

    // const device = props.devices.find(device => device.state === props.sendForm.deviceState);
    // const discovery = props.discovery.find(d => d.deviceState === device.state && d.network === props.sendForm.network);
    // const account = props.accounts.find(a => a.deviceState === props.sendForm.deviceState && a.index === props.sendForm.accountIndex && a.network === props.sendForm.network);
    const addressTokens = props.tokens.filter(t => t.ethAddress === account.address);

    const { 
        address,
        amount,
        setMax,
        network,
        coinSymbol,
        token,
        feeLevels,
        fee,
        selectedFeeLevel,
        gasPriceNeedsUpdate,
        total,
        errors,
        warnings,
        infos,
        advanced,
        sending,
    } = props.sendForm;

    const {
        onAddressChange,
        onAmountChange,
        onSetMax,
        onCurrencyChange,
        onFeeLevelChange,
        updateFeeLevels,
        onSend,
    } = props.sendFormActions;

    const { config } = props.localStorage;
    const selectedCoin = config.coins.find(c => c.network === network);
    const fiatRate = props.fiat.find(f => f.network === selectedCoin.network);

    const tokens = addressTokens.map(t => {
        return { value: t.symbol, label: t.symbol };
    });
    tokens.unshift({ value: selectedCoin.network, label: selectedCoin.symbol });

    const setMaxClassName: string = setMax ? 'set-max enabled' : 'set-max';

    let updateFeeLevelsButton = null;
    if (gasPriceNeedsUpdate) {
        updateFeeLevelsButton = (
            <span className="update-fee-levels">Recommended fees updated. <a onClick={ updateFeeLevels }>Click here to use them</a></span>
        )
    }

    let addressClassName: ?string;
    if (errors.address) {
        addressClassName = 'not-valid';
    } else if (warnings.address) {
        addressClassName = 'warning';
    } else if (address.length > 0) {
        addressClassName = 'valid';
    }

    let buttonDisabled: boolean = Object.keys(errors).length > 0 || total === '0' || amount.length === 0 || address.length === 0 || sending;
    let buttonLabel: string = 'Send';
    if (network !== token && amount.length > 0 && !errors.amount) {
        buttonLabel += ` ${amount} ${ token.toUpperCase() }`
    } else if (network === token && total !== '0') {
        buttonLabel += ` ${total} ${ selectedCoin.symbol }`;
    }
    
    if (device) {

        if (!device.connected){
            buttonLabel = 'Device is not connected';
            buttonDisabled = true;
        } else if (!device.available) {
            buttonLabel = 'Device is unavailable';
            buttonDisabled = true;
        }
        
    }

    let notification = null;

    return (
        <section className="send-form">

            { deviceStatusNotification }

            <h2>Send Ethereum or tokens</h2>
            <div className="row address-input">
                <label>Address</label>
                <input 
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    value={ address }
                    className={ addressClassName }
                    onChange={ event => onAddressChange(event.target.value) } />
                <span className="input-icon"></span>
                { errors.address ? (<span className="error">{ errors.address }</span>) : null }
                { warnings.address ? (<span className="warning">{ warnings.address }</span>) : null }
                { infos.address ? (<span className="info">{ infos.address }</span>) : null }
            </div>

            <div className="row">
                <label>Amount</label>
                <div className="amount-input">
                    <input 
                        type="text"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        value={ amount }
                        className={ errors.amount ? 'not-valid' : null }
                        onChange={ event => onAmountChange(event.target.value) } />

                    <a className={ setMaxClassName } onClick={ onSetMax }>Set max</a>

                    <Select
                        name="currency"
                        className="currency"
                        searchable={ false }
                        clearable= { false }
                        multi={ false }
                        value={ token }
                        disabled={ tokens.length < 2 }
                        onChange={ onCurrencyChange }
                        options={ tokens } />
                </div>
                { errors.amount ? (<span className="error">{ errors.amount }</span>) : null }
                { warnings.amount ? (<span className="warning">{ warnings.amount }</span>) : null }
            </div>

            <div className="row">
                <label>Fee{ updateFeeLevelsButton }</label>
                <Select 
                    name="fee"
                    className="fee"
                    searchable={ false }
                    clearable= { false }
                    value={ selectedFeeLevel }
                    onChange={ onFeeLevelChange }
                    valueComponent={ FeeSelectValue }
                    optionComponent={ FeeSelectOption }
                    optionClassName="fee-option"
                    options={ feeLevels } />
            </div>

            <AdvancedForm { ...props}>
                <button disabled={ buttonDisabled } onClick={ event => onSend() }>{ buttonLabel }</button>
            </AdvancedForm>

            <PendingTransactions {...props} selectedCoin={selectedCoin} />
    
        </section>
    );
}
