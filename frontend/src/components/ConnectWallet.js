import React from "react";

export function ConnectWallet({ connectWallet, message, web3 }) {
    return (
        <div className="clearfix">
            <button className="btn btn-warning float-end" type="button" onClick={connectWallet} disabled={!web3}>
                {!message && "Connect Wallet"}
                {message}
            </button>
        </div>
    );
}
