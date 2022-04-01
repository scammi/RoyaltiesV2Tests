require('dotenv').config();

const { expect } = require("chai");
const { ethers } = require("hardhat");

const kovanAddresses = require('@charged-particles/protocol-subgraph/networks/kovan');
const prontonBAbi =  require('@charged-particles/protocol-subgraph/abis/ProtonB');
const chargedSettings =  require('@charged-particles/protocol-subgraph/abis/ChargedSettings');

const chargeStateAbi =  require('@charged-particles/protocol-subgraph/abis/ChargedState');

describe("V2", function () {
  const TOKEN_URI = 'https://gateway.pinata.cloud/ipfs/QmQxDjEhnYP6QAtLRyLV9N7dn1kDigz7iWnx5psmyXqy35/1';
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

  //Init wallet
  const walletMnemonic = new ethers.Wallet.fromMnemonic(process.env.MNEMONIC)
  const myWallet = walletMnemonic.connect(provider)

  // init contracts
  const protronBAdress = kovanAddresses.protonB.address;
  const protonContract = new ethers.Contract(protronBAdress, prontonBAbi, provider);
  const chargeSetting = new ethers.Contract(kovanAddresses.chargedSettings.address, chargedSettings, provider);
  // const chargeStateContract = new ethers.Contract(kovanAddresses.chargedState.address, chargeStateAbi);

  let protonId = 7;

  it("Creates new particles with 0% royalties", async() => {
    if(Boolean(protonId)) {
      protonId = await protonContract.connect(myWallet).callStatic.createBasicProton(
        myWallet.address,
        myWallet.address,
        TOKEN_URI 
      )
      console.log('New token:',protonId.toNumber(), '\n');
    
      const newProtonTrx = await protonContract.connect(myWallet).createBasicProton(
        myWallet.address, 
        myWallet.address,
        TOKEN_URI,
      );
      await newProtonTrx.wait();
      console.log('Proton created \n');
    
      const royaltiesOnStart = await protonContract.connect(myWallet).getCreatorRoyaltiesPct(protonId);
      const annuitiesOnStart = await chargeSetting.connect(myWallet).getCreatorAnnuities(protronBAdress, protonId);
      
      expect(royaltiesOnStart).to.equal(ethers.BigNumber.from("0"));
      expect(annuitiesOnStart?.value).to.equal(ethers.BigNumber.from("0"));
    }  

    // Set annuities
    const setNewAnnuityPercentage = await chargeSetting.connect(myWallet).setCreatorAnnuities(protronBAdress, protonId, myWallet.address, ethers.BigNumber.from("400"));
    await setNewAnnuityPercentage.wait()

    console.log(setNewAnnuityPercentage)

    // const newAnnuityPercentage = await chargeSetting.connect(myWallet).getCreatorAnnuities(protronBAdress, protonId);
    // console.log(newAnnuityPercentage);
    // console.log(newAnnuityPercentage?.value)

    // Set royalties
    // for( let royaltyPct = 100; royaltyPct <= 1000; royaltyPct += 100) {
    //   it(`Modify proton royalties to ${royaltyPct == 0 ? 0 : royaltyPct/10}%`, async function() {
  
    //     const setNewRoyaltyPercentage = await protonContract.connect(myWallet).setRoyaltiesPct(protonId, royaltyPct);
    //     await setNewRoyaltyPercentage.wait()
    
    //     const newSetRoyaltyPercentage = await protonContract.connect(myWallet).getCreatorRoyaltiesPct(protonId);
    //     expect(newSetRoyaltyPercentage).to.equal(ethers.BigNumber.from(newSetRoyaltyPercentage));
    //   })
    // }
  })

  





});
