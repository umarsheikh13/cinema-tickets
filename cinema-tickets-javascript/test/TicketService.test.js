import TicketService from '../src/pairtest/TicketService';
import InvalidPurchaseException from '../src/pairtest/lib/InvalidPurchaseException';
import TicketTypeRequest from '../src/pairtest/lib/TicketTypeRequest';
import TicketPaymentService from '../src/thirdparty/paymentgateway/TicketPaymentService';
import SeatReservationService from '../src/thirdparty/seatbooking/SeatReservationService';

describe('TicketService', () => {
  let ticketService;

  beforeEach(() => {
    ticketService = new TicketService(true);
  });

  describe('Validation', () => {
    it('should give an error if the account ID passed is zero', () => {
      expect(() => ticketService.purchaseTickets(0, [])).toThrow(InvalidPurchaseException);
    });

    it('should give an error if no tickets have been passed', () => {
      expect(() => ticketService.purchaseTickets(1, [])).toThrow(InvalidPurchaseException);
    });
  
    it('should give an error if non TicketTypeRequest tickets have been passed', () => {
      expect(() => ticketService.purchaseTickets(1, [{}])).toThrow(InvalidPurchaseException);
    });
  
    it('should give an error if child/infant tickets are being purchased without an adult ticket', () => {
      expect(() => ticketService.purchaseTickets(1, ...[
        new TicketTypeRequest('CHILD', 1),
        new TicketTypeRequest('INFANT', 1)
      ])).toThrow(InvalidPurchaseException);
    });
  
    it('should give an error if purchasing more than the maximum number of tickets allowed per transaction', () => {
      expect(() => ticketService.purchaseTickets(1, ...[...Array(21)].map(() => {
        new TicketTypeRequest('ADULT', 1)
      }))).toThrow(InvalidPurchaseException);
    });
  });

  describe('Purchasing', () => {
    let ticketPurchase;

    beforeEach(() => {
      ticketPurchase = ticketService.purchaseTickets(1, ...[
        new TicketTypeRequest('ADULT', 2), // £40 and 2 seats
        new TicketTypeRequest('CHILD', 1), // £10 and 1 seat
        new TicketTypeRequest('INFANT', 1) // £0 and 0 seats
      ]);
    });

    it('should equal the correct total price of all the tickets', () => {
      expect(ticketPurchase).toHaveProperty('totalAmount', 50);
    });
  
    it('should equal the correct total number of seats allocated', () => {
      expect(ticketPurchase).toHaveProperty('totalSeats', 3);
    });
  });
});

describe('TicketTypeRequest', () => {
  const ticketExample = new TicketTypeRequest('ADULT', 3);

  it('should give an error if ticket type is incorrect', () => {
    expect(() => new TicketTypeRequest('SENIOR', 1)).toThrow(TypeError);
  });

  it('should give the correct no. of tickets when using the method getNoOfTickets', () => {
    expect(ticketExample.getNoOfTickets()).toBe(3);
  });

  it('should give the correct ticket type when using the method getTicketType', () => {
    expect(ticketExample.getTicketType()).toBe('ADULT');
  });

  it('should give an error if no. of tickets is not an integer', () => {
    expect(() => new TicketTypeRequest('ADULT', '1')).toThrow(TypeError);
  });
});

describe('TicketPaymentService', () => {
  it('should give an error if accountId is not an integer', () => {
    expect(() => TicketPaymentService.makePayment('1', 1)).toThrow(TypeError);
  });

  it('should give an error if totalAmountToPay is not an integer', () => {
    expect(() => TicketPaymentService.makePayment(1, '1')).toThrow(TypeError);
  });
});

describe('SeatReservationService', () => {
  it('should give an error if accountId is not an integer', () => {
    expect(() => SeatReservationService.reserveSeat('1', 1)).toThrow(TypeError);
  });

  it('should give an error if totalSeatsToAllocate is not an integer', () => {
    expect(() => SeatReservationService.reserveSeat(1, '1')).toThrow(TypeError);
  });
});
