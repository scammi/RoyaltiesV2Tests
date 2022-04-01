require('dotenv').config();

const { expect } = require("chai");
const { ethers } = require("hardhat");

const daiABI = require('../abis/dai');
const prontonBAbi =  require('@charged-particles/protocol-subgraph/abis/ProtonB');
const chargedSettings =  require('@charged-particles/protocol-subgraph/abis/ChargedSettings');
const chargedParticlesABI =  require('@charged-particles/protocol-subgraph/abis/ChargedParticles');
const chargeStateAbi =  require('@charged-particles/protocol-subgraph/abis/ChargedState');

const kovanAddresses = require('@charged-particles/protocol-subgraph/networks/kovan');
const daiAddress = '0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD';
const protonBAddress = kovanAddresses.protonB.address;
const chargedParticlesAddress = kovanAddresses.chargedParticles.address;

describe("V2", function () {
  const TOKEN_URI = 'https://gateway.pinata.cloud/ipfs/QmQxDjEhnYP6QAtLRyLV9N7dn1kDigz7iWnx5psmyXqy35/1';
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

  //Init wallet
  const walletMnemonic = new ethers.Wallet.fromMnemonic(process.env.MNEMONIC)
  const myWallet = walletMnemonic.connect(provider)
  // 0x6d46b37708da7ed4e5c4509495768fecd3d17c01

  // init contracts
  const protonBContract = new ethers.Contract(protonBAddress, prontonBAbi, provider);
  const chargedParticlesContract = new ethers.Contract(chargedParticlesAddress, chargedParticlesABI, provider);
  const chargeSetting = new ethers.Contract(kovanAddresses.chargedSettings.address, chargedSettings, provider);
  const dai = new ethers.Contract(daiAddress, daiABI, provider);
  const chargeStateContract = new ethers.Contract(kovanAddresses.chargedState.address, chargeStateAbi);

  let protonId = 7;
  it("Creates new particles with 0% royalties & annuities", async() => {
    if(!Boolean(protonId)) {
      protonId = await protonBContract.connect(myWallet).callStatic.createBasicProton(
        myWallet.address,
        myWallet.address,
        TOKEN_URI 
      )
      console.log('New token:',protonId.toNumber(), '\n');
    
      const newProtonTrx = await protonBContract.connect(myWallet).createBasicProton(
        myWallet.address, 
        myWallet.address,
        TOKEN_URI,
      );
      await newProtonTrx.wait();
      console.log('Proton created \n');
    
      // const royaltiesOnStart = await protonBContract.connect(myWallet).getCreatorRoyaltiesPct(protonId);
      // const annuitiesOnStart = await chargeSetting.connect(myWallet).getCreatorAnnuities(protonBAddress, protonId);
      
      // expect(royaltiesOnStart).to.equal(ethers.BigNumber.from("0"));
      // expect(annuitiesOnStart?.value).to.equal(ethers.BigNumber.from("0"));
    }  
    
    // Set royalties
    // for( let royaltyPct = 100; royaltyPct <= 1000; royaltyPct += 100) {
      //   it(`Modify proton royalties to ${royaltyPct == 0 ? 0 : royaltyPct/10}%`, async function() {
  
        //     const setNewRoyaltyPercentage = await protonBContract.connect(myWallet).setRoyaltiesPct(protonId, royaltyPct);
    //     await setNewRoyaltyPercentage.wait()
    
    //     const newSetRoyaltyPercentage = await protonBContract.connect(myWallet).getCreatorRoyaltiesPct(protonId);
    //     expect(newSetRoyaltyPercentage).to.equal(ethers.BigNumber.from(newSetRoyaltyPercentage));
    //   })
    // }
  })
  
  it("Should sets the annuities to 40%", async() => {
    
    // Set annuities
    // const setNewAnnuityPercentage = await chargeSetting.connect(myWallet).setCreatorAnnuities(protonBAddress, protonId, myWallet.address, ethers.BigNumber.from("400"));
    // await setNewAnnuityPercentage.wait()
    
    // console.log(setNewAnnuityPercentage)
    // console.log(newAnnuityPercentage?.value)
  });

  it('Redirect royalties', async() => {
    // Allow amount
    const allowDai = await dai.connect(myWallet)['approve(address,uint256)'](protonBAddress, ethers.utils.parseEther('1'));
    await allowDai.wait()

    const newEnergizeProtonID = await protonBContract.connect(myWallet).callStatic.createBasicProton(
      myWallet.address,
      myWallet.address,
      TOKEN_URI 
    );

    console.log('New token:',newEnergizeProtonID.toNumber(), '\n');
    const newEnergizeProtonTrx = await protonBContract.connect(myWallet).createChargedParticle(
      myWallet.address, 
      myWallet.address,
      '0x6d46b37708da7ed4e5c4509495768fecd3d17c01', //referer
      TOKEN_URI,
      'aave',
      daiAddress,
      ethers.utils.parseEther('1'),
      1000 //annuity
    );
    await newEnergizeProtonTrx.wait();

    // console.log(newEnergizeProtonTrx);
 
    await chargedParticlesContract.connect(myWallet).releaseParticle(
      myWallet.address,
      protonBAddress,
      newEnergizeProtonID,
      'aave',
      daiAddress
    );
    
    console.log(await dai.balanceOf('0x6d46b37708da7ed4e5c4509495768fecd3d17c01'));

    // expect(await dai.balanceOf('0x6d46b37708da7ed4e5c4509495768fecd3d17c01')).to.be.above(toWei('.1'));

  });
  // const energizedParticleId = await callAndReturn({
  //   contractInstance: proton,
  //   contractMethod: 'createChargedParticle',
  //   contractCaller: signer1,
  //   contractParams: [
  //     user1,                        // creator
  //     user2,                        // receiver
  //     user3,                        // referrer
  //     TEST_NFT_TOKEN_URI,           // tokenMetaUri
  //     'aave',                       // walletManagerId
  //     daiAddress,                   // assetToken
  //     toWei('10'),                  // assetAmount
  //     annuityPct,                   // annuityPercent
  //   ],
  // });

  // await tokenInfoProxyMock.mock.getTokenOwner.withArgs(proton.address, energizedParticleId.toString()).returns(user2);
  // await chargedParticles.connect(signer2).releaseParticle(
  //   user2,
  //   proton.address,
  //   energizedParticleId,
  //   'aave',
  //   daiAddress
  // );

  // expect(await dai.balanceOf(user2)).to.be.above(toWei('9.9'));



});
