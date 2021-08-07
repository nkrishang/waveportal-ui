import * as React from "react";

import { useWeb3React, UnsupportedChainIdError } from "@web3-react/core";
import { NoEthereumProviderError, UserRejectedRequestError } from '@web3-react/injected-connector'

import { injected } from "../connectors";
import { useEagerConnect, useInactiveListener } from "../hooks";

import { Spinner } from "./Spinner";

export default function ConnectButton() {

  function getErrorMessage(error) {
    if (error instanceof NoEthereumProviderError) {
      return 'No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.'
    } else if (error instanceof UnsupportedChainIdError) {
      return "You're connected to an unsupported network.";
    } else if (error instanceof UserRejectedRequestError) {
      return "Please authorize this website to access your Ethereum account.";
    } else {
      console.log(error);
      return "An unknown error occurred. Check the console for more details.";
    }
  }

  const context = useWeb3React();
  const {
    connector,
    library,
    chainId,
    account,
    activate,
    deactivate,
    active,
    error
  } = context;

  // handle logic to recognize the connector currently being activated
  const [activatingConnector, setActivatingConnector] = React.useState(undefined);

  React.useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined);
    }

  }, [activatingConnector, connector]);

  React.useEffect(() => {
    if(!!error) {

      if(error instanceof UserRejectedRequestError) {
        deactivate()
      }

      window.alert(getErrorMessage(error))
    }
  }, [error])

  // handle logic to eagerly connect to the injected ethereum provider, if it exists and has granted access already
  const triedEager = useEagerConnect();

  // handle logic to connect in reaction to certain events on the injected ethereum provider, if it exists
  useInactiveListener(!triedEager || !!activatingConnector);

  const activating = injected === activatingConnector;
  const disabled = !triedEager || !!activatingConnector;

  function handleConnectRequest() {
    setActivatingConnector(injected);
    activate(injected);
  }

  function handleDisconnectRequest() {
    deactivate();
  }

  return (
    <div className="flex flex-col w-48">
      <button
        className={`px-4 py-4 border border-${active ? "green-500" : "black"} rounded`}
        disabled={disabled}
        onClick={!active ? handleConnectRequest : () => {}}
      >
        {activating && (
          <div className="m-auto flex justify-center">
            <Spinner
              color={"black"}
              style={{ height: "25%", marginLeft: "-1rem" }}
            />
          </div>
        )}

        {!activating && active && (
          <p>
            {account.slice(0,6) + "..." + account.slice(-6)}
          </p>
        )}

        {!activating && !active && (
          <p>
            Connect to MetaMask
          </p>
        )}
      </button>

      {!activating && active && (
        <button
          className="text-red-500 text-md underline"
          disabled={disabled}
          onClick={handleDisconnectRequest}
        >
          Disconnect
        </button>
      )}
    </div>
  )
}