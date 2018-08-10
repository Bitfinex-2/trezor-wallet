/* @flow */
import { H2 } from '~/js/components/common/Heading';
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

const Initialize = () => (
    <section className="device-settings">
        <div className="row">
            <H2>Your device is in not initialized</H2>
            <p>Please use Bitcoin wallet interface to start initialization process</p>
            <a className="button" href="https://wallet.trezor.io/">Take me to the Bitcoin wallet</a>
        </div>
    </section>
);

export default connect(null, null)(Initialize);
