import React from "react";

export function ConnectWallet({ connectWallet, selectedAddress }) {
    return (
        <div className="clearfix">
            <button className="btn btn-warning float-end" type="button" onClick={connectWallet}>
                {!selectedAddress && "Connect Wallet"}
                {selectedAddress}
            </button>
        </div>
    );
}
