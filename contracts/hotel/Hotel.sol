pragma solidity ^0.4.24;

import "./AbstractHotel.sol";

/**
 * @title Hotel, contract for a Hotel registered in the WT network
 * @dev A contract that represents a hotel in the WT network. Inherits
 * from WT's 'AbstractHotel'.
 */
contract Hotel is AbstractHotel {

  bytes32 public contractType = bytes32("hotel");

  /**
   * @dev Constructor.
   * @param _manager address of hotel owner
   * @param _dataUri pointer to hotel data
   * @param _index originating WTIndex address
   */
  constructor(address _manager, string _dataUri, address _index) public {
    require(_manager != address(0));
    require(_index != address(0));
    require(bytes(_dataUri).length != 0);
    manager = _manager;
    index = _index;
    dataUri = _dataUri;
    partnerHotels = new address[](5);
    created = block.number;
  }

  function addPartnerHotel (address _partnerHotel) external returns (bool) {
    int firstEmptySlot = _checkIfAddressCanBeWrittenToPartnerHotel (_partnerHotel);
    require (firstEmptySlot != -1);

    partnerHotels[uint(firstEmptySlot)] = _partnerHotel;

    return true;
  }

  // sense check master function
  // note this uses an int as we want the position later on in the code ... -1 = "false" ... 0 and up = the first empty space
  function _checkIfAddressCanBeWrittenToPartnerHotel (address _partnerHotel) view public returns (int) {
    require(_partnerHotel != address(0));
    require(_checkPartnerHotelIsPresent(_partnerHotel) == false);

    int firstEmptySlot = _checkPartnerHotelsAreEmpty();
    require(firstEmptySlot != -1);

    return firstEmptySlot;
  }

  // checking there is 1 free space on our array to add our partner hotel
  // note this uses an int as we want the position later on in the code ... -1 = "false" ... 0 and up = the first empty space
  function _checkPartnerHotelsAreEmpty () view public returns (int) {

    //Check to see if we have a free item in our array
    uint itemsInPartnerHotel = 5;

    for (uint i=0; i<itemsInPartnerHotel; i++) {
      //Checking we have an empty space on our array of partner hotels
      if (partnerHotels[i] == address(0)) {
        return int(i); 
      } 
    }
    return -1;
  }

  // sense check to see if the partner hotel we want to add is already there
  function _checkPartnerHotelIsPresent (address _partnerHotel) view public returns (bool) {

    uint itemsInPartnerHotel = 5;

    for (uint i=0; i<itemsInPartnerHotel; i++) {
      //Checking to see if our partner hotel is already there
      if (partnerHotels[i] == _partnerHotel) {
        return true; 
      } 
    }
    return false;
  }

  function _editInfoImpl(string _dataUri) internal {
    require(bytes(_dataUri).length != 0);
    dataUri = _dataUri;
  }

  function _destroyImpl() internal {
    selfdestruct(manager);
  }

  function _changeManagerImpl(address _newManager) internal {
    require(_newManager != address(0));
    manager = _newManager;
  }

}
