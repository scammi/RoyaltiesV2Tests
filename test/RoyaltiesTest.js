require('dotenv').config();

const { expect } = require("chai");
const { ethers } = require("hardhat");

const kovanAddresses = require('@charged-particles/protocol-subgraph/networks/kovan');
const prontonBAbi =  require('@charged-particles/protocol-subgraph/abis/ProtonB');
const chargeStateAbi =  require('@charged-particles/protocol-subgraph/abis/ChargedState');

describe("V2", function () {
  const TOKEN_URI = 'https://gateway.pinata.cloud/ipfs/QmQxDjEhnYP6QAtLRyLV9N7dn1kDigz7iWnx5psmyXqy35/1';
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

  //Init wallet
  const walletMnemonic = new ethers.Wallet.fromMnemonic(process.env.MNEMONIC)
  const myWallet = walletMnemonic.connect(provider)

  // init contracts
  const protonContract = new ethers.Contract(kovanAddresses.proton.address, prontonBAbi, provider);
  // const chargeStateContract = new ethers.Contract(kovanAddresses.chargedState.address, chargeStateAbi);

  it("Sets royalties from 0", async function () {
    // init addresses
    const recipientWallet = ethers.Wallet.createRandom();
    const recipientWalletAddress = recipientWallet.address;
  
    // create
    const newProtonId = await protonContract.connect(myWallet).callStatic.createBasicProton(
      myWallet.address,
      myWallet.address,
      TOKEN_URI 
    )
    console.log('New token:',newProtonId.toNumber(), '\n');

    const newProtonTrx = await protonContract.connect(myWallet).createBasicProton(
      myWallet.address, 
      myWallet.address,
      TOKEN_URI,
    );
    await newProtonTrx.wait();
    console.log('Proton created \n');

    const royaltiesOnStart = await protonContract.connect(myWallet).getCreatorRoyaltiesPct(newProtonId);
    // const receiptRoyaltiesOnStart = await royaltiesOnStart.wait();
    expect(royaltiesOnStart).to.equal(ethers.BigNumber.from("0"));

    for( let pc = 100; pc <= 1000; pc += 100) {
      console.log('PERCETAGE ',pc)
      const setNewRoyaltyPercentage = await protonContract.connect(myWallet).setRoyaltiesPct(newProtonId, pc);
      await setNewRoyaltyPercentage.wait()
  
      const newSetRoyaltyPercentage = await protonContract.connect(myWallet).getCreatorRoyaltiesPct(newProtonId);
      expect(newSetRoyaltyPercentage).to.equal(ethers.BigNumber.from(newSetRoyaltyPercentage));
    }
    // console.log(royaltiesOnFive, receiptRoyaltiesOnFive);
    // console.log(getRoyaltiesOnFive);


  });
});
