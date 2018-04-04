const assert = require('chai').assert;
const help = require('./helpers/index.js');
const abiDecoder = require('abi-decoder');

const WTIndex = artifacts.require('WTIndex.sol');
const WTHotel = artifacts.require('Hotel.sol');
const WTHotelInterface = artifacts.require('Hotel_Interface.sol');
const BaseInterface = artifacts.require('Base_Interface.sol');

abiDecoder.addABI(WTHotelInterface._json.abi);
abiDecoder.addABI(WTIndex._json.abi);

contract('Hotel', (accounts) => {
  const hotelUrl = 'bzz://something';
  const hotelAccount = accounts[2];
  const nonOwnerAccount = accounts[3];
  let hotelAddress = help.zeroAddress;
  let wtIndex;
  let wtHotel;

  describe('Constructor', () => {
    // Create and register a hotel
    beforeEach(async () => {
      wtIndex = await WTIndex.new();
      await wtIndex.registerHotel(hotelUrl, { from: hotelAccount });
      let address = await wtIndex.getHotelsByManager(hotelAccount);
      hotelAddress = address[0];
      wtHotel = WTHotel.at(address[0]);
    });

    it('should be initialised with the correct data', async () => {
      const info = await help.getHotelInfo(wtHotel);
      assert.equal(info.url, hotelUrl);
      // We need callback, because getBlockNumber for some reason cannot be called with await
      const blockNumber = await help.promisify(cb => web3.eth.getBlockNumber(cb));
      assert.isAtMost(info.created, blockNumber);
      assert.equal(info.manager, hotelAccount);
      assert.equal((await wtIndex.getHotels()).length, 2);
    });

    it('should be indexed', async () => {
      assert.equal(wtIndex.contract.address, await wtHotel.owner());
      assert.equal(hotelAccount, await wtHotel.manager());
    });

    it('should have the correct version and contract type', async () => {
      let base = await BaseInterface.at(wtHotel.address);
      assert.equal(help.bytes32ToString(await base.version()), help.version);
      assert.equal(help.bytes32ToString(await base.contractType()), 'hotel');
    });

    it('should not be created with zero address for a manager', async () => {
      try {
        await WTHotel.new(help.zeroAddress, 'goo.gl');
        throw new Error('should not have been called');
      } catch (e) {
        assert(help.isInvalidOpcodeEx(e));
      }
    });
  });

  describe('editInfo', () => {
    const newUrl = 'goo.gl/12345';

    it('should not update hotel to an empty url', async () => {
      try {
        const data = await wtHotel.contract.editInfo.getData('');
        await wtIndex.callHotel(hotelAddress, data, { from: hotelAccount });
        throw new Error('should not have been called');
      } catch (e) {
        assert(help.isInvalidOpcodeEx(e));
      }
    });

    it('should update hotel\'s url', async () => {
      const data = wtHotel.contract.editInfo.getData(newUrl);
      await wtIndex.callHotel(hotelAddress, data, { from: hotelAccount });
      const info = await help.getHotelInfo(wtHotel);
      assert.equal(info.url, newUrl);
    });

    it('should throw if not executed by owner', async () => {
      try {
        await wtHotel.editInfo(newUrl, { from: nonOwnerAccount });
        throw new Error('should not have been called');
      } catch (e) {
        assert(help.isInvalidOpcodeEx(e));
      }
    });
  });
});
