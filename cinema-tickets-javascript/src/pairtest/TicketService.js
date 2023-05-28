import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService';
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService';

export default class TicketService {

  /**
   * Dry run flag
   */
  #dryRun = false;

  /**
   * Total price of tickets
   */
  #totalAmount = 0;

  /**
   * Total number of seats
   */
  #totalSeats = 0;

  /**
   * The allowed ticket types
   */
  #ticketTypes = {
    ADULT: {
      price: 20,
      seatAllocation: 1
    },
    CHILD: {
      price: 10,
      seatAllocation: 1
    },
    INFANT: {
      price: 0,
      seatAllocation: 0
    }
  };

  /**
   * The payment service reference
   */
  #paymentService;

  /**
   * The reservation service reference
   */
  #reservationService;

  /**
   * Initialise the class by setting the service properties
   */
  constructor(dryRun) {
    this.#paymentService = new TicketPaymentService();
    this.#reservationService = new SeatReservationService();
    if (dryRun) {
      this.#dryRun = true;
    }
  }

  /**
   * Allows you to purchase and reserve cinema tickets
   * @param   {integer}            accountId           The account ID
   * @param   {TicketTypeRequest}  ticketTypeRequests  The ticket requests to purchase
   * @return  {object}                                 The summary values of the tickets purchased
   */
  purchaseTickets(accountId, ...ticketTypeRequests) {
    if (!(Number.isInteger(accountId) && accountId > 0)) {
      throw new InvalidPurchaseException('Account ID is invalid');
    }

    // Check if the ticket requests are valid before
    // continuing to purchase and reserve

    this.#validateTickets(ticketTypeRequests);

    // Add up the total amount and seats

    for (const ticket of ticketTypeRequests) {
      this.#totalAmount += this.#ticketTypes[ticket.getTicketType()].price * ticket.getNoOfTickets();
      this.#totalSeats += this.#ticketTypes[ticket.getTicketType()].seatAllocation * ticket.getNoOfTickets();
    }

    // Purchase, reserve and return summary

    if (this.#dryRun) {
      return {
        accountId,
        totalAmount: this.#totalAmount,
        totalSeats: this.#totalSeats
      };
    } else {
      this.#makePaymentAndReserveSeats(accountId, this.#totalAmount, this.#totalSeats);
    }
  }

  /**
   * Validate the ticket requests
   * @param   {TicketTypeRequest[]}  tickets  The ticket requests
   * @return  {TicketTypeRequest[]}           The validated ticket requests
   */
  #validateTickets(tickets) {
    const noOfTickets = {
      ADULT: 0,
      CHILD: 0,
      INFANT: 0
    };

    // Check if the tickets are a non empty array

    if (!(Array.isArray(tickets) && tickets.length > 0)) {
      throw new InvalidPurchaseException('No tickets have been found to purchase');
    }

    // Go through the ticket requests and validate them

    for (const ticket of tickets) {
      if (!(ticket instanceof TicketTypeRequest)) {
        throw new InvalidPurchaseException('Ticket is not an instance of TicketTypeRequest');
      }

      noOfTickets[ticket.getTicketType()] += 1;
    }

    if ((noOfTickets.CHILD > 0 || noOfTickets.INFANT > 0) && noOfTickets.ADULT === 0) {
      throw new InvalidPurchaseException('Cannot purchase child/infant tickets without at least 1 adult ticket');
    }

    if ((noOfTickets.ADULT + noOfTickets.CHILD + noOfTickets.INFANT) > 20) {
      throw new InvalidPurchaseException('Only 20 tickets can be purchased at one time');
    }

    return tickets;
  }

  /**
   * Make the payment and reserve the seats
   * @return  {void}
   */
  #makePaymentAndReserveSeats(accountId, totalAmount, totalSeats) {
    this.#paymentService.makePayment(accountId, totalAmount);
    this.#reservationService.reserveSeat(accountId, totalSeats);
  }

}
