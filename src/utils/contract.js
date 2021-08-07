import { ethers } from 'ethers';
import contractABI from './WavePortal.json';

export const externalProvider = new ethers.providers.JsonRpcProvider(
  `https://eth-rinkeby.alchemyapi.io/v2/${process.env.REACT_APP_ALCHEMY_KEY}`,
  "rinkeby"
);
const contractAddress = "0xd98840ecb01bdF2520B3418F2409709b6336b579" 

export const waveportalContract = new ethers.Contract(contractAddress, contractABI, externalProvider)