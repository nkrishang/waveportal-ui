import * as React from "react";
import dotenv from 'dotenv';

import { useWeb3React, Web3ReactProvider } from "@web3-react/core";
import { Web3Provider } from "@ethersproject/providers";

import ConnectButton from "./components/ConnectButton";
import { Spinner } from "./components/Spinner";

import { waveportalContract, externalProvider } from "./utils/contract";
import { ethers } from "ethers";

dotenv.config()

function getLibrary(provider) {
  const library = new Web3Provider(provider);
  library.pollingInterval = 8000;
  return library;
}

export default function App() {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <ContractComponent />
    </Web3ReactProvider>
  );
}

function WaveLog({waver, timestamp, message}) {
  return (
    <div className="w-full border-2 border-purple-400 flex justify-between my-4">
      <div className="flex flex-col p-4">
        <p className="text-xl font-bold">
          Waver
        </p>
        <a className="text-lg text-blue-600 p-2" href={`https://rinkeby.etherscan.io/address/${waver}`} target="_blank" rel="noopener noreferrer">
          {waver.slice(0,4) + "..." + waver.slice(-4)}
        </a>
      </div>

      <div className="flex flex-col p-4">
        <p className="text-xl font-bold max-w-md">
          Waved at
        </p>
        <p className="text-lg p-2">
          {`${new Date(timestamp * 1000)}`}
        </p>
      </div>

      <div className="flex flex-col p-4 min-w-lg w-64">
        <p className="text-xl font-bold">
          Message
        </p>
        <a className="text-lg p-2" href={`https://rinkeby.etherscan.io/address/${waver}`} target="_blank" rel="noopener noreferrer">
          {message.length > 20 ? message.slice(0, 20) + "..." : message}
        </a>
      </div>
    </div>
  )
}

function ContractComponent() {

  const context = useWeb3React()
  const { library, account, active } = context;

  // User input
  const [waveMessage, setWaveMessage] = React.useState("");
  
  // State updated by listeners
  const [allWaves, setAllWaves] = React.useState([]);

  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {

    async function getAllWaves() {
      // Write query logic -> populate state vars on init.
      const filter = waveportalContract.filters.NewWave()
      const startBlock = 9074182;
      const endBlock = await externalProvider.getBlockNumber();

      const queryResult = await waveportalContract.queryFilter(filter, startBlock, endBlock);
      console.log(queryResult)
      const wavesUptilNow = queryResult.map(matchedEvent => {
        return (
          {
            waver: matchedEvent.args[0],
            timestamp: matchedEvent.args[1],
            message: matchedEvent.args[2]
          }
        )        
      })

      console.log("hello", wavesUptilNow)

      setAllWaves(wavesUptilNow.reverse())
    }

    getAllWaves()
  }, [])

  // Listen to `NewWave` and `PrizeWon`.
  React.useEffect(() => {

    waveportalContract.on("NewWave", (waver, timestamp, message) => {
      setAllWaves([{waver, timestamp, message}, ...allWaves]);
    })

    waveportalContract.on("PrizeWon", (winner, prizeAmount) => {
      if(winner == account) {
        const amt = ethers.utils.formatEther(prizeAmount)

        alert(`Congrats! You just won ${amt} ether for waving. Check your wallet balance :)`);
      }
    })

  }, [])

  async function sendWave() {
    if(library && account) {
      setLoading(true);

      try {

        const tx = await waveportalContract.connect(library.getSigner(account)).waveAtMe(waveMessage)
        window.alert(`You can view your transaction at https://rinkeby.etherscan.io/tx/${tx.hash}`)

        await tx.wait()

        setWaveMessage("")

      } catch(err) {
        window.alert(JSON.stringify(err))
      }

      setLoading(false)
    }
  }

  const waveButtonActive = active && account
  
  return (
    <div className="m-auto flex justify-center my-4" style={{maxWidth: "800px"}}>
      <div className="flex flex-col">

        <p className="text-6xl text-center font-black text-gray-900 py-8">
          Hey👋 I'm Krishang.
        </p>

        <p className="text-xl text-center font-light text-gray-700 py-8">
          Wave at me on the Ethereum blockchain! Maybe send a sweet message too? <br /> Connect your wallet,
          write your message, and then wave 👋.  
        </p>

        <div className="m-auto">
          {!account
            ? (
              <ConnectButton />
            )

            : (
              <div className="flex flex-col justify-center">
                <textarea
                placeholder="Enter your message here :)" 
                className="resize-none w-96 h-48 border-2 p-2 my-4" 
                value={waveMessage} 
                onChange={e => setWaveMessage(e.target.value)}

                />

                <button
                  disabled={!waveButtonActive}
                  className={`p-2 border ${!waveButtonActive ? "border-gray-300 text-gray-300" : "border-black"}`}
                  onClick={sendWave}
                >
                  {loading && (
                    <div className="m-auto flex justify-center">
                      <Spinner
                        color={"black"}
                        style={{ height: "25%", marginLeft: "-1rem" }}
                      />
                    </div>
                  )}

                  {!loading && (
                    <p>
                      Wave at me!
                    </p>
                  )}
                </button>
              </div>
            )
          }
        </div>

        <div className="m-auto flex flex-col justify-center py-8">
          <p className="text-4xl font-extrabold text-gray-800 py-4">
            Wave log 👀
          </p>
          <p>
            {"Check out all these people out here waving!"}
          </p>

          {allWaves.map(({waver, timestamp, message}) => <WaveLog key={timestamp} waver={waver} timestamp={timestamp} message={message}/>)}
        </div>
      </div>
    </div>
  );
}
