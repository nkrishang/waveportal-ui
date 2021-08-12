import * as React from "react";
import { ethers } from "ethers";
import dotenv from 'dotenv'

import abi from "./utils/WavePortal.json"

import { Spinner } from "./components/Spinner";

dotenv.config()

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
        <p className="text-lg p-2">
          {message.length > 20 ? message.slice(0, 20) + "..." : message}
        </p>
      </div>
    </div>
  )
}

export default function App() {

  // User input
  const [waveMessage, setWaveMessage] = React.useState("");
  
  // State updated by listeners
  const [currentAccount, setCurrentAccount] = React.useState('');
  const [allWaves, setAllWaves] = React.useState([]);
  const [loading, setLoading] = React.useState(false)

  // Contract variables
  const contractAddress = "0xd98840ecb01bdF2520B3418F2409709b6336b579"
  const contractABI = abi;

  async function getAllWaves() {

    const externalProvider = new ethers.providers.JsonRpcProvider(
      `https://eth-rinkeby.alchemyapi.io/v2/${process.env.REACT_APP_ALCHEMY_KEY}`,
      "rinkeby"
    );
    const waveportalContract = new ethers.Contract(contractAddress, contractABI, externalProvider);
    

    const filter = waveportalContract.filters.NewWave()
    const startBlock = 9074182; // Contract creation block.
    const endBlock = await externalProvider.getBlockNumber();
    
    console.log("hllo", endBlock)

    const queryResult = await waveportalContract.queryFilter(filter, startBlock, endBlock);
    
    const wavesUptilNow = queryResult.map(matchedEvent => {
      return (
        {
          waver: matchedEvent.args[0],
          timestamp: matchedEvent.args[1],
          message: matchedEvent.args[2]
        }
      )        
    })

    console.log(queryResult)

    setAllWaves(wavesUptilNow.reverse())
  }

  // Get data about all waves that have come before.
  React.useEffect(() => {
    getAllWaves()
  }, [])

  // Initialize listeners and check if already connected to Metamask.
  React.useEffect(() => {

    if(typeof window.ethereum !== undefined) {

      const { ethereum } = window;

      const externalProvider = new ethers.providers.JsonRpcProvider(
        `https://eth-rinkeby.alchemyapi.io/v2/${process.env.REACT_APP_ALCHEMY_KEY}`,
        "rinkeby"
      );
      const waveportalContract = new ethers.Contract(contractAddress, contractABI, externalProvider);
      
      // Check if already connected with metamask
      ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if(!!accounts.length) {
            const account = accounts[0];
            setCurrentAccount(account);
          }
        })      

      // Initialize listeners

      ethereum.on("chainChanged", (chainId) => {
        // Only Rinkeby
        if(chainId != 4) {
          alert("Please switch to the Rinkeby network to use the webapp.");
        }
      })

      ethereum.on("accountsChanged", (accounts) => {

        if(accounts.length == 0) {
          setCurrentAccount('')
        } else {
          const account = accounts[0];
          setCurrentAccount(account);
        }        
      })

      waveportalContract.on("NewWave", (waver, timestamp, message) => {
        setAllWaves([{waver, timestamp, message}, ...allWaves]);
      })
  
      waveportalContract.on("PrizeWon", (winner, prizeAmount) => {
        if(winner == currentAccount) {
          const amt = ethers.utils.formatEther(prizeAmount)
  
          alert(`Congrats! You just won ${amt} ether for waving. Check your wallet balance :)`);
        }
      })
    }

  }, [])

  // Connect to metamask
  async function connectToMetamask() {
    const { ethereum } = window;

    if(!ethereum) {
      alert("Please install Metamask to continue using the webapp.");
    }

    setLoading(true)

    ethereum.request({ method: 'eth_requestAccounts' })
      .then(accounts => {
        console.log(accounts[0])
        setLoading(false)
      })
      .catch(err => alert(
        err.message
      ));
  }
  
  async function sendWave() {
    if(typeof window.ethereum !== undefined) {

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner()
      const waveportalContract = new ethers.Contract(contractAddress, contractABI, signer);

      setLoading(true);

      try {

        const tx = await waveportalContract.waveAtMe(waveMessage, { gasLimit: 100000 })
        alert(`You can view your transaction at https://rinkeby.etherscan.io/tx/${tx.hash}`)

        await tx.wait()

        setWaveMessage("")

      } catch(err) {
        alert(err.message)
      }

      setLoading(false)
    }
  }

  const waveButtonActive = !!currentAccount
  
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
          {!currentAccount
            ? (
              <button onClick={connectToMetamask} className="border border-black p-4">
                Connect to Metamask
              </button>
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
